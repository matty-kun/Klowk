const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";

export const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

type GeminiContext = {
  userName?: string;
  goals?: { name: string; targetMins: number; loggedMins: number; endDate: number }[];
  totalFocusToday?: number;
  totalFocusWeek?: number;
};

const buildSystemPrompt = (ctx: GeminiContext) => {
  const daysLeft = (endDate: number) =>
    Math.max(0, Math.ceil((endDate - Date.now()) / (1000 * 60 * 60 * 24)));

  const goalLines =
    ctx.goals && ctx.goals.length > 0
      ? ctx.goals
          .map((g) => {
            const pct = Math.min(100, Math.round((g.loggedMins / g.targetMins) * 100));
            return `- ${g.name}: ${(g.loggedMins / 60).toFixed(1)}h logged of ${(g.targetMins / 60).toFixed(1)}h target (${pct}%, ${daysLeft(g.endDate)} days left)`;
          })
          .join("\n")
      : "No active goals.";

  return `You are Flow, a warm and encouraging personal focus companion inside a time-tracking app called Klowk.
The user's name is ${ctx.userName || "there"}.

Current stats:
- Focus logged today: ${((ctx.totalFocusToday || 0) / 60).toFixed(1)}h
- Focus logged this week: ${((ctx.totalFocusWeek || 0) / 60).toFixed(1)}h

Active goals:
${goalLines}

Your job:
- Help the user understand their progress and stay motivated
- Answer questions about their focus time and goals
- Give specific, data-driven advice based on the stats above
- Keep responses concise (3-4 sentences max) and friendly
- You are a snail character — occasionally use snail wisdom ("slow and steady", "one trail at a time")
- Never make up data you don't have`;
};

export async function askGeminiAI(
  userMessage: string,
  ctx: GeminiContext,
): Promise<string | null> {
  if (!GEMINI_API_KEY) return null;

  try {
    const res = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: buildSystemPrompt(ctx) }] },
        contents: [{ role: "user", parts: [{ text: userMessage }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 },
      }),
    });

    const data = await res.json();
    console.log("Gemini status:", res.status);
    console.log("Gemini response:", JSON.stringify(data));
    return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;
  } catch {
    return null;
  }
}
