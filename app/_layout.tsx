import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { SQLiteProvider, type SQLiteDatabase } from "expo-sqlite";
import { StatusBar } from "expo-status-bar";
import { useColorScheme } from "nativewind";
import { useEffect } from "react";
import { LogBox } from "react-native";
import "react-native-reanimated";
import "../global.css";

async function migrateDbIfNeeded(db: SQLiteDatabase) {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA busy_timeout = 5000;
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
    await db.execAsync("ALTER TABLE activities ADD COLUMN description TEXT;");
    console.log("Migration: Added description column");
  } catch (error) {}

  try {
    await db.execAsync(
      "ALTER TABLE activities ADD COLUMN target_duration INTEGER;",
    );
    console.log("Migration: Added target_duration column");
  } catch (error) {}
}

import FloatingTimer from "@/components/FloatingTimer";
import { LanguageProvider } from "@/context/LanguageContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { loadHapticsPreference } from "@/utils/haptics";
import { OnboardingProvider, useOnboarding } from "@/context/OnboardingContext";
import { TrackingProvider } from "@/context/TrackingContext";

export {
    // Catch any errors thrown by the Layout component.
    ErrorBoundary
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
LogBox.ignoreLogs([
  "SafeAreaView has been deprecated and will be removed in a future release. Please use 'react-native-safe-area-context' instead.",
]);

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
      loadHapticsPreference();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <SQLiteProvider databaseName="klowk.db" onInit={migrateDbIfNeeded}>
      <LanguageProvider>
        <TrackingProvider>
          <OnboardingProvider>
            <RootLayoutNav />
          </OnboardingProvider>
        </TrackingProvider>
      </LanguageProvider>
    </SQLiteProvider>
  );
}

const COLOR_SCHEME_KEY = "klowk_color_scheme";

function RootLayoutNav() {
  const { colorScheme, setColorScheme } = useColorScheme();
  const { isOnboarded } = useOnboarding();
  const router = useRouter();

  // Restore saved color scheme on launch
  useEffect(() => {
    AsyncStorage.getItem(COLOR_SCHEME_KEY).then((saved) => {
      if (saved === "dark" || saved === "light") setColorScheme(saved);
    });
  }, []);

  useEffect(() => {
    if (!isOnboarded) {
      router.replace("/onboarding/handshake");
    }
  }, [isOnboarded]);

  const AppDarkTheme = {
    ...DarkTheme,
    colors: { ...DarkTheme.colors, background: "#121212", card: "#121212" },
  };
  const AppLightTheme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: "#FFFFFF", card: "#FFFFFF" },
  };

  const bg = colorScheme === "dark" ? "#121212" : "#FFFFFF";

  return (
    <ThemeProvider
      value={colorScheme === "dark" ? AppDarkTheme : AppLightTheme}
    >
      <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
          contentStyle: { backgroundColor: bg },
          cardStyle: { backgroundColor: bg },
          cardOverlayEnabled: false,
          cardShadowEnabled: false,
        }}
      >
        <Stack.Screen
          name="(tabs)"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="onboarding"
          options={{
            presentation: "fullScreenModal",
            animation: "slide_from_bottom",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="logmanual"
          options={{
            presentation: "modal",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="live"
          options={{
            presentation: "modal",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="tracker"
          options={{
            presentation: "fullScreenModal",
            animation: "fade",
            contentStyle: { backgroundColor: bg },
          }}
        />
        <Stack.Screen
          name="chat"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="chat-help"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="settings"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="history"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
        <Stack.Screen
          name="categories"
          options={{ contentStyle: { backgroundColor: bg } }}
        />
      </Stack>
      {isOnboarded && <FloatingTimer />}
    </ThemeProvider>
  );
}
