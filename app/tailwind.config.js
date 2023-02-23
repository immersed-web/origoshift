/* eslint-env node */

const colors = require('tailwindcss/colors');
const indielayer = require('@indielayer/ui/tailwind.preset');


/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  presets: [indielayer()],
  content: [
    './index.html',
    './**/*.vue',
    './src/**/*.{vue,js,ts,jsx,tsx}',
    'node_modules/@indielayer/ui/**/*',
    // 'node_modules/flowbite-vue/**/*.{js,jsx,ts,tsx}',
    // 'node_modules/flowbite/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: colors.emerald,
        secondary: colors.slate,
        weird: colors.pink,
        success: colors.green,
        warning: colors.yellow,
        error: colors.pink,
      },
    },
  },
  plugins: [
    // require('flowbite/plugin'),
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
