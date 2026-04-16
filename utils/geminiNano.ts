import { NativeModules, Platform } from "react-native";

const { GeminiNano } = NativeModules;

const SYSTEM_CONTEXT = `You are Flow, a warm personal focus companion inside a time tracking app.
Help users log activities, check focus history, and stay on track with goals.
Keep responses short (2-3 sentences max). Be encouraging and friendly.`;

export async function isGeminiNanoAvailable(): Promise<boolean> {
  if (Platform.OS !== "android" || !GeminiNano) return false;
  try {
    return await GeminiNano.isAvailable();
  } catch {
    return false;
  }
}

export async function initGeminiNano(): Promise<boolean> {
  if (!GeminiNano) return false;
  try {
    return await GeminiNano.initialize();
  } catch {
    return false;
  }
}

export async function askGeminiNano(userMessage: string): Promise<string | null> {
  if (!GeminiNano) return null;
  try {
    const prompt = `${SYSTEM_CONTEXT}\n\nUser: ${userMessage}\nFlow:`;
    const response = await GeminiNano.generate(prompt);
    return response ?? null;
  } catch {
    return null;
  }
}
