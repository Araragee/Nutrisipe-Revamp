const alphaVar = (varName) => ({ opacityValue }) =>
  opacityValue === undefined
    ? `var(${varName})`
    : `color-mix(in srgb, var(${varName}) calc(${opacityValue} * 100%), transparent)`

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1536px',
      }, 
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        nutriscore: {
          a: '#008b4c',
          b: '#85bb2f',
          c: '#fecb02',
          d: '#ee8100',
          e: '#e63e11',
        },
        nutrition: {
          calories: '#FF6B35',
          protein: '#4ECDC4',
          carbs: '#FFE66D',
          fat: '#FF6B8A',
        },
        orange: {
          DEFAULT: alphaVar('--orange'),
          light: alphaVar('--orange-light'),
          deep: alphaVar('--orange-deep'),
          glow: 'var(--orange-glow)',
          soft: 'var(--orange-soft)',
        },
        green: {
          DEFAULT: alphaVar('--green'),
          light: alphaVar('--green-light'),
          deep: alphaVar('--green-deep'),
          glow: 'var(--green-glow)',
          soft: 'var(--green-soft)',
        },
        border: alphaVar('--border'),
        background: {
          DEFAULT: alphaVar('--bg'),
          secondary: alphaVar('--bg2'),
        },
        surface: {
          DEFAULT: alphaVar('--surface'),
          solid: alphaVar('--surface-solid'),
        },
        text: {
          DEFAULT: alphaVar('--text'),
          muted: alphaVar('--text2'),
          dim: alphaVar('--text3'),
        },
        glass: {
          DEFAULT: alphaVar('--glass'),
          border: alphaVar('--glass-border'),
        }
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'btn': 'var(--radius-btn)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'modal': 'var(--shadow-modal)',
      },
      transitionTimingFunction: {
        'revamp': 'var(--transition)',
      },
      transitionDuration: {
        'revamp': '300ms',
      },
      borderWidth: {
        '1.5': '1.5px',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
