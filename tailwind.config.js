/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        moss: {
          50: '#f2f6f0',
          100: '#e1ebdc',
          400: '#7c9473',
          600: '#4a5f43',
          800: '#28351f',
          900: '#1f2e1e',
          950: '#141d13',
        },
        bloom: {
          400: '#ef8a72',
          500: '#e8735c',
          600: '#d1583f',
        },
        parchment: {
          DEFAULT: '#f3efe6',
          200: '#ece5d6',
        },
        ink: '#202420',
      },
      fontFamily: {
        display: ['Fraunces', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(20, 29, 19, 0.04), 0 8px 24px -12px rgba(20, 29, 19, 0.18)',
        cardDark: '0 1px 2px rgba(0,0,0,0.3), 0 12px 32px -16px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: 0, transform: 'scale(0.92) translateY(4px)' },
          '100%': { opacity: 1, transform: 'scale(1) translateY(0)' },
        },
        'fade-in': {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        'check-pop': {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.25)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      animation: {
        'pop-in': 'pop-in 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fade-in 0.4s ease-out',
        'check-pop': 'check-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
}
