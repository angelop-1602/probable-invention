/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './Forms/**/*.{js,ts,jsx,tsx,mdx}',
    './Process/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#036635',
          50: '#E6F2ED', // Very light shade
          100: '#CCE6DB', // Light shade
          200: '#99CDB7', // Lighter shade
          300: '#66B393', // Light medium shade
          400: '#339A6F', // Medium shade
          500: '#036635', // Base color (primary)
          600: '#025C30', // Slightly darker
          700: '#02522B', // Darker
          800: '#014825', // Very dark
          900: '#013D1F', // Extremely dark
        },
        secondary: {
          DEFAULT: '#FECC07',
          50: '#FFFAE6', // Very light shade
          100: '#FFF6CC', // Light shade
          200: '#FFED99', // Lighter shade
          300: '#FEE466', // Light medium shade
          400: '#FEDB33', // Medium shade
          500: '#FECC07', // Base color (secondary)
          600: '#E5B900', // Slightly darker
          700: '#CCA400', // Darker
          800: '#B38F00', // Very dark
          900: '#997A00', // Extremely dark
        },
        // Additional colors for a complete theme
        success: {
          DEFAULT: '#10B981', // Green
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B', // Amber
          light: '#FEF3C7',
        },
        error: {
          DEFAULT: '#EF4444', // Red
          light: '#FEE2E2',
        },
        info: {
          DEFAULT: '#3B82F6', // Blue
          light: '#DBEAFE',
        },
        gray: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
      },
      // Add additional theme customizations
      borderRadius: {
        'xs': '0.125rem',
        'sm': '0.25rem',
        'md': '0.375rem',
        'lg': '0.5rem',
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
       },
      spacing: {
        '128': '32rem',
        '144': '36rem',
        '168': '42rem',
        '192': '48rem',
      },
      animation: {
        'bounce-slow': 'bounce 3s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      // Screen size breakpoints
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [],
} 