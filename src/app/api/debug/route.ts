import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

export async function GET() {
  try {
    // 1. Fetch first recipe with ALL raw fields
    const recipes = await base("tblcDuujfu1rokjSU")
      .select({ maxRecords: 1 })
      .all();

    if (!recipes.length) {
      return NextResponse.json({ error: "No recipes found" });
    }

    const recipe = recipes[0];
    const rawFields = recipe.fields;
    const fieldNames = Object.keys(rawFields);

    // 2. Check what the "Ingredients" field returns
    const ingredientsValue = recipe.get("Ingredients");

    // 3. Try fetching ingredients if we have IDs
    let ingredientData = null;
    const ingIds = (ingredientsValue as string[]) || [];

    if (ingIds.length > 0) {
      // Fetch first ingredient both ways: by field name and by field ID
      const byName = await base("tblbly81hGxUaEgM2").find(ingIds[0]);
      const byIdSelect = await base("tblbly81hGxUaEgM2")
        .select({
          filterByFormula: `RECORD_ID()='${ingIds[0]}'`,
          returnFieldsByFieldId: true,
        })
        .all();

      ingredientData = {
        firstIngId: ingIds[0],
        byFieldName: byName.fields,
        byFieldId: byIdSelect[0]?.fields || "no results",
      };
    }

    return NextResponse.json({
      recipeId: recipe.id,
      recipeName: rawFields["Recipe Name"],
      allFieldNames: fieldNames,
      ingredientsFieldValue: ingredientsValue,
      ingredientsFieldType: typeof ingredientsValue,
      ingredientsIsArray: Array.isArray(ingredientsValue),
      ingredientCount: ingIds.length,
      ingredientData,
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
