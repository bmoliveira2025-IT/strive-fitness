/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Premium Athletic Minimalism Neutral Base
        background: '#0D0F12',
        backgroundSecondary: '#13161B',
        backgroundTertiary: '#1A1E24',
        surface: '#161A20',
        surfaceElevated: '#1E232B',
        borderSubtle: 'rgba(255, 255, 255, 0.07)',
        borderSubtleLight: 'rgba(15, 23, 42, 0.08)',

        // Athletic Accent (20% Personality)
        primary: '#B7F52A',
        primaryLight: '#D7FF72',
        primaryDark: '#8CC80D',
        accent: '#B7F52A',

        text: {
          DEFAULT: '#F8FAFC',
          secondary: '#94A3B8',
          muted: '#64748B',
          dim: '#475569',
        },

        success: '#10B981',
        error: '#EF4444',
        warning: '#F59E0B',

        category: {
          strength: '#1E293B',
          cardio: '#312E81',
          stretch: '#4C1D95',
          mobility: '#064E3B',
        },
      },
      fontFamily: {
        display: ['Sora_700Bold', 'sans-serif'],
        'display-semibold': ['Sora_600SemiBold', 'sans-serif'],
        'display-regular': ['Sora_400Regular', 'sans-serif'],
        'display-extrabold': ['Sora_800ExtraBold', 'sans-serif'],
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
