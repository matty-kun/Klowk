import AsyncStorage from "@react-native-async-storage/async-storage";

export const POMODORO_STORAGE_KEY = "klowk_pomodoro_v1";

export type PomodoroSettings = {
  workMins: number;
  shortBreakMins: number;
  longBreakMins: number;
  rounds: number;
  autoNextRound: boolean;
};

export const DEFAULT_POMODORO_SETTINGS: PomodoroSettings = {
  workMins: 25,
  shortBreakMins: 5,
  longBreakMins: 15,
  rounds: 2,
  autoNextRound: true,
};

export async function loadPomodoroSettings(): Promise<PomodoroSettings> {
  try {
    const raw = await AsyncStorage.getItem(POMODORO_STORAGE_KEY);
    if (!raw) return DEFAULT_POMODORO_SETTINGS;
    return { ...DEFAULT_POMODORO_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_POMODORO_SETTINGS;
  }
}

export async function savePomodoroSettings(s: PomodoroSettings): Promise<void> {
  await AsyncStorage.setItem(POMODORO_STORAGE_KEY, JSON.stringify(s));
}
