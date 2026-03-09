import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

const records = await base("tblcDuujfu1rokjSU")
  .select({ fields: ["Recipe Name", "Image URL", "Servings", "Calories Per Serving"] })
  .all();

console.log("FINAL DATABASE STATE");
console.log("====================");

records.forEach((r, i) => {
  const name = r.get("Recipe Name") || "(empty)";
  const img = r.get("Image URL") ? "IMG" : "NO_IMG";
  const servings = r.get("Servings") || "-";
  const cal = r.get("Calories Per Serving");
  const calStr = cal ? Math.round(cal) : "-";
  console.log(`${i + 1}. [${img}] ${name} | servings: ${servings} | cal: ${calStr}`);
});

console.log("");
console.log(`Total: ${records.length}`);
console.log(`With images: ${records.filter((r) => r.get("Image URL")).length}`);
console.log(`With servings: ${records.filter((r) => r.get("Servings")).length}`);

const names = records.map((r) => r.get("Recipe Name"));
const dupes = names.filter((n, i) => names.indexOf(n) !== i);
console.log(`Duplicates: ${dupes.length ? dupes.join(", ") : "none"}`);
