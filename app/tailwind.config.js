/* eslint-env node */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './**/*.vue',
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  plugins: [
    require('daisyui'),
  ],
  daisyui: {
    styled: true,
    themes: ['light', 'dark'],
    base: true,
    utils: true,
    logs: true,
    rtl: false,
    prefix: '',
    darkTheme: 'dark',
  },
};
