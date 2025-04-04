"use client";

import { useTheme } from "./theme-provider";
import { ThemeToggle } from "./theme-toggle";

export function ThemeShowcase() {
  const { colors } = useTheme();

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Theme Showcase</h1>
        <ThemeToggle />
      </div>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">Typography</h2>
        <div className="space-y-4">
          <div>
            <h1 className="text-4xl font-bold">Heading 1</h1>
            <p className="text-sm text-gray-500">text-4xl font-bold</p>
          </div>
          <div>
            <h2 className="text-3xl font-semibold">Heading 2</h2>
            <p className="text-sm text-gray-500">text-3xl font-semibold</p>
          </div>
          <div>
            <h3 className="text-2xl font-medium">Heading 3</h3>
            <p className="text-sm text-gray-500">text-2xl font-medium</p>
          </div>
          <div>
            <h4 className="text-xl font-medium">Heading 4</h4>
            <p className="text-sm text-gray-500">text-xl font-medium</p>
          </div>
          <div>
            <p className="text-base">Base Text - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-gray-500">text-base</p>
          </div>
          <div>
            <p className="text-sm">Small Text - The quick brown fox jumps over the lazy dog.</p>
            <p className="text-sm text-gray-500">text-sm</p>
          </div>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">Color Palette - Primary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(colors.primary).map(([shade, color]) => (
            <div key={shade} className="flex flex-col">
              <div 
                className="h-20 rounded-md mb-2"
                style={{ backgroundColor: color }}
              ></div>
              <div className="text-sm font-medium">{shade === 'DEFAULT' ? 'primary' : `primary-${shade}`}</div>
              <div className="text-xs text-gray-500">{color}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">Color Palette - Secondary</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries(colors.secondary).map(([shade, color]) => (
            <div key={shade} className="flex flex-col">
              <div 
                className="h-20 rounded-md mb-2"
                style={{ backgroundColor: color }}
              ></div>
              <div className="text-sm font-medium">{shade === 'DEFAULT' ? 'secondary' : `secondary-${shade}`}</div>
              <div className="text-xs text-gray-500">{color}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">UI Elements</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-medium mb-4">Buttons</h3>
            <div className="space-y-4">
              <button className="bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-600 transition-colors">
                Primary Button
              </button>
              <button className="bg-secondary text-primary px-4 py-2 rounded-md hover:bg-secondary-600 transition-colors ml-4">
                Secondary Button
              </button>
              <button className="border border-primary text-primary px-4 py-2 rounded-md hover:bg-primary-50 transition-colors ml-4">
                Outline Button
              </button>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-medium mb-4">Cards</h3>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
              <h4 className="text-lg font-medium mb-2 text-primary">Card Title</h4>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                This is a sample card component using our theme colors.
              </p>
              <button className="bg-primary text-white px-3 py-1 text-sm rounded-md hover:bg-primary-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 text-primary-600">Utility Colors</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries({
            success: colors.success.DEFAULT,
            "success-light": colors.success.light,
            warning: colors.warning.DEFAULT,
            "warning-light": colors.warning.light,
            error: colors.error.DEFAULT,
            "error-light": colors.error.light,
            info: colors.info.DEFAULT,
            "info-light": colors.info.light,
          }).map(([name, color]) => (
            <div key={name} className="flex flex-col">
              <div 
                className="h-16 rounded-md mb-2"
                style={{ backgroundColor: color }}
              ></div>
              <div className="text-sm font-medium">{name}</div>
              <div className="text-xs text-gray-500">{color}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
} 