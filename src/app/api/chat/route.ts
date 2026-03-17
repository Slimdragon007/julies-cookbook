import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getRecipeContext } from "@/lib/data";
import { createSupabaseServer } from "@/lib/supabase/server";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    // Auth check
    const authSupabase = await createSupabaseServer();
    const { data: { user } } = await authSupabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, history } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    const recipeContext = await getRecipeContext();

    const systemPrompt = `You are Julie's personal cookbook assistant. You help her decide what to cook, answer nutrition questions, and suggest recipes from her collection.

RULES:
- Only recommend recipes that exist in Julie's cookbook (provided in context below)
- Always include calories, protein, carbs, and fat per serving when discussing a recipe
- When comparing recipes, use a simple format: Recipe Name: X cal, Xg protein, Xg carbs, Xg fat
- If Julie asks about a recipe not in her cookbook, say you don't have that one yet and suggest she add it
- Keep responses concise and warm, like talking to a friend in the kitchen
- When Julie asks "what should I make", consider: cook time (she's busy), dietary preferences, and variety from recent meals
- Never use em dashes
- Round all numbers to whole values
- If Julie asks you to find or search for a NEW recipe online, use your web search tool to find one. After finding it, share the URL and say: "Want me to add this to your cookbook? Share this URL with Slim and he'll import it."
- When searching for recipes online, look for recipes that match Julie's preferences (calorie-conscious, macro-aware, practical cook times)

CAPABILITIES:
- Answer nutrition questions about any recipe in the cookbook
- Compare recipes by calories, protein, carbs, fat, or cook time
- Filter recipes by dietary tags (vegetarian, gluten-free, dairy-free, high protein, comfort food)
- Filter recipes by cuisine (American, Moroccan, Italian, Asian, Mediterranean)
- Suggest recipes based on available time (prep + cook time)
- Suggest recipes based on specific ingredients Julie wants to use
- Search the web for new recipe ideas when asked

JULIE'S COOKBOOK:
${recipeContext}`;

    const messages: Anthropic.MessageParam[] = [
      ...(history || []).map((h: { role: string; content: string }) => ({
        role: h.role as "user" | "assistant",
        content: h.content,
      })),
      { role: "user", content: message },
    ];

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: systemPrompt,
      messages,
      tools: [
        {
          type: "web_search_20250305" as const,
          name: "web_search",
          max_uses: 3,
        },
      ],
    });

    // Extract text and citations from response
    const textParts: string[] = [];
    const citations: { url: string; title: string }[] = [];
    let usedWebSearch = false;
    const seenUrls = new Set<string>();

    for (const block of response.content) {
      if (block.type === "text") {
        textParts.push(block.text);
        // Extract citations from text block annotations
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyBlock = block as any;
        if (anyBlock.citations) {
          for (const cite of anyBlock.citations) {
            if (cite.url && !seenUrls.has(cite.url)) {
              seenUrls.add(cite.url);
              citations.push({ url: cite.url, title: cite.title || cite.url });
            }
          }
        }
      } else if (block.type === "server_tool_use" || block.type === "web_search_tool_result") {
        usedWebSearch = true;
      }
    }

    const text = textParts.join("\n\n");

    return NextResponse.json({ response: text, usedWebSearch, citations });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
