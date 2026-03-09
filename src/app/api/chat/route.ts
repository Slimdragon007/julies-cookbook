import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRecipeContext } from "@/lib/data";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const recipeContext = await getRecipeContext();

    const systemPrompt = `You are Julie's friendly cookbook assistant. You help Julie find recipes, suggest meals, and answer cooking questions.

Here are all the recipes in Julie's cookbook:
${recipeContext}

Guidelines:
- Be warm, friendly, and concise
- When suggesting recipes, reference ones from the cookbook above
- If Julie asks about calories, give specific numbers from the data
- If she asks for something not in the cookbook, suggest similar recipes that ARE in the cookbook, or offer a brief new idea
- Keep responses short — 2-3 sentences max unless she asks for details`;

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      system: systemPrompt,
      messages,
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ response: text });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
