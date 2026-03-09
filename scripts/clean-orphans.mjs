import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const records = await base("tblbly81hGxUaEgM2")
  .select({ fields: ["Name", "Recipes"] })
  .all();

const orphans = records.filter((r) => {
  const name = r.get("Name");
  return !name || name.trim() === "";
});

console.log(`Orphan ingredients found: ${orphans.length}`);
orphans.forEach((r) => {
  const linked = r.get("Recipes") || [];
  console.log(`  ${r.id} | name="${r.get("Name") || ""}" | linked recipes: ${linked.length}`);
});

if (orphans.length > 0) {
  const ids = orphans.map((r) => r.id);
  for (let i = 0; i < ids.length; i += 10) {
    await base("tblbly81hGxUaEgM2").destroy(ids.slice(i, i + 10));
  }
  console.log("Deleted.");
} else {
  console.log("Nothing to clean.");
}
