/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Design System Core Palette (White Theme)
        'brand-bg': '#FFFFFF',
        'brand-bg-sub': '#F8FAFC',
        'brand-text': '#172033',
        'brand-text-sub': '#64748B',
        'brand-blue': '#2563EB',
        'brand-blue-light': '#EFF6FF',
        'brand-teal': '#0D9488',
        'brand-border': '#E2E8F0',
        'brand-success': '#16A34A',
        'brand-warning': '#D97706',
        'brand-danger': '#DC2626',

        // Semantic Material / Token Mapping to Clean White Theme
        'surface': '#FFFFFF',
        'surface-dim': '#F8FAFC',
        'surface-bright': '#FFFFFF',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FFFFFF',
        'surface-container': '#F8FAFC',
        'surface-container-high': '#F1F5F9',
        'surface-container-highest': '#E2E8F0',
        'surface-variant': '#F1F5F9',

        'on-surface': '#172033',
        'on-surface-variant': '#64748B',
        'inverse-surface': '#172033',
        'inverse-on-surface': '#F8FAFC',

        'outline': '#CBD5E1',
        'outline-variant': '#E2E8F0',

        'primary': '#2563EB',
        'on-primary': '#FFFFFF',
        'primary-container': '#EFF6FF',
        'on-primary-container': '#1D4ED8',
        'inverse-primary': '#2563EB',

        'secondary': '#0D9488',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#CCFBF1',
        'on-secondary-container': '#0F766E',

        'tertiary': '#6366F1',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#EEF2FF',
        'on-tertiary-container': '#4338CA',

        'error': '#DC2626',
        'on-error': '#FFFFFF',
        'error-container': '#FEE2E2',
        'on-error-container': '#991B1B',

        'background': '#F8FAFC',
        'on-background': '#172033',
      },
      borderRadius: {
        'DEFAULT': '0.375rem',
        'md': '0.5rem',
        'lg': '0.625rem',
        'xl': '0.75rem',
        '2xl': '1rem',
        'full': '9999px',
      },
      boxShadow: {
        'subtle': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.03)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        'label-caps': ['Inter', 'sans-serif'],
        'label-code': ['JetBrains Mono', 'monospace'],
        'body-sm': ['Inter', 'sans-serif'],
        'body-md': ['Inter', 'sans-serif'],
        'body-lg': ['Inter', 'sans-serif'],
        'data-metric': ['Inter', 'sans-serif'],
        'headline-md': ['Inter', 'sans-serif'],
        'headline-lg': ['Inter', 'sans-serif'],
        'headline-xl': ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
