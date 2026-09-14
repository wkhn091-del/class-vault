/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#EEF0EB',    // page
        surface: '#FFFFFF',
        raised: '#F8F9F5',
        ink: '#141A21',       // primary text
        graphite: '#5C6673',  // secondary text
        mute: '#8A93A0',
        hairline: '#E1E4DD',
        navy: '#1B3A5E',      // primary action
        navyDeep: '#122942',
        brass: '#A97C25',     // admin accent, used sparingly
        brassSoft: '#F5E7C4',
        danger: '#A63D2A',
      },
      fontFamily: {
        // Frank Ruhl Libre is the Hebrew book serif — the right voice for an
        // archive. Assistant carries the interface in both scripts.
        display: ['"Frank Ruhl Libre"', 'Georgia', 'serif'],
        sans: ['Assistant', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(20,26,33,0.04), 0 12px 28px -22px rgba(20,26,33,0.5)',
        lift: '0 2px 4px rgba(20,26,33,0.05), 0 24px 48px -28px rgba(20,26,33,0.55)',
        inset: 'inset 0 1px 0 rgba(255,255,255,0.7)',
      },
      keyframes: {
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: { riseIn: 'riseIn 0.4s cubic-bezier(0.22,1,0.36,1) both' },
    },
  },
  plugins: [],
};
