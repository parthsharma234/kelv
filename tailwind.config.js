/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#030305',
          800: '#0a0a0d',
          700: '#111115',
          600: '#1a1a1e',
          500: '#26262c',
          400: '#38353e',
        },
        kelv: {
          orange: '#E8651A',
          'orange-dim': 'rgba(232,101,26,0.12)',
          text: '#F0EDE8',
          muted: '#68655F',
          border: 'rgba(255,255,255,0.06)',
        },
        orange: {
          500: '#E8651A',
          400: '#F07832',
          300: '#F5964E',
          200: '#F9B98A',
          100: '#FCDDC2',
        },
        gray: {
          900: '#1a1a1a',
          800: '#2a2a2a',
          700: '#3a3a3a',
          600: '#5a5a5a',
          500: '#8a8a88',
          400: '#b0aca6',
          300: '#ccc8c2',
          200: '#e0ddd8',
          100: '#f0ede8',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['IBM Plex Mono', 'Menlo', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
      },
      letterSpacing: {
        widest: '0.25em',
        'ultra-wide': '0.35em',
      },
      animation: {
        'fade-in': 'fadeIn 0.8s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16,1,0.3,1)',
        'slide-down': 'slideDown 0.6s cubic-bezier(0.16,1,0.3,1)',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        slideDown: {
          '0%': { transform: 'translateY(-16px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
