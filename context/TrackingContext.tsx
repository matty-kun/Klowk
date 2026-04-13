import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

export type Activity = {
  id: number;
  title: string;
  category: string | null;
  start_time: number;
  end_time: number | null;
  duration: number | null;
  created_at: number;
};

type TrackingContextType = {
  activities: Activity[];
  currentActivity: Activity | null;
  startTracker: (title: string, category: string) => Promise<void>;
  stopTracker: () => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
};

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);

  const refreshActivities = async () => {
    const result = await db.getAllAsync<Activity>('SELECT * FROM activities ORDER BY start_time DESC');
    
    // Global State Check: Identify ongoing activity
    const ongoing = result.find((a) => a.end_time === null);
    setCurrentActivity(ongoing || null);
    setActivities(result);
  };

  useEffect(() => {
    refreshActivities();
  }, []);

  const startTracker = async (title: string, category: string) => {
    if (currentActivity) return;
    const now = Date.now();
    await db.runAsync(
      'INSERT INTO activities (title, category, start_time, created_at) VALUES (?, ?, ?, ?)',
      [title, category, now, now]
    );
    await refreshActivities();
  };

  const stopTracker = async () => {
    if (!currentActivity) return;
    const now = Date.now();
    const durationMins = Math.round((now - currentActivity.start_time) / 60000);
    
    await db.runAsync(
      'UPDATE activities SET end_time = ?, duration = ? WHERE id = ?',
      [now, durationMins, currentActivity.id]
    );
    await refreshActivities();
  };

  const deleteActivity = async (id: number) => {
    await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
    await refreshActivities();
  };

  return (
    <TrackingContext.Provider value={{ activities, currentActivity, startTracker, stopTracker, deleteActivity, refreshActivities }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error('useTracking must be used within a TrackingProvider');
  return context;
}
