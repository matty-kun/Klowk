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
    return "Slow and steady wins the race! We're right on trail — keep leaving that silver streak!";
  }
  if (status === "behind") {
    return "The path is getting long. Even a snail like me gets there with consistent steps. Try one more focused hour.";
  }
  if (status === "burnout") {
    return "Even snails tuck in sometimes. You've been crawling hard — pull back into your shell and rest a bit.";
  }
  if (status === "at_risk") {
    return "Good pace, but the finish line is still far. One small push keeps us on the trail.";
  }
  return "Set a goal and I'll map out our trail together.";
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
