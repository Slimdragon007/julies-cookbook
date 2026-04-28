import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPageWithFallback } from "../scraper/parse";

// Each test installs a fetch mock via a queue of canned Response handlers
// keyed loosely by URL substring. The scraper makes at most 3 fetches per
// run (direct + SB-standard + SB-premium), so a small queue is enough.
type Handler = (url: string) => Response | Promise<Response>;

function installFetch(handlers: Handler[]) {
  let i = 0;
  const calls: string[] = [];
  globalThis.fetch = vi.fn(async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    calls.push(url);
    const handler = handlers[i++];
    if (!handler) throw new Error(`Unexpected extra fetch: ${url}`);
    return handler(url);
  }) as typeof globalThis.fetch;
  return calls;
}

function htmlOk(body = "<html><body>recipe</body></html>") {
  return new Response(body, { status: 200 });
}

describe("fetchPageWithFallback — ScrapingBee tier escalation", () => {
  let originalFetch: typeof globalThis.fetch;
  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it("uses standard tier when direct returns 403 and standard SB succeeds", async () => {
    // Use a unique domain per test so the in-memory circuit breaker doesn't
    // leak state across runs (5min TTL — would corrupt later assertions).
    const url = "https://standard-success.test/recipe";
    const calls = installFetch([
      () => new Response("blocked", { status: 403 }),
      htmlOk,
    ]);

    const result = await fetchPageWithFallback(url, {
      scrapingBeeKey: "fake-key",
    });

    expect(result.method).toBe("scrapingbee");
    expect(result.scrapingBeeTier).toBe("standard");
    expect(result.html).toContain("recipe");
    expect(result.fetchAttempts).toBe(2);
    expect(calls[1]).toContain("scrapingbee.com");
    expect(calls[1]).toContain("render_js=true");
    expect(calls[1]).not.toContain("premium_proxy");
  });

  it("escalates to premium when standard SB fails", async () => {
    const url = "https://escalate-success.test/recipe";
    const calls = installFetch([
      () => new Response("blocked", { status: 403 }),
      () => new Response("sb error", { status: 500 }),
      htmlOk,
    ]);

    const result = await fetchPageWithFallback(url, {
      scrapingBeeKey: "fake-key",
    });

    expect(result.method).toBe("scrapingbee");
    expect(result.scrapingBeeTier).toBe("premium");
    expect(result.html).toContain("recipe");
    expect(result.fetchAttempts).toBe(3);
    expect(calls[2]).toContain("premium_proxy=true");
    expect(result.errors.some((e) => e.includes("standard"))).toBe(true);
  });

  it("returns blocked when both tiers fail", async () => {
    const url = "https://both-fail.test/recipe";
    installFetch([
      () => new Response("blocked", { status: 403 }),
      () => new Response("sb error", { status: 500 }),
      () => new Response("sb error", { status: 500 }),
    ]);

    const result = await fetchPageWithFallback(url, {
      scrapingBeeKey: "fake-key",
    });

    expect(result.method).toBe("blocked");
    expect(result.scrapingBeeTier).toBeUndefined();
    expect(result.html).toBeNull();
    expect(result.fetchAttempts).toBe(3);
    expect(result.errors.some((e) => e.includes("standard"))).toBe(true);
    expect(result.errors.some((e) => e.includes("premium"))).toBe(true);
  });
});
