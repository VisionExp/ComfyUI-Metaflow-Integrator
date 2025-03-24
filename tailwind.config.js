/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'neutral-50': '#F5F5F7',
        'neutral-100': '#D6D7DE',
        'neutral-200': '#C1C4CD',
        'neutral-300': '#ADB0BC',
        'neutral-400': '#8E92A3',
        'neutral-500': '#70758A',
        'neutral-600': '#5C6071',
        'neutral-700': '#474A58',
        'neutral-800': '#33353F',
        'neutral-900': '#141519',
        'neutral-950': '#1B1C22',
        'shade-0': '#FFFFFF',
        'shade-100': '#262626',
        'error': '#FF3131',
        'success': '#00C013',
        'secondary-orange': '#F58617',
        'secondary-yellow': '#E2BF08',
        'secondary-blue': '#55A3EB',
        'secondary-purple': '#9045F0',
        'secondary-beige': '#AAAAA4',
      }
    },
  },
  corePlugins: {
    preflight: false,
  },
  plugins: [],
}
