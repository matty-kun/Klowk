import { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import * as Haptics from 'expo-haptics';
import { CATEGORIES as DEFAULT_CATEGORIES, CategoryId } from '@/constants/Categories';

export type Category = {
  id: string;
  label: string;
  color: string;
  iconName: string;
};

export type Activity = {
  id: number;
  title: string;
  category: string | null;
  description: string | null;
  start_time: number;
  end_time: number | null;
  duration: number | null;
  target_duration: number | null;
  created_at: number;
};

type TrackingContextType = {
  activities: Activity[];
  currentActivity: Activity | null;
  categories: Category[];
  startTracker: (title: string, category: string, description?: string, targetSecs?: number) => Promise<void>;
  stopTracker: () => Promise<void>;
  deleteActivity: (id: number) => Promise<void>;
  addManualActivity: (title: string, category: string, durationSecs: number, description?: string, customDate?: Date) => Promise<void>;
  editActivity: (id: number, title: string, category: string, durationSecs: number, description?: string, customDate?: Date) => Promise<void>;
  duplicateActivity: (id: number) => Promise<void>;
  refreshActivities: () => Promise<void>;
  addCategory: (label: string, iconName: string, color: string) => void;
  getTotalFocusTimeToday: () => number;
};

const TrackingContext = createContext<TrackingContextType | null>(null);

export function TrackingProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentActivity, setCurrentActivity] = useState<Activity | null>(null);
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const isRefreshing = useRef(false);

  const addCategory = (label: string, iconName: string, color: string) => {
    const newCat: Category = {
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
      iconName,
      color
    };
    setCategories(prev => [...prev, newCat]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

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

  const startTracker = async (title: string, category: string, description?: string, targetSecs?: number) => {
    if (currentActivity) return;
    try {
      const now = Date.now();
      await db.runAsync(
        'INSERT INTO activities (title, category, description, start_time, target_duration, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [title, category, description || null, now, targetSecs || null, now]
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
      const durationSecs = Math.max(0, Math.floor((now - currentActivity.start_time) / 1000));
      
      await db.runAsync(
        'UPDATE activities SET end_time = ?, duration = ? WHERE id = ?',
        [now, durationSecs, currentActivity.id]
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

  const addManualActivity = async (title: string, category: string, durationSecs: number, description?: string, customDate?: Date) => {
    try {
      const timestamp = customDate ? customDate.getTime() : Date.now();
      const startTime = timestamp - (durationSecs * 1000);
      await db.runAsync(
        'INSERT INTO activities (title, category, description, start_time, end_time, duration, target_duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [title, category, description || null, startTime, timestamp, durationSecs, durationSecs, timestamp]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to add manual activity:', err);
    }
  };

  const editActivity = async (id: number, title: string, category: string, durationSecs: number, description?: string, customDate?: Date) => {
    try {
      const timestamp = customDate ? customDate.getTime() : Date.now();
      const startTime = timestamp - (durationSecs * 1000);
      await db.runAsync(
        'UPDATE activities SET title = ?, category = ?, description = ?, start_time = ?, end_time = ?, duration = ? WHERE id = ?',
        [title, category, description || null, startTime, timestamp, durationSecs, id]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to edit activity:', err);
    }
  };

  const duplicateActivity = async (id: number) => {
    try {
      const activityToCopy = activities.find(a => a.id === id);
      if (!activityToCopy) return;
      
      const now = Date.now();
      await db.runAsync(
        'INSERT INTO activities (title, category, description, start_time, end_time, duration, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [activityToCopy.title, activityToCopy.category, activityToCopy.description, now, now + ((activityToCopy.duration || 0) * 60000), activityToCopy.duration, now]
      );
      await refreshActivities();
    } catch (err) {
      console.error('Failed to duplicate activity:', err);
    }
  };

  const getTotalFocusTimeToday = () => {
    const startOfToday = new Date().setHours(0, 0, 0, 0);
    const secs = activities
      .filter(a => a.created_at >= startOfToday && a.duration)
      .reduce((acc, curr) => acc + (curr.duration || 0), 0);
    return Math.floor(secs / 60); // Return minutes for the dashboard summary compatibility
  };

  return (
    <TrackingContext.Provider value={{ 
      activities, 
      currentActivity, 
      categories,
      startTracker, 
      stopTracker, 
      deleteActivity, 
      addManualActivity,
      editActivity,
      duplicateActivity,
      refreshActivities,
      addCategory,
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
