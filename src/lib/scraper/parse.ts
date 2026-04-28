import * as cheerio from "cheerio";

// In-memory circuit breaker (per isolate). Effective within a warm Cloudflare
// instance and for the duration of a CLI run. For durable persistence we
// could move this to Edge Config or Supabase, but in-memory is sufficient
// today.
const blockedDomains = new Map<string, number>();
const CIRCUIT_BREAKER_TTL_MS = 5 * 60 * 1000;

export function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function isCircuitOpen(domain: string): boolean {
  const blockedAt = blockedDomains.get(domain);
  if (!blockedAt) return false;
  if (Date.now() - blockedAt > CIRCUIT_BREAKER_TTL_MS) {
    blockedDomains.delete(domain);
    return false;
  }
  return true;
}

function tripCircuit(domain: string): void {
  blockedDomains.set(domain, Date.now());
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  { maxAttempts = 2, timeoutMs = 15000, initialDelayMs = 1000 } = {},
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(url, options, timeoutMs);
      if (res.status === 403 || res.status === 404) return res;
      if (res.ok) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (lastError.name === "AbortError") {
        lastError = new Error(`Request timed out after ${timeoutMs}ms`);
      }
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((r) =>
        setTimeout(r, initialDelayMs * Math.pow(2, attempt)),
      );
    }
  }
  throw lastError || new Error("Fetch failed");
}

// Tiered ScrapingBee call. Standard tier (render_js only) is ~5 credits;
// premium adds premium_proxy at ~30 credits. Try standard first, escalate
// to premium on failure — most blocks resolve at the cheap tier, so this
// stretches the credit budget ~5x without sacrificing the hard-case ceiling.
async function fetchScrapingBee(
  url: string,
  apiKey: string,
  tier: "standard" | "premium",
): Promise<Response> {
  const params: Record<string, string> = {
    api_key: apiKey,
    url,
    render_js: "true",
  };
  if (tier === "premium") params.premium_proxy = "true";
  const sbUrl = `https://app.scrapingbee.com/api/v1?${new URLSearchParams(params)}`;
  return fetchWithTimeout(sbUrl, {}, 30000);
}

// Run standard tier first; if it fails (network error or non-OK response),
// fall back to premium. Returns the successful response, or the last error /
// non-OK response observed if both tiers failed.
async function fetchScrapingBeeWithEscalation(
  url: string,
  apiKey: string,
  result: FetchResult,
): Promise<Response | null> {
  for (const tier of ["standard", "premium"] as const) {
    try {
      result.fetchAttempts++;
      const res = await fetchScrapingBee(url, apiKey, tier);
      if (res.ok) {
        result.scrapingBeeTier = tier;
        return res;
      }
      result.errors.push(`ScrapingBee (${tier}) returned ${res.status}`);
    } catch (err) {
      result.errors.push(
        `ScrapingBee (${tier}) failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
  return null;
}

const DIRECT_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export interface FetchResult {
  html: string | null;
  method: "direct" | "scrapingbee" | "blocked";
  errors: string[];
  fetchAttempts: number;
  circuitBreakerTripped: boolean;
  domain: string;
  // Set when method === "scrapingbee" — which tier ultimately succeeded.
  // Useful for credit-spend observability if we ever want to track it.
  scrapingBeeTier?: "standard" | "premium";
}

export async function fetchPageWithFallback(
  url: string,
  opts: { scrapingBeeKey?: string } = {},
): Promise<FetchResult> {
  const domain = getDomain(url);
  const result: FetchResult = {
    html: null,
    method: "direct",
    errors: [],
    fetchAttempts: 0,
    circuitBreakerTripped: false,
    domain,
  };
  const sbKey = opts.scrapingBeeKey;

  if (isCircuitOpen(domain)) {
    result.circuitBreakerTripped = true;
    result.errors.push(`Circuit breaker open for ${domain}`);
    if (!sbKey) {
      result.method = "blocked";
      return result;
    }
    result.method = "scrapingbee";
    const sbRes = await fetchScrapingBeeWithEscalation(url, sbKey, result);
    if (!sbRes) {
      result.method = "blocked";
      return result;
    }
    result.html = await sbRes.text();
    return result;
  }

  let directRes: Response;
  try {
    result.fetchAttempts++;
    directRes = await fetchWithRetry(
      url,
      { headers: DIRECT_HEADERS, redirect: "follow" },
      { maxAttempts: 2, timeoutMs: 15000 },
    );
  } catch (err) {
    result.errors.push(
      `Direct fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    );
    tripCircuit(domain);
    result.method = "blocked";
    return result;
  }

  // Reject any non-OK direct response. Previously only 403 was treated as
  // blocked; 404 (and 5xx after retry) fell through to text() and the resulting
  // error page was sent to Anthropic for "extraction" — wasted token spend at
  // best, hallucinated recipes from nav/footer text at worst.
  if (!directRes.ok) {
    result.errors.push(
      `Direct fetch returned ${directRes.status} for ${domain}`,
    );
    if (directRes.status === 403) tripCircuit(domain);

    // ScrapingBee is only worth trying for 403 (anti-bot blocks). 404 / 5xx
    // are real failures the proxy can't fix; mark blocked and bail.
    if (directRes.status !== 403 || !sbKey) {
      result.method = "blocked";
      return result;
    }
    result.method = "scrapingbee";
    const sbRes = await fetchScrapingBeeWithEscalation(url, sbKey, result);
    if (!sbRes) {
      result.method = "blocked";
      return result;
    }
    result.html = await sbRes.text();
    return result;
  }

  result.method = "direct";
  result.html = await directRes.text();
  return result;
}

export interface ParsedRecipeContent {
  jsonLd: Record<string, unknown> | null;
  bodyText: string;
  imageUrl: string | null;
}

export function parseRecipeHtml(html: string): ParsedRecipeContent {
  const $ = cheerio.load(html);

  let jsonLd: Record<string, unknown> | null = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || "");
      const items = Array.isArray(data) ? data : data["@graph"] || [data];
      for (const item of items) {
        if (
          item["@type"] === "Recipe" ||
          (Array.isArray(item["@type"]) && item["@type"].includes("Recipe"))
        ) {
          jsonLd = item;
        }
      }
    } catch {
      /* ignore malformed JSON-LD */
    }
  });

  $("script, style, nav, footer, header, aside").remove();
  const bodyText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 10000);

  let imageUrl: string | null = null;
  if (jsonLd?.["image"]) {
    const img = jsonLd["image"];
    imageUrl = Array.isArray(img)
      ? typeof img[0] === "string"
        ? img[0]
        : (img[0] as Record<string, string>)?.url
      : typeof img === "string"
        ? img
        : (img as Record<string, string>)?.url;
  }
  if (!imageUrl) {
    imageUrl = $('meta[property="og:image"]').attr("content") || null;
  }
  if (!imageUrl) {
    imageUrl = $('meta[name="twitter:image"]').attr("content") || null;
  }
  if (!imageUrl) {
    const candidates = $(
      "article img, .recipe img, .post img, main img, .hero img, [class*=recipe] img, [class*=featured] img, .entry-content img",
    );
    const heroImg =
      candidates.first().attr("src") ||
      candidates.first().attr("data-src") ||
      candidates.first().attr("data-lazy-src");
    if (heroImg) imageUrl = heroImg;
  }

  if (imageUrl && /^https?:\/\/i\d\.wp\.com\//.test(imageUrl)) {
    imageUrl = imageUrl.replace(/^https?:\/\/i\d\.wp\.com\//, "https://");
  }

  return { jsonLd, bodyText, imageUrl };
}

export async function findPexelsFallbackImage(
  recipeName: string,
  apiKey: string,
): Promise<string | null> {
  const searchQuery = recipeName.replace(/[^a-zA-Z\s]/g, "").trim();
  try {
    const res = await fetchWithTimeout(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery + " food")}&per_page=1&orientation=landscape`,
      { headers: { Authorization: apiKey } },
      10000,
    );
    if (!res.ok) return null;
    const data = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.large ?? null;
  } catch {
    return null;
  }
}
