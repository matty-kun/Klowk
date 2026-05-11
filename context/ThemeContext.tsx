import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

export type PresetColor = {
  id: string;
  name: string;
  value: string;
};

export const PRESET_COLORS: PresetColor[] = [
  { id: "amber", name: "Amber", value: "#FBBF24" }, // Default Flow yellow
  { id: "teal", name: "Teal", value: "#14b8a6" },
  { id: "rose", name: "Rose", value: "#f43f5e" },
  { id: "pink", name: "Pink", value: "#f472b6" }, // Light Pink (Tailwind Pink 400)
  { id: "indigo", name: "Indigo", value: "#6366f1" },
  { id: "emerald", name: "Emerald", value: "#10b981" },
  { id: "violet", name: "Violet", value: "#8b5cf6" },
  { id: "sky", name: "Sky", value: "#0ea5e9" },
  { id: "orange", name: "Orange", value: "#f97316" },
  { id: "black", name: "Black", value: "#18181b" },
];

type ThemeContextType = {
  accentColor: string;
  setAccentColor: (hex: string) => Promise<void>;
  isLoading: boolean;
};

const ThemeContext = createContext<ThemeContextType>({
  accentColor: PRESET_COLORS[0].value,
  setAccentColor: async () => {},
  isLoading: true,
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [accentColor, setAccentColorState] = useState<string>(PRESET_COLORS[0].value);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadColor();
  }, []);

  const loadColor = async () => {
    try {
      const saved = await AsyncStorage.getItem("flow_accent_color");
      if (saved) {
        setAccentColorState(saved);
      }
    } catch (e) {
      console.error("Failed to load accent color:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const setAccentColor = async (hex: string) => {
    setAccentColorState(hex);
    try {
      await AsyncStorage.setItem("flow_accent_color", hex);
    } catch (e) {
      console.error("Failed to save accent color:", e);
    }
  };

  return (
    <ThemeContext.Provider value={{ accentColor, setAccentColor, isLoading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);

/**
 * Returns White if the accentColor is Black and the current mode is Dark.
 * Otherwise returns the accentColor.
 */
export const getContrastingColor = (accentColor: string, isDark: boolean) => {
  // If theme is Black (#18181b) and we are in dark mode, use White for foreground elements
  if (accentColor === "#18181b" && isDark) return "#FFFFFF";
  return accentColor;
};
