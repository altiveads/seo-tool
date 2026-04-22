import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        altive: {
          50: '#EEF5FB',
          100: '#D7E8F4',
          200: '#A8CCE3',
          300: '#6FA7CD',
          400: '#3F82B3',
          500: '#2E86AB',
          600: '#1E5F88',
          700: '#0B3B5F',
          800: '#062A47',
          900: '#041D33',
        },
      },
      fontFamily: {
        sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
