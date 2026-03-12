/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- ESTA LÍNEA ES LA CLAVE. SI FALTA, NO FUNCIONA.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'radar-ping': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        'dash-rotate': {
          '0%': { strokeDashoffset: '0' },
          '100%': { strokeDashoffset: '-314' },
        },
        'slide-up': {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'success-check': {
          '0%': { transform: 'scale(0) rotate(-45deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'pulse-red': {
          '0%, 100%': { backgroundColor: 'rgba(220, 38, 38, 0.95)' },
          '50%': { backgroundColor: 'rgba(185, 28, 28, 0.95)' },
        },
        'fadeIn': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          '0%': { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'radar-ping': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-ping-delay-1': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) 0.6s infinite',
        'radar-ping-delay-2': 'radar-ping 2s cubic-bezier(0, 0, 0.2, 1) 1.2s infinite',
        'shake': 'shake 0.5s ease-in-out',
        'dash-rotate': 'dash-rotate 8s linear infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'slide-down': 'slide-down 0.5s ease-out',
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'success-check': 'success-check 0.5s ease-out forwards',
        'pulse-red': 'pulse-red 1s ease-in-out infinite',
        'fadeIn': 'fadeIn 200ms ease-out',
        'slide-in-right': 'slide-in-right 200ms ease-out',
      },
    },
  },
  plugins: [],
}