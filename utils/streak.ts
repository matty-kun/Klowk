import { Activity } from "@/context/TrackingContext";

/**
 * Returns the current consecutive-day streak from activities.
 * A day counts if at least one completed activity was logged on it.
 * Streak is broken if yesterday has no activity (today's activity is optional
 * — the streak stays alive if today hasn't been logged yet).
 */
export function computeStreak(activities: Activity[]): number {
  if (activities.length === 0) return 0;

  // Collect unique day strings that have at least one completed activity
  const days = new Set<string>();
  for (const a of activities) {
    if (!a.duration) continue;
    days.add(new Date(a.start_time).toDateString());
  }

  if (days.size === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Start counting from today; if today has no log, start from yesterday
  // so the streak isn't broken just because the day isn't over yet.
  const cursor = new Date(today);
  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
