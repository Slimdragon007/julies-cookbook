import { NextResponse } from "next/server";
import Airtable from "airtable";

const base = new Airtable({
  apiKey: process.env.AIRTABLE_API_KEY,
}).base(process.env.AIRTABLE_BASE_ID || "appzynj6dYXpWEoKi");

export async function GET() {
  try {
    // 1. Fetch first recipe by field name
    const recipes = await base("tblcDuujfu1rokjSU")
      .select({ maxRecords: 1 })
      .all();

    if (!recipes.length) {
      return NextResponse.json({ error: "No recipes found" });
    }

    const recipe = recipes[0];

    // 2. Also fetch same recipe with returnFieldsByFieldId to see actual field IDs
    const byIdRecords = await base("tblcDuujfu1rokjSU")
      .select({
        maxRecords: 1,
        filterByFormula: `RECORD_ID()='${recipe.id}'`,
        returnFieldsByFieldId: true,
      })
      .all();

    const byIdFields = byIdRecords[0]?.fields || {};

    // 3. Dump ALL field values (not just names) for both modes
    const fieldsByName: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(recipe.fields)) {
      fieldsByName[key] = {
        value,
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : undefined,
      };
    }

    const fieldsByFieldId: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(byIdFields)) {
      fieldsByFieldId[key] = {
        value,
        type: typeof value,
        isArray: Array.isArray(value),
        length: Array.isArray(value) ? value.length : undefined,
      };
    }

    // 4. Auto-detect: find any field that looks like linked record IDs
    const linkedFields: Record<string, string[]> = {};
    for (const [key, value] of Object.entries(recipe.fields)) {
      if (
        Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "string" &&
        value[0].startsWith("rec")
      ) {
        linkedFields[key] = value as string[];
      }
    }

    // 5. Try fetching ingredients from auto-detected linked IDs
    let ingredientData = null;
    const autoDetectedIds = Object.values(linkedFields).flat();
    if (autoDetectedIds.length > 0) {
      const firstId = autoDetectedIds[0];
      const byName = await base("tblbly81hGxUaEgM2").find(firstId);
      const byIdSelect = await base("tblbly81hGxUaEgM2")
        .select({
          filterByFormula: `RECORD_ID()='${firstId}'`,
          returnFieldsByFieldId: true,
        })
        .all();

      ingredientData = {
        firstIngId: firstId,
        byFieldName: byName.fields,
        byFieldId: byIdSelect[0]?.fields || "no results",
      };
    }

    return NextResponse.json({
      recipeId: recipe.id,
      fieldsByName,
      fieldsByFieldId,
      linkedRecordFields: linkedFields,
      autoDetectedIngredientIds: autoDetectedIds,
      ingredientData,
      directGetIngredients: recipe.get("Ingredients"),
      directGetIngredientsType: typeof recipe.get("Ingredients"),
    });
  } catch (error) {
    return NextResponse.json({
      error: String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
