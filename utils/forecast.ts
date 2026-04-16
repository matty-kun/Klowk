type ForecastRange = "today" | "week" | "month";

type ForecastActivity = {
  category: string | null;
  start_time: number;
  duration: number | null;
};

type ForecastGoal = {
  name: string;
  targetMins: number;
  startDate: number;
  endDate: number;
};

type ForecastStatus = "on_track" | "behind" | "at_risk" | "burnout" | "no_goal";

export type ForecastResult = {
  currentMins: number;
  targetMins: number;
  projectedMins: number;
  daysPassed: number;
  totalDays: number;
  status: ForecastStatus;
  message: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

const getRangeBounds = (range: ForecastRange, now: Date) => {
  const start = new Date(now);
  const end = new Date(now);

  if (range === "today") {
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
  } else if (range === "week") {
    const day = now.getDay();
    start.setDate(now.getDate() - day);
    start.setHours(0, 0, 0, 0);
    end.setDate(start.getDate() + 6);
    end.setHours(23, 59, 59, 999);
  } else {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    end.setMonth(now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  }

  return { startMs: start.getTime(), endMs: end.getTime() };
};

const buildMessage = (status: ForecastStatus) => {
  if (status === "on_track") {
    return "You're flying high! At this rate, we'll reach our mountain peak. Keep that wingspan wide!";
  }
  if (status === "behind") {
    return "The clouds are getting thick. If we want to hit our goal, we need an updraft. Try one more Deep Work hour.";
  }
  if (status === "burnout") {
    return "Even Flow needs to rest sometimes. You've been in the air too long, log some recovery time.";
  }
  if (status === "at_risk") {
    return "Solid rhythm, but we're drifting a bit. A short 30-minute burst keeps the dream alive.";
  }
  return "Set a goal and I will forecast your flight path with you.";
};

export const getForecast = ({
  activities,
  goals,
  range,
  now = Date.now(),
}: {
  activities: ForecastActivity[];
  goals: ForecastGoal[];
  range: ForecastRange;
  now?: number;
}): ForecastResult => {
  const dateNow = new Date(now);
  const { startMs, endMs } = getRangeBounds(range, dateNow);

  const inRangeActivities = activities.filter(
    (a) => a.start_time >= startMs && a.start_time <= endMs,
  );
  const currentMins = Math.floor(
    inRangeActivities.reduce((sum, a) => sum + (a.duration || 0), 0) / 60,
  );

  const totalDays = Math.max(1, Math.ceil((endMs - startMs + 1) / DAY_MS));
  const daysPassed = Math.max(
    1,
    Math.min(totalDays, Math.ceil((now - startMs + 1) / DAY_MS)),
  );
  const projectedMins = Math.floor((currentMins / daysPassed) * totalDays);

  const overlapTargetMins = goals.reduce((sum, goal) => {
    const goalTotalDays = Math.max(
      1,
      Math.ceil((goal.endDate - goal.startDate + 1) / DAY_MS),
    );
    const overlapStart = Math.max(goal.startDate, startMs);
    const overlapEnd = Math.min(goal.endDate, endMs);
    if (overlapEnd < overlapStart) return sum;
    const overlapDays = Math.max(
      1,
      Math.ceil((overlapEnd - overlapStart + 1) / DAY_MS),
    );
    return sum + Math.floor((goal.targetMins * overlapDays) / goalTotalDays);
  }, 0);

  const startOfToday = new Date(dateNow);
  startOfToday.setHours(0, 0, 0, 0);
  const todayWorkMins = Math.floor(
    activities
      .filter(
        (a) => a.start_time >= startOfToday.getTime() && a.category === "work",
      )
      .reduce((sum, a) => sum + (a.duration || 0), 0) / 60,
  );
  const todayRecoveryMins = Math.floor(
    activities
      .filter(
        (a) =>
          a.start_time >= startOfToday.getTime() &&
          (a.category === "health" || a.category === "leisure"),
      )
      .reduce((sum, a) => sum + (a.duration || 0), 0) / 60,
  );

  let status: ForecastStatus = "no_goal";
  if (todayWorkMins > 600 && todayRecoveryMins === 0) {
    status = "burnout";
  } else if (overlapTargetMins > 0) {
    if (projectedMins >= overlapTargetMins) status = "on_track";
    else if (projectedMins < overlapTargetMins * 0.8) status = "behind";
    else status = "at_risk";
  }

  return {
    currentMins,
    targetMins: overlapTargetMins,
    projectedMins,
    daysPassed,
    totalDays,
    status,
    message: buildMessage(status),
  };
};
