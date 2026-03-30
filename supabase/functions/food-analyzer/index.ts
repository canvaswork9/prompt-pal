import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { image_base64, image_mime, meal_name, ingredients, lang } = await req.json();

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY")!;

    if (!meal_name) {
      return new Response(JSON.stringify({ error: "meal_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build messages — image is optional (text-only fallback if no image)
    const userContent: any[] = [];

    if (image_base64 && image_mime) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${image_mime};base64,${image_base64}`,
        },
      });
    }

    const ingredientText = ingredients
      ? `\nIngredients/notes: ${ingredients}`
      : "";

    const langNote = lang === "th"
      ? "Respond in Thai."
      : "Respond in English.";

    userContent.push({
      type: "text",
      text: `Analyze this meal and estimate its nutritional content.

Meal name: ${meal_name}${ingredientText}

${image_base64 ? "Use the image to estimate portion size accurately." : "No image provided — estimate based on name and ingredients only."}

Respond ONLY with a JSON object, no markdown, no explanation:
{
  "kcal": <number>,
  "protein_g": <number>,
  "carbs_g": <number>,
  "fat_g": <number>,
  "confidence": "high" | "medium" | "low",
  "notes": "<brief explanation of estimate in 1 sentence>"
}

Rules:
- All values are integers
- Estimate for a typical single serving unless portion is visible in image
- confidence = "high" if image + ingredients given, "medium" if image only or ingredients only, "low" if name only
- notes: mention what affected accuracy (portion visible, ingredients known, etc.)
${langNote}`,
    });

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitdecide.app",
        "X-Title": "FitDecide Food Analyzer",
      },
      body: JSON.stringify({
        // gemini-flash supports vision and is free on OpenRouter
        model: image_base64
          ? "google/gemini-flash-1.5"
          : "openai/gpt-oss-120b",
        messages: [
          {
            role: "system",
            content: "You are a precise nutritionist AI. Always respond with valid JSON only. No markdown, no extra text.",
          },
          {
            role: "user",
            content: userContent,
          },
        ],
        max_tokens: 300,
        temperature: 0.2, // low temp for consistent nutrition estimates
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OpenRouter error: ${response.status} ${err}`);
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content || "";

    // Parse JSON — strip any accidental markdown fences
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      throw new Error(`Failed to parse AI response: ${rawText}`);
    }

    // Validate required fields
    const { kcal, protein_g, carbs_g, fat_g, confidence, notes } = result;
    if (typeof kcal !== "number" || typeof protein_g !== "number") {
      throw new Error("Invalid nutrition data from AI");
    }

    return new Response(
      JSON.stringify({ kcal, protein_g, carbs_g, fat_g, confidence, notes }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("food-analyzer error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
