
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':       { transform: 'translateX(-4px)' },
          '75%':       { transform: 'translateX(4px)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shake:    'shake 0.2s ease-in-out 0s 2',
        'slide-in': 'slideIn 0.4s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;