/**
 * Theme utilities and helper functions
 * 
 * This file contains utility functions for working with the theme colors and values
 */

// Colors object that mirrors our tailwind.config.js color definitions
export const themeColors = {
  primary: {
    DEFAULT: '#036635',
    50: '#E6F2ED',
    100: '#CCE6DB',
    200: '#99CDB7',
    300: '#66B393',
    400: '#339A6F',
    500: '#036635',
    600: '#025C30',
    700: '#02522B',
    800: '#014825',
    900: '#013D1F',
  },
  secondary: {
    DEFAULT: '#FECC07',
    50: '#FFFAE6',
    100: '#FFF6CC',
    200: '#FFED99',
    300: '#FEE466',
    400: '#FEDB33',
    500: '#FECC07',
    600: '#E5B900',
    700: '#CCA400',
    800: '#B38F00',
    900: '#997A00',
  },
  success: {
    DEFAULT: '#10B981',
    light: '#D1FAE5',
  },
  warning: {
    DEFAULT: '#F59E0B',
    light: '#FEF3C7',
  },
  error: {
    DEFAULT: '#EF4444',
    light: '#FEE2E2',
  },
  info: {
    DEFAULT: '#3B82F6',
    light: '#DBEAFE',
  },
};

// Helper function to get a specific color
export function getColor(colorName: string, shade: string | number = 'DEFAULT'): string {
  const parts = colorName.split('.');
  
  if (parts.length === 1) {
    // Direct color like "primary" or "secondary"
    const color = themeColors[colorName as keyof typeof themeColors];
    if (!color) return '';
    return color[shade as keyof typeof color] || color.DEFAULT;
  } else if (parts.length === 2) {
    // Nested color like "primary.100"
    const color = themeColors[parts[0] as keyof typeof themeColors];
    if (!color) return '';
    return color[parts[1] as keyof typeof color] || '';
  }
  
  return '';
}

// Function to get CSS variable value
export function getCssVar(name: string): string {
  if (typeof window === 'undefined') return '';
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

// Function to set CSS variable
export function setCssVar(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  document.documentElement.style.setProperty(`--${name}`, value);
}

// Function to generate gradient from primary color
export function getPrimaryGradient(direction = 'to right'): string {
  return `linear-gradient(${direction}, ${themeColors.primary[400]}, ${themeColors.primary.DEFAULT})`;
}

// Function to generate gradient from secondary color
export function getSecondaryGradient(direction = 'to right'): string {
  return `linear-gradient(${direction}, ${themeColors.secondary[400]}, ${themeColors.secondary.DEFAULT})`;
} 