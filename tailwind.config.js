/** @type {import('tailwindcss').Config} */
const palette = require('./constants/palette.json');
const color = (key) => {
  const fallback = [1, 3, 5].map(offset => parseInt(palette.dark[key].slice(offset, offset + 2), 16)).join(' ');
  return `rgb(var(--color-${key}, ${fallback}) / <alpha-value>)`;
};
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Premium Athletic Minimalism Neutral Base
        background: color('background'),
        backgroundSecondary: color('backgroundSecondary'),
        backgroundTertiary: color('backgroundTertiary'),
        surface: color('card'),
        surfaceElevated: color('surfaceElevated'),
        borderSubtle: color('cardBorder'),
        borderSubtleLight: color('cardBorder'),

        // Athletic Accent (20% Personality)
        primary: color('primary'),
        primaryLight: color('primaryLight'),
        primaryDark: color('primaryDark'),
        accent: color('primary'),
        onPrimary: color('onPrimary'),

        text: {
          DEFAULT: color('text'),
          secondary: color('textSecondary'),
          muted: color('textMuted'),
          dim: color('textMuted'),
        },

        success: color('success'),
        error: color('error'),
        warning: color('warning'),
        info: color('info'),

        category: {
          strength: color('backgroundTertiary'),
          cardio: color('infoMuted'),
          stretch: color('backgroundSecondary'),
          mobility: color('successMuted'),
        },
      },
      fontFamily: {
        display: ['Inter_700Bold', 'sans-serif'],
        'display-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'display-regular': ['Inter_400Regular', 'sans-serif'],
        'display-extrabold': ['Inter_700Bold', 'sans-serif'],
        sans: ['Inter_400Regular', 'sans-serif'],
        'sans-medium': ['Inter_500Medium', 'sans-serif'],
        'sans-semibold': ['Inter_600SemiBold', 'sans-serif'],
        'sans-bold': ['Inter_700Bold', 'sans-serif'],
      },
      borderRadius: {
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
      },
      spacing: {
        '0.5': '2px',
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '5': '20px',
        '6': '24px',
        '8': '32px',
        '10': '40px',
        '12': '48px',
      },
    },
  },
  plugins: [],
}
