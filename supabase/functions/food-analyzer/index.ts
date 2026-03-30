const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { image_base64, image_mime, meal_name, ingredients, lang } = body;

    const openrouterKey = Deno.env.get("OPENROUTER_API_KEY");
    if (!openrouterKey) throw new Error("OPENROUTER_API_KEY not set");

    if (!meal_name) {
      return new Response(JSON.stringify({ error: "meal_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const hasImage = !!(image_base64 && image_mime);
    const ingredientText = ingredients ? `\nIngredients: ${ingredients}` : "";
    const langNote = lang === "th" ? "Respond in Thai." : "Respond in English.";

    const prompt = `Estimate nutrition for this meal.
Meal: ${meal_name}${ingredientText}
${hasImage ? "Use the photo to estimate portion size." : "Estimate from name only."}

Reply ONLY with JSON (no markdown):
{"kcal":number,"protein_g":number,"carbs_g":number,"fat_g":number,"confidence":"high"|"medium"|"low","notes":"string"}
${langNote}`;

    // ── Attempt 1: Vision model (if image provided) ──────────────────
    if (hasImage) {
      const visionResult = await callOpenRouter(openrouterKey, "qwen/qwen2.5-vl-72b-instruct:free", [
        { role: "system", content: "Nutritionist AI. Respond with valid JSON only, no markdown." },
        {
          role: "user", content: [
            { type: "image_url", image_url: { url: `data:${image_mime};base64,${image_base64}` } },
            { type: "text", text: prompt },
          ],
        },
      ]);

      if (visionResult.ok) {
        console.log("food-analyzer: vision model succeeded");
        return new Response(JSON.stringify(visionResult.data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log("food-analyzer: vision failed:", visionResult.error, "— falling back to text-only");
    }

    // ── Attempt 2: Text-only (no image / fallback) ───────────────────
    const textResult = await callOpenRouter(openrouterKey, "openai/gpt-oss-120b", [
      { role: "system", content: "Nutritionist AI. Respond with valid JSON only, no markdown." },
      { role: "user", content: hasImage
        ? `${prompt}\n(Note: image analysis unavailable, estimating from meal name and ingredients only)`
        : prompt,
      },
    ]);

    if (textResult.ok) {
      const result = textResult.data;
      if (hasImage) {
        result.confidence = "low";
        result.notes = "Photo analysis unavailable — estimated from meal name" + (ingredients ? " and ingredients" : " only");
      }
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`All models failed. Last error: ${textResult.error}`);

  } catch (error) {
    console.error("food-analyzer fatal:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

// ── Helper: call OpenRouter and parse JSON response ──────────────────────────
async function callOpenRouter(
  apiKey: string,
  model: string,
  messages: any[]
): Promise<{ ok: true; data: any } | { ok: false; error: string }> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitdecide.app",
        "X-Title": "FitDecide Food Analyzer",
      },
      body: JSON.stringify({ model, messages, max_tokens: 200, temperature: 0.1 }),
    });

    const text = await res.text();
    console.log(`food-analyzer [${model}] status=${res.status} body=${text.slice(0, 300)}`);

    if (!res.ok) return { ok: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };

    const json = JSON.parse(text);
    const raw = json.choices?.[0]?.message?.content || "";

    // Strip markdown fences
    const cleaned = raw.replace(/```json|```/g, "").trim();

    // Try direct parse first
    try {
      const parsed = JSON.parse(cleaned);
      if (typeof parsed.kcal === "number") return { ok: true, data: parsed };
      return { ok: false, error: `Missing kcal in: ${cleaned}` };
    } catch {
      // Try extract JSON object from response
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (typeof parsed.kcal === "number") return { ok: true, data: parsed };
      }
      return { ok: false, error: `Cannot parse JSON from: ${cleaned.slice(0, 200)}` };
    }
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}
