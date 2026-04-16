import OpenAI from "openai";

// Securely load the OpenAI API Key from environment variables
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

let openaiInstance: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiInstance && OPENAI_API_KEY) {
    openaiInstance = new OpenAI({
      apiKey: OPENAI_API_KEY,
      dangerouslyAllowBrowser: true, // Required for React Native usage
    });
  }
  return openaiInstance;
}

export type NLPResult =
  | { type: "start"; title: string }
  | { type: "manual"; title: string; durationMinutes: number }
  | { type: "error"; message: string };

export async function parseNaturalLanguage(input: string): Promise<NLPResult> {
  const client = getOpenAIClient();
  if (!client) {
    return { type: "error", message: "API Key not configured" };
  }

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a helpful assistant for the Flow time tracking app. 
          Analyze user input and extract the activity and duration.
          
          ALWAYS assume the user is LOGGING a PAST activity.
          Extract: activity title and duration in minutes.
          
          Return ONLY valid JSON: {"type": "manual", "title": "activity name", "durationMinutes": number}
          
          Examples:
          "Study 15m" -> {"type": "manual", "title": "Study", "durationMinutes": 15}
          "Coding for 1h" -> {"type": "manual", "title": "Coding", "durationMinutes": 60}
          "Workout 45 minutes" -> {"type": "manual", "title": "Workout", "durationMinutes": 45}
          "Design 1.5h" -> {"type": "manual", "title": "Design", "durationMinutes": 90}`,
        },
        { role: "user", content: input },
      ],
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) throw new Error("Empty response");

    return JSON.parse(content) as NLPResult;
  } catch (error) {
    console.error("NLP Parsing error:", error);
    return { type: "error", message: "Failed to understand" };
  }
}
