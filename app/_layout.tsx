import FontAwesome from '@expo/vector-icons/FontAwesome';
import "../global.css";
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { LogBox, View } from 'react-native';
import { SQLiteProvider, type SQLiteDatabase } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

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
      target_duration INTEGER,
      created_at INTEGER NOT NULL
    );
  `);

  // Migration: Add description column if it doesn't exist (for existing users)
  try {
    await db.execAsync('ALTER TABLE activities ADD COLUMN description TEXT;');
    console.log('Migration: Added description column');
  } catch (error) {}
  
  try {
    await db.execAsync('ALTER TABLE activities ADD COLUMN target_duration INTEGER;');
    console.log('Migration: Added target_duration column');
  } catch (error) {}
}

import { TrackingProvider } from '@/context/TrackingContext';
import { LanguageProvider } from '@/context/LanguageContext';
import FloatingTimer from '@/components/FloatingTimer';

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
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

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
      <LanguageProvider>
        <TrackingProvider>
          <RootLayoutNav />
        </TrackingProvider>
      </LanguageProvider>
    </SQLiteProvider>
  );
}

function RootLayoutNav() {
  const { colorScheme } = useColorScheme();

  const AppDarkTheme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: '#121212', card: '#121212' } };
  const AppLightTheme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: '#FFFFFF', card: '#FFFFFF' } };

  const bg = colorScheme === 'dark' ? '#121212' : '#FFFFFF';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? AppDarkTheme : AppLightTheme}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: bg }}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: bg },
            cardStyle: { backgroundColor: bg },
            cardOverlayEnabled: false,
            cardShadowEnabled: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="live" options={{ presentation: 'modal' }} />
          <Stack.Screen name="tracker" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
          <Stack.Screen name="chat" />
          <Stack.Screen name="chat-help" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="history" />
          <Stack.Screen name="categories" />
        </Stack>
        <FloatingTimer />
      </View>
    </ThemeProvider>
  );
}
