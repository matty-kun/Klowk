import FontAwesome from '@expo/vector-icons/FontAwesome';
import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      category TEXT,
      description TEXT,
      start_time INTEGER NOT NULL,
      end_time INTEGER,
      duration INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: Add description column if it doesn't exist (for existing users)
  try {
    await db.execAsync('ALTER TABLE activities ADD COLUMN description TEXT;');
    console.log('Migration: Added description column');
  } catch (error) {
    // Column probably already exists, which is fine
  }
}

import { useColorScheme } from '@/components/useColorScheme';
import { TrackingProvider } from '@/context/TrackingContext';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="klowk.db" onInit={migrateDbIfNeeded}>
      <TrackingProvider>
        <RootLayoutNav />
      </TrackingProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  return (
    <ThemeProvider value={DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
