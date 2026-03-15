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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch user context in parallel
    const [profileRes, checkinsRes, prsRes] = await Promise.all([
      supabase.from("user_profiles").select("display_name, age, fitness_goal, experience, weight_kg, language").eq("id", userId).maybeSingle(),
      supabase.from("daily_checkins").select("date, readiness_score, status, training_split, sleep_hours").eq("user_id", userId).order("date", { ascending: false }).limit(7),
      supabase.from("personal_records").select("exercise_key, estimated_1rm, achieved_at").eq("user_id", userId).order("estimated_1rm", { ascending: false }).limit(5),
    ]);

    const profile = profileRes.data;
    const checkins = checkinsRes.data || [];
    const prs = prsRes.data || [];
    const todayCheckin = checkins[0];

    const systemPrompt = `You are FitCoach — a friendly, expert personal trainer built into FitDecide.
You have access to this user's complete data:

USER PROFILE:
Name: ${profile?.display_name || "User"}, Age: ${profile?.age || "unknown"}, Goal: ${profile?.fitness_goal || "general"}, Experience: ${profile?.experience || "beginner"}, Weight: ${profile?.weight_kg || "unknown"}kg

TODAY'S STATUS:
${todayCheckin ? `Score: ${todayCheckin.readiness_score}, Status: ${todayCheckin.status}, Split: ${todayCheckin.training_split}, Sleep: ${todayCheckin.sleep_hours}h` : "No check-in today"}

LAST 7 DAYS:
${checkins.map(c => `${c.date}: ${c.readiness_score} (${c.status})`).join("\n") || "No recent data"}

RECENT PRs:
${prs.map(p => `${p.exercise_key}: ${p.estimated_1rm}kg`).join(", ") || "No PRs yet"}

RULES:
- Be specific, reference their actual numbers
- Max 3-4 sentences unless they ask for more
- Same language as user (detect from their message, user prefers ${profile?.language === "th" ? "Thai" : "English"})
- Push hard when score is high, prioritize rest when low
- Never give generic advice — always tie it to their data
- Use emoji sparingly for personality`;

    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages.slice(-10),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: aiMessages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API error: ${response.status} ${errorText}`);
    }

    const data = await response.json();
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
