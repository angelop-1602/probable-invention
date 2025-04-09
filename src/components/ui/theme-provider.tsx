"use client";

import * as React from "react";
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
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState(defaultTheme);

  // Only run on client side
  useEffect(() => {
    setMounted(true);
    // Check for system preference or stored preference
    const storedTheme = localStorage.getItem("theme");
    if (storedTheme) {
      setTheme(storedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setTheme("dark");
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    
    // Store theme preference
    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  // Force the value to match the default theme for the first render
  const value = {
    theme: mounted ? theme : defaultTheme,
    setTheme: (newTheme: string) => {
      if (mounted) {
        setTheme(newTheme);
      }
    },
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