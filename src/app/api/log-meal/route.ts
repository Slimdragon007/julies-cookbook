import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { recipe_id, meal, portion_g, calories, protein_g, carbs_g, fat_g, log_date, notes } = body;

    if (!recipe_id || !meal || !portion_g) {
      return NextResponse.json({ error: "recipe_id, meal, and portion_g are required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("food_log")
      .insert({
        recipe_id,
        meal,
        portion_g,
        calories,
        protein_g,
        carbs_g,
        fat_g,
        log_date: log_date || new Date().toISOString().split("T")[0],
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, entry: data });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const days = parseInt(searchParams.get("days") || "1", 10);

  const startDate = new Date(date);
  startDate.setDate(startDate.getDate() - (days - 1));
  const startStr = startDate.toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("food_log")
    .select("*, recipes(name)")
    .gte("log_date", startStr)
    .lte("log_date", date)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data });
}
