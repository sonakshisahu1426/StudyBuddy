/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f7f4',
          100: '#e1ede7',
          200: '#c5ddd1',
          300: '#9bc4b3',
          400: '#6ca590',
          500: '#488771',
          600: '#356c5a',
          700: '#2c5649',
          800: '#25463c',
          900: '#203a32',
          950: '#0f201b',
        },
        paper: {
          50: '#faf8f5',
          100: '#f5f1eb',
          200: '#ebe4d8',
          300: '#ded2c0',
          400: '#cbbaa1',
          500: '#ba9f83',
        },
        charcoal: {
          850: '#1e2126',
          900: '#17191d',
          950: '#111215',
        },
        stone: {
          750: '#26292e',
          850: '#1e2126',
        }
      },
      fontFamily: {
        serif: ['Lora', 'Merriweather', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'elevated': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }
    },
  },
  plugins: [],
}
