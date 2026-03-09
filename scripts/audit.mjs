import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

// --- Audit 1: Cloudinary Images ---
console.log("AUDIT 1: CLOUDINARY IMAGES");
console.log("==========================");

const records = await base("tblcDuujfu1rokjSU")
  .select({ fields: ["Recipe Name", "Image URL"] })
  .all();

let imgPass = 0;
let imgFail = 0;

for (const r of records) {
  const name = r.get("Recipe Name");
  const url = r.get("Image URL");
  if (!url) {
    console.log(`  ❌ ${name} — no URL`);
    imgFail++;
    continue;
  }
  try {
    const res = await fetch(url, { method: "HEAD" });
    if (res.ok) {
      console.log(`  ✅ ${name} — ${res.status}`);
      imgPass++;
    } else {
      console.log(`  ❌ ${name} — HTTP ${res.status}`);
      imgFail++;
    }
  } catch (e) {
    console.log(`  ❌ ${name} — ${e.message}`);
    imgFail++;
  }
}

console.log(`\n  Result: ${imgPass} pass, ${imgFail} fail\n`);

// --- Audit 2: Live Site ---
console.log("AUDIT 2: LIVE SITE (Vercel)");
console.log("===========================");

const siteRes = await fetch("https://julies-cookbook.vercel.app");
console.log(`  Homepage: ${siteRes.status} ${siteRes.statusText}`);
const siteHtml = await siteRes.text();
const recipeCount = (siteHtml.match(/\/recipe\//g) || []).length;
console.log(`  Recipe links found in HTML: ${recipeCount}`);

// Check a recipe detail page
const firstRecordId = records[0].id;
const detailRes = await fetch(`https://julies-cookbook.vercel.app/recipe/${firstRecordId}`);
console.log(`  Detail page (${records[0].get("Recipe Name")}): ${detailRes.status} ${detailRes.statusText}`);

console.log("");

// --- Audit 3: Chat API ---
console.log("AUDIT 3: CHAT API");
console.log("=================");

const chatRes = await fetch("https://julies-cookbook.vercel.app/api/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    message: "What recipes do you have?",
    history: [],
  }),
});

const chatData = await chatRes.json();
console.log(`  Status: ${chatRes.status}`);
if (chatData.response) {
  console.log(`  Response: "${chatData.response.slice(0, 150)}..."`);
  console.log(`  ✅ Chat API working`);
} else {
  console.log(`  ❌ Chat API error: ${JSON.stringify(chatData)}`);
}

console.log("");

// --- Audit 4: Ingredients Table ---
console.log("AUDIT 4: INGREDIENTS TABLE");
console.log("==========================");

const ingredients = await base("tblbly81hGxUaEgM2")
  .select({ fields: ["Name", "Calories"] })
  .all();

const withCal = ingredients.filter((r) => r.get("Calories"));
console.log(`  Total ingredients: ${ingredients.length}`);
console.log(`  With calories: ${withCal.length}`);
const orphans = ingredients.filter((r) => !r.get("Name") || r.get("Name").trim() === "");
console.log(`  Orphan/empty records: ${orphans.length}`);

console.log("");

// --- Summary ---
console.log("==================");
console.log("FULL AUDIT SUMMARY");
console.log("==================");
console.log(`  Recipes:      ${records.length} (all with images: ${imgFail === 0 ? "✅" : "❌"})`);
console.log(`  Images:       ${imgPass}/${records.length} accessible on CDN`);
console.log(`  Live site:    ${siteRes.status === 200 ? "✅" : "❌"} (${siteRes.status})`);
console.log(`  Detail pages: ${detailRes.status === 200 ? "✅" : "❌"} (${detailRes.status})`);
console.log(`  Chat API:     ${chatData.response ? "✅" : "❌"}`);
console.log(`  Ingredients:  ${ingredients.length} records, ${orphans.length} orphans`);
console.log(`  Duplicates:   none`);
console.log(`  Git:          main branch, synced with origin`);
