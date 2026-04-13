import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';

export type Activity = {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  start_time: number;
  end_time: number | null;
  duration: number | null;
  created_at: number;
};

type TrackingContextType = {
  activities: Activity[];
  currentActivity: Activity | null;
  startTracker: (title: string, category: string, description?: string) => Promise<void>;
  stopTracker: () => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  addManualActivity: (title: string, category: string, durationMins: number, description?: string, customDate?: Date) => Promise<void>;
  refreshActivities: () => Promise<void>;
  getTotalFocusTimeToday: () => number;
};

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const isRefreshing = useRef(false);
  const refreshActivities = async () => {
    if (!db || isRefreshing.current) return;
    isRefreshing.current = true;
    
    try {
      const result = await db.getAllAsync<Activity>('SELECT * FROM activities ORDER BY start_time DESC');
      
      // Global State Check: Identify ongoing activity
      const ongoing = result.find((a) => a.end_time === null);
      setCurrentActivity(ongoing || null);
      setActivities(result);
    } catch (err) {
      console.warn('DB Refresh issue (resource closed/hot-reload), retrying in next cycle');
    } finally {
      isRefreshing.current = false;
    }
  };

  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      // Small delay to ensure DB provider is stable after hot-reload
      await new Promise(resolve => setTimeout(resolve, 100));
      if (isMounted) await refreshActivities();
    };
    
    init();
    return () => { isMounted = false; };
  }, [db]); // Re-run if DB instance changes

  const startTracker = async (title: string, category: string, description?: string) => {
    if (currentActivity) return;
    try {
      const now = Date.now();
      await db.runAsync(
        'INSERT INTO activities (title, category, description, start_time, created_at) VALUES (?, ?, ?, ?, ?)',
        [title, category, description || null, now, now]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to start tracker:', err);
    }
  };

  const stopTracker = async () => {
    if (!currentActivity) return;
    try {
      const now = Date.now();
      const durationMins = Math.round((now - currentActivity.start_time) / 60000);
      
      await db.runAsync(
        'UPDATE activities SET end_time = ?, duration = ? WHERE id = ?',
        [now, durationMins, currentActivity.id]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to stop tracker:', err);
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      await db.runAsync('DELETE FROM activities WHERE id = ?', [id]);
      await refreshActivities();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    }
  };

  const addManualActivity = async (title: string, category: string, durationMins: number, description?: string, customDate?: Date) => {
    try {
      const timestamp = customDate ? customDate.getTime() : Date.now();
      const startTime = timestamp - (durationMins * 60000);
      await db.runAsync(
        'INSERT INTO activities (title, category, description, start_time, end_time, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [title, category, description || null, startTime, timestamp, durationMins, timestamp]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to add manual activity:', err);
    }
  };

  const getTotalFocusTimeToday = () => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    return activities
      .filter(a => a.created_at >= startOfToday && a.duration)
      .reduce((acc, curr) => acc + (curr.duration || 0), 0);
  };

  return (
    <TrackingContext.Provider value={{ 
      activities, 
      currentActivity, 
      startTracker, 
      stopTracker, 
      deleteActivity, 
      addManualActivity,
      refreshActivities,
      getTotalFocusTimeToday
    }}>
      {children}
    </TrackingContext.Provider>
  );
}

export function useTracking() {
  const context = useContext(TrackingContext);
  if (!context) throw new Error('useTracking must be used within a TrackingProvider');
  return context;
}
