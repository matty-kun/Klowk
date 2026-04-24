import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "klowk_timer_state_v1";

export interface TimerState {
  /** Original route params used to launch tracker */
  params: {
    pomodoro?: string;
    workSecs?: string;
    shortBreakSecs?: string;
    longBreakSecs?: string;
    rounds?: string;
    baseTitle?: string;
    category?: string;
    targetSecs?: string;
  };
  pomodoroRound: number;
  pomodoroPhase: "work" | "break";
  totalPausedMs: number;
  isPaused: boolean;
  /** epoch ms when the session was paused, null if running */
  pausedAtMs: number | null;
}

export async function saveTimerState(state: TimerState): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(state));
  } catch {}
}

export async function loadTimerState(): Promise<TimerState | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TimerState;
  } catch {
    return null;
  }
}

export async function clearTimerState(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {}
}
