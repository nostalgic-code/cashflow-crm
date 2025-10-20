/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Monday.com inspired Cashflow CRM Color Scheme
        'monday-blue': '#0073ea',
        'monday-purple': '#a25ddc', 
        'monday-green': '#00d647',
        'monday-yellow': '#ffcc00',
        'monday-red': '#e2445c',
        'monday-orange': '#ff642e',
        'monday-pink': '#ff158a',
        'monday-teal': '#00c1cc',
        // Status colors
        'status': {
          'new': '#0073ea',
          'active': '#a25ddc',
          'due': '#ffcc00',
          'paid': '#00d647',
          'overdue': '#e2445c',
        },
        // Neutral colors
        'monday-gray': {
          50: '#f8f9fc',
          100: '#f0f2f7',
          200: '#e1e6ef',
          300: '#c7d0dd',
          400: '#9faabb',
          500: '#758399',
          600: '#596477',
          700: '#424b5a',
          800: '#2f3441',
          900: '#1f242d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'crm': '0 2px 4px rgba(0,0,0,0.1)',
        'crm-lg': '0 4px 8px rgba(0,0,0,0.15)',
        'crm-xl': '0 8px 16px rgba(0,0,0,0.2)',
      },
      borderRadius: {
        'crm': '6px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in': 'slideIn 0.3s ease-in-out',
        'pulse-slow': 'pulse 3s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}