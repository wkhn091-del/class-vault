/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F7F4EF', // paper cream — beit midrash quiet
        surface: '#FFFFFF',
        raised: '#FBF9F5',
        ink: '#1A1A1A',
        graphite: '#5C6578',
        mute: '#8A93A0',
        hairline: '#E5E1D8',
        navy: '#1E3A5F', // from Metivta logo
        navyDeep: '#152A45',
        blue: '#3B6EA5',
        brass: '#A97C25',
        brassSoft: '#F5E7C4',
        danger: '#8B2E2E',
        ok: '#2F5D50',
      },
      fontFamily: {
        display: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
        sans: ['Rubik', 'Assistant', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(30,58,95,0.05), 0 12px 28px -22px rgba(30,58,95,0.45)',
        lift: '0 2px 4px rgba(30,58,95,0.06), 0 24px 48px -28px rgba(30,58,95,0.5)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      transitionDuration: {
        instant: '100ms',
        fast: '180ms',
        base: '280ms',
        slow: '500ms',
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.16, 1, 0.3, 1)',
        in: 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        riseIn: 'riseIn 0.5s cubic-bezier(0.16,1,0.3,1) both',
        marquee: 'marquee 42s linear infinite',
      },
    },
  },
  plugins: [],
};
