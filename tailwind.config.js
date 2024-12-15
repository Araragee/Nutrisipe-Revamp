/** @type {import('tailwindcss').Config} */

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
    // "./node_modules/flowbite/**/*.js",
    './tailwind-theme.ts',
  ],
  theme: {
    extend: {
      screens: {
        sm: '660px', // Small devices, such as mobile phones
        md: '768px', // Medium devices, such as tablets
        lg: '1024px', // Large devices, such as laptops
        xl: '1230px', // Extra-large devices
        '2xl': '1536px', // 2x large screens
      }, 
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        serif: ['Merriweather ', 'serif'],
        // mono: ['merriweather ', 'monospace'],
      },
      colors: {
        primary: {
          base: '#009999',
          '900': '#013535',
          '800': '#004C4D',
          '700': '#006E6F',
          '500': '#1AC0C0',
          '400': '#51D1D1',
          '300': '#ACF3F3',
          '200': '#CAFFFF',
          '100': '#F3FFFF',
        },
        secondary: {
          base: '#DB8D31',
          '900': '#2F2011',
          '800': '#713C00',
          '700': '#B56100',
          '500': '#FCAE53',
          '300': '#FFCD90',
          '200': '#FFE8CD',
          '100': '#FFF8F1',
        },
        error: {
          base: '#C22B3E',
          '900': '#280F12',
          '800': '#63020E',
          '700': '#9D091B',
          '400': '#FD8E9B',
          '300': '#FFAFB9',
          '200': '#FFD9DD',
          '100': '#FFF4F6',
        },
        gray: {
          base: '#A9A5A5',
          '900': '#212120',
          '800': '#333331',
          '700': '#52514F',
          '600': '#6C6B69',
          '400': '#C3C2BF',
          '300': '#D4D4D3',
          '200': '#EFEFEF',
          '100': '#F6F6F6',
        },
        fontSize: {
          'heading-1': '3rem', // Example: H1 size
          'heading-2': '2.5rem', // Example: H2 size
          'heading-3': '2rem', // Example: H3 size
          'heading-4': '1.75rem', // Example: H4 size
          'heading-5': '1.5rem', // Example: H5 size
          'heading-6': '1.25rem', // Example: H6 size
        },
        fontFamily: {
          sans: ['Inter', 'sans-serif'],
          serif: ['Inter', 'serif'],
        },
        theme: {
          light: '#F6F6F6',
          dark: '#141414',
        },
        white: '#FFFFFF',
        black: '#000000',
        gradient: {
          light: 'linear-gradient(262.7deg, #EAFFFF 0%, #FFF8F1 100%);',
          dark: 'linear-gradient(87.03deg, #2B2621 0%, #1A2525 100%);',
        },
      },
    },
  },

  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
