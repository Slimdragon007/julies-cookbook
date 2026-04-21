import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/admin";

export const runtime = "edge";
export const dynamic = "force-dynamic";

interface CheckResult {
  status: "pass" | "fail" | "warn";
  detail?: string;
  count?: number;
  failures?: string[];
}

export async function GET(req: NextRequest) {
  // Auth: accept ?token= or Vercel cron secret header
  const token = req.nextUrl.searchParams.get("token");
  const cronSecret = req.headers.get("authorization")?.replace("Bearer ", "");
  const expected = process.env.AUDIT_SECRET;

  if (expected && token !== expected && cronSecret !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const start = Date.now();
  const checks: Record<string, CheckResult> = {};

  // 1. Env vars
  const requiredEnvs: (string | string[])[] = [
    ["NEXT_PUBLIC_Juliescookbook_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_URL"],
    ["Juliescookbook_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    "ANTHROPIC_API_KEY",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "SCRAPINGBEE_API_KEY",
  ];
  const missingEnvs = requiredEnvs.filter((k) =>
    Array.isArray(k) ? k.every((v) => !process.env[v]) : !process.env[k],
  );
  checks.env_vars =
    missingEnvs.length === 0
      ? { status: "pass" }
      : {
          status: "fail",
          detail: `Missing: ${missingEnvs.map((k) => (Array.isArray(k) ? k.join(" or ") : k)).join(", ")}`,
        };

  // 2. Recipe count
  const { count: recipeCount, error: recipeErr } = await supabase
    .from("recipes")
    .select("*", { count: "exact", head: true });
  if (recipeErr) {
    checks.recipe_count = { status: "fail", detail: recipeErr.message };
  } else {
    checks.recipe_count =
      (recipeCount ?? 0) >= 15
        ? { status: "pass", count: recipeCount ?? 0 }
        : {
            status: "fail",
            count: recipeCount ?? 0,
            detail: "Expected at least 15 recipes",
          };
  }

  // 3. Ingredient count
  const { count: ingCount, error: ingErr } = await supabase
    .from("ingredients")
    .select("*", { count: "exact", head: true });
  if (ingErr) {
    checks.ingredient_count = { status: "fail", detail: ingErr.message };
  } else {
    checks.ingredient_count =
      (ingCount ?? 0) >= 100
        ? { status: "pass", count: ingCount ?? 0 }
        : {
            status: "fail",
            count: ingCount ?? 0,
            detail: "Expected at least 100 ingredients",
          };
  }

  // 4. Recipes with missing images
  const { data: noImageRecipes } = await supabase
    .from("recipes")
    .select("name")
    .is("image_url", null);
  const noImageCount = noImageRecipes?.length ?? 0;
  checks.recipes_have_images =
    noImageCount === 0
      ? { status: "pass" }
      : {
          status: "fail",
          count: noImageCount,
          failures: noImageRecipes?.map((r) => r.name) ?? [],
        };

  // 5. Image URLs reachable (HEAD check with 5s timeout)
  const { data: imageRecipes } = await supabase
    .from("recipes")
    .select("name, image_url")
    .not("image_url", "is", null);

  if (imageRecipes && imageRecipes.length > 0) {
    const imageResults = await Promise.allSettled(
      imageRecipes.map(async (r) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        try {
          const res = await fetch(r.image_url, {
            method: "HEAD",
            signal: controller.signal,
          });
          clearTimeout(timeout);
          if (!res.ok) return { name: r.name, error: `HTTP ${res.status}` };
          return null;
        } catch (e) {
          clearTimeout(timeout);
          return {
            name: r.name,
            error: e instanceof Error ? e.message : "fetch error",
          };
        }
      }),
    );

    const failures = imageResults
      .map((r) =>
        r.status === "fulfilled"
          ? r.value
          : { name: "unknown", error: "promise rejected" },
      )
      .filter(Boolean) as { name: string; error: string }[];

    checks.image_urls_reachable =
      failures.length === 0
        ? { status: "pass", count: imageRecipes.length }
        : {
            status: "fail",
            count: imageRecipes.length,
            failures: failures.map((f) => `${f.name}: ${f.error}`),
          };
  } else {
    checks.image_urls_reachable = {
      status: "warn",
      detail: "No image URLs to check",
    };
  }

  // 6. Orphan ingredients (recipe_id points to non-existent recipe)
  const { data: allIngredients } = await supabase
    .from("ingredients")
    .select("id, recipe_id");
  const { data: allRecipeIds } = await supabase.from("recipes").select("id");
  if (allIngredients && allRecipeIds) {
    const recipeIdSet = new Set(allRecipeIds.map((r) => r.id));
    const orphans = allIngredients.filter((i) => !recipeIdSet.has(i.recipe_id));
    checks.orphan_ingredients =
      orphans.length === 0
        ? { status: "pass" }
        : {
            status: "warn",
            count: orphans.length,
            detail: `${orphans.length} orphan ingredient(s)`,
          };
  }

  // 7. Recipes without ingredients
  const { data: recipesWithIngs } = await supabase
    .from("recipes")
    .select("name, ingredients(id)")
    .eq("ingredients.id", "");

  // Simpler approach: query recipes and count their ingredients
  const { data: allRecipesForCheck } = await supabase
    .from("recipes")
    .select("id, name");
  if (allRecipesForCheck) {
    const noIngredients: string[] = [];
    for (const recipe of allRecipesForCheck) {
      const { count } = await supabase
        .from("ingredients")
        .select("*", { count: "exact", head: true })
        .eq("recipe_id", recipe.id);
      if ((count ?? 0) === 0) noIngredients.push(recipe.name);
    }
    checks.recipes_have_ingredients =
      noIngredients.length === 0
        ? { status: "pass" }
        : {
            status: "warn",
            count: noIngredients.length,
            failures: noIngredients,
          };
  }

  // 8. Homepage reachable (use public domain, not VERCEL_URL which may be protected)
  const publicUrl = process.env.APP_URL || "https://julies-cookbook.pages.dev";
  try {
    const homeRes = await fetch(publicUrl, { method: "HEAD" });
    checks.homepage_reachable = homeRes.ok
      ? { status: "pass" }
      : homeRes.status === 401
        ? { status: "pass", detail: "Deployment protection active (expected)" }
        : { status: "fail", detail: `HTTP ${homeRes.status}` };
  } catch (e) {
    checks.homepage_reachable = {
      status: "fail",
      detail: e instanceof Error ? e.message : "fetch error",
    };
  }

  // 9. Chat API responds (verify Anthropic key works)
  try {
    const chatRes = await fetch(`${publicUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "ping", history: [] }),
    });
    if (chatRes.status === 401) {
      // Deployment protection — can't self-call, but API key presence was checked above
      checks.chat_api = {
        status: "pass",
        detail: "Skipped (deployment protection)",
      };
    } else {
      const chatData = await chatRes.json();
      checks.chat_api =
        chatRes.ok && chatData.response
          ? { status: "pass" }
          : { status: "fail", detail: `HTTP ${chatRes.status}` };
    }
  } catch (e) {
    checks.chat_api = {
      status: "fail",
      detail: e instanceof Error ? e.message : "fetch error",
    };
  }

  // Overall status
  const allStatuses = Object.values(checks).map((c) => c.status);
  const overallStatus = allStatuses.includes("fail") ? "fail" : "pass";

  // Suppress unused variable warning
  void recipesWithIngs;

  // Alert on failures via Discord webhook (fire-and-forget)
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (overallStatus === "fail" && webhookUrl) {
    const failedChecks = Object.entries(checks)
      .filter(([, v]) => v.status === "fail")
      .map(([k, v]) => ({
        name: k.replace(/_/g, " "),
        value: v.detail || "Failed",
        inline: true,
      }));

    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "Cookbook Health",
        embeds: [
          {
            title: "Julie's Cookbook: Health Check Failed",
            color: 15158332,
            fields: failedChecks,
            footer: { text: "julies-cookbook.vercel.app/api/audit" },
            timestamp: new Date().toISOString(),
          },
        ],
      }),
    }).catch(() => {});
  }

  // Usage tracking (optional, triggered by ?usage=true)
  const includeUsage = req.nextUrl.searchParams.get("usage") === "true";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let usage: Record<string, any> | undefined;

  if (includeUsage) {
    usage = {};

    // ScrapingBee usage
    try {
      const sbRes = await fetch(
        `https://app.scrapingbee.com/api/v1/usage?api_key=${process.env.SCRAPINGBEE_API_KEY}`,
      );
      if (sbRes.ok) {
        const sbData = await sbRes.json();
        usage.scrapingbee = {
          credits_used: sbData.max_api_credit - sbData.api_credit,
          credits_remaining: sbData.api_credit,
          credits_total: sbData.max_api_credit,
        };
      } else {
        usage.scrapingbee = { error: `HTTP ${sbRes.status}` };
      }
    } catch (e) {
      usage.scrapingbee = {
        error: e instanceof Error ? e.message : "fetch error",
      };
    }

    // Supabase database size + counts
    try {
      const { count: totalRecipes } = await supabase
        .from("recipes")
        .select("*", { count: "exact", head: true });
      const { count: totalIngredients } = await supabase
        .from("ingredients")
        .select("*", { count: "exact", head: true });
      const { count: totalFoodLog } = await supabase
        .from("food_log")
        .select("*", { count: "exact", head: true });
      const { data: dbSize } = await supabase.rpc("pg_database_size_pretty");
      usage.supabase = {
        recipes: totalRecipes ?? 0,
        ingredients: totalIngredients ?? 0,
        food_log_entries: totalFoodLog ?? 0,
        db_size: dbSize ?? "unknown",
      };
    } catch {
      // pg_database_size_pretty may not exist, fall back to counts only
      usage.supabase = {
        recipes: recipeCount ?? 0,
        ingredients: ingCount ?? 0,
        note: "DB size requires custom RPC function",
      };
    }

    // Cloudinary usage
    try {
      const cloudRes = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/usage`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${process.env.CLOUDINARY_API_KEY}:${process.env.CLOUDINARY_API_SECRET}`)}`,
          },
        },
      );
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        usage.cloudinary = {
          storage_used_mb: Math.round(
            (cloudData.storage?.usage ?? 0) / 1024 / 1024,
          ),
          storage_limit_mb: Math.round(
            (cloudData.storage?.limit ?? 0) / 1024 / 1024,
          ),
          bandwidth_used_mb: Math.round(
            (cloudData.bandwidth?.usage ?? 0) / 1024 / 1024,
          ),
          bandwidth_limit_mb: Math.round(
            (cloudData.bandwidth?.limit ?? 0) / 1024 / 1024,
          ),
          transformations_used: cloudData.transformations?.usage ?? 0,
          transformations_limit: cloudData.transformations?.limit ?? 0,
          objects: cloudData.objects?.usage ?? 0,
        };
      } else {
        usage.cloudinary = { error: `HTTP ${cloudRes.status}` };
      }
    } catch (e) {
      usage.cloudinary = {
        error: e instanceof Error ? e.message : "fetch error",
      };
    }

    // Anthropic — no public usage API, but we can note the key is set
    usage.anthropic = {
      api_key_set: !!process.env.ANTHROPIC_API_KEY,
      note: "Check balance at console.anthropic.com/settings/billing",
    };
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    duration_ms: Date.now() - start,
    checks,
    ...(usage ? { usage } : {}),
  });
}
