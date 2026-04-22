import { Activity } from "@/context/TrackingContext";

export type DisplayActivity = Activity & { pomodoroIds?: number[]; pomodoroRounds?: number };

const POMO_SUFFIX_RE = /\s[—-]\s(Round \d+|Short Break|Long Break)$/;
const POMO_ROUND_RE = /\s[—-]\sRound \d+$/;

export function pomodoroBaseTitle(title: string): string | null {
  return POMO_SUFFIX_RE.test(title) ? title.replace(POMO_SUFFIX_RE, "") : null;
}

export function mergePomoActivities(activities: Activity[]): DisplayActivity[] {
  const pomGroups: Record<string, Activity[]> = {};
  const regular: DisplayActivity[] = [];

  for (const a of activities) {
    const base = pomodoroBaseTitle(a.title);
    if (base !== null) {
      const date = new Date(a.created_at).toLocaleDateString();
      const key = `${date}||${base}||${a.category}`;
      if (!pomGroups[key]) pomGroups[key] = [];
      pomGroups[key].push(a);
    } else {
      regular.push(a);
    }
  }

  const merged: DisplayActivity[] = [...regular];
  for (const phases of Object.values(pomGroups)) {
    const base = pomodoroBaseTitle(phases[0].title)!;
    const totalDuration = phases.reduce((s, p) => s + (p.duration || 0), 0);
    const earliest = phases.reduce(
      (min, p) => (p.start_time < min ? p.start_time : min),
      phases[0].start_time,
    );
    const roundCount = phases.filter((p) => POMO_ROUND_RE.test(p.title)).length;
    merged.push({
      ...phases[0],
      title: base,
      duration: totalDuration,
      start_time: earliest,
      pomodoroIds: phases.map((p) => p.id),
      pomodoroRounds: roundCount,
    });
  }

  merged.sort((a, b) => b.start_time - a.start_time);
  return merged;
}
