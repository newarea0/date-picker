/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,vue}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    // https://tailwindcss.com/docs/preflight#disabling-preflight
    preflight: false,
  },
}
