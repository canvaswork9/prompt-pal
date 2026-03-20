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
    const { messages, userId } = await req.json();

    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const serviceKey     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openrouterKey  = Deno.env.get("OPENROUTER_API_KEY")!;
    const supabase       = createClient(supabaseUrl, serviceKey);

    // Fetch user context
    const [profileRes, checkinsRes, prsRes] = await Promise.all([
      supabase.from("user_profiles")
        .select("display_name, age, fitness_goal, experience, weight_kg, height_cm, activity_level, language")
        .eq("id", userId).maybeSingle(),
      supabase.from("daily_checkins")
        .select("date, readiness_score, status, training_split, sleep_hours")
        .eq("user_id", userId).order("date", { ascending: false }).limit(7),
      supabase.from("personal_records")
        .select("exercise_key, estimated_1rm, achieved_at")
        .eq("user_id", userId).order("estimated_1rm", { ascending: false }).limit(5),
    ]);

    const profile      = profileRes.data;
    const checkins     = checkinsRes.data || [];
    const prs          = prsRes.data || [];
    const todayCheckin = checkins[0];

    // Calculate TDEE
    const calcTDEE = (w: number, h: number, a: number, sex: string, act: string) => {
      const base = (10 * w) + (6.25 * h) - (5 * a);
      const bmr  = sex === "female" ? base - 161 : base + 5;
      const mult: Record<string, number> = {
        sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
      };
      return Math.round(bmr * (mult[act] || 1.55));
    };

    const tdee = profile?.weight_kg && (profile as any)?.height_cm && profile?.age
      ? calcTDEE(
          Number(profile.weight_kg),
          Number((profile as any).height_cm),
          Number(profile.age),
          "male",
          (profile as any).activity_level || "moderate"
        )
      : null;

    const systemPrompt = `You are FitCoach — a friendly, expert personal trainer built into FitDecide.
You have access to this user's complete data:

USER PROFILE:
Name: ${profile?.display_name || "User"}, Age: ${profile?.age || "unknown"}, Goal: ${profile?.fitness_goal || "general"}, Experience: ${profile?.experience || "beginner"}, Weight: ${profile?.weight_kg || "unknown"}kg, Height: ${(profile as any)?.height_cm || "unknown"}cm
Activity: ${(profile as any)?.activity_level || "moderate"}${tdee ? `, TDEE: ~${tdee} kcal/day` : ""}

TODAY'S STATUS:
${todayCheckin
  ? `Score: ${todayCheckin.readiness_score}, Status: ${todayCheckin.status}, Split: ${todayCheckin.training_split}, Sleep: ${todayCheckin.sleep_hours}h`
  : "No check-in today"}

LAST 7 DAYS:
${checkins.map(c => `${c.date}: ${c.readiness_score} (${c.status})`).join("\n") || "No recent data"}

RECENT PRs:
${prs.map(p => `${p.exercise_key}: ${p.estimated_1rm}kg`).join(", ") || "No PRs yet"}

RULES:
- Be specific, reference their actual numbers
- Max 3-4 sentences unless they ask for more  
- Same language as user (user prefers ${profile?.language === "th" ? "Thai" : "English"})
- Push hard when score is high, prioritize rest when low
- Never give generic advice — always tie it to their data
- Use emoji sparingly for personality`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    // OpenRouter API — format เหมือน OpenAI
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openrouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://fitdecide.app",
        "X-Title": "FitDecide AI Coach",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",                       // ฟรี
        // model: "anthropic/claude-3.5-haiku",            // เสียเงิน แต่ดีกว่า
        // model: "openai/gpt-4o-mini",                   // เสียเงิน แต่ดีกว่า
        messages: aiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    const data  = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("AI Coach error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
