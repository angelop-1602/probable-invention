"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { themeColors } from "@/lib/theme-utils";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: string;
};

type ThemeProviderState = {
  theme: string;
  setTheme: (theme: string) => void;
  colors: typeof themeColors;
};

const initialState: ThemeProviderState = {
  theme: "light",
  setTheme: () => null,
  colors: themeColors,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "light",
}: ThemeProviderProps) {
  const [theme, setTheme] = useState(defaultTheme);

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme,
    colors: themeColors,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
  return context;
}; 