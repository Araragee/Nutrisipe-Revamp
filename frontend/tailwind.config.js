/** @type {import('tailwindcss').Config} */

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
        orange: {
          DEFAULT: 'var(--orange)',
          light: 'var(--orange-light)',
          glow: 'var(--orange-glow)',
          soft: 'var(--orange-soft)',
        },
        background: {
          DEFAULT: 'var(--bg)',
          secondary: 'var(--bg2)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          solid: 'var(--surface-solid)',
        },
        text: {
          DEFAULT: 'var(--text)',
          muted: 'var(--text2)',
          dim: 'var(--text3)',
        },
        glass: {
          DEFAULT: 'var(--glass)',
          border: 'var(--glass-border)',
        }
      },
      borderRadius: {
        'card': 'var(--radius-card)',
        'btn': 'var(--radius-btn)',
      },
      boxShadow: {
        'card': 'var(--shadow-card)',
        'modal': 'var(--shadow-modal)',
      },
      transitionTimingFunction: {
        'revamp': 'var(--transition)',
      },
      transitionDuration: {
        'revamp': '300ms',
      },
      opacity: {
        '18': '0.18',
      },
      borderWidth: {
        '1.5': '1.5px',
      }
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
};
