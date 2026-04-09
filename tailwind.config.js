/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1e3a5f',
        'background-dark': '#0f172a',
      },
    },
  },
  // Avoid resetting global styles used by the rest of the app (sidebar, etc.)
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
