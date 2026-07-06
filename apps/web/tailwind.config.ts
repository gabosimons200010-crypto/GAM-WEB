import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Identidad editorial de la vitrina: blanco papel, negro tinta, líneas finas.
        paper: '#ffffff',
        ink: '#111111',
        muted: '#767676',
        line: '#e6e6e6',
        sale: '#d10000',
        // Paleta naranja original: la conservan los paneles internos (vendedor/admin).
        brand: {
          50: '#fff5ed',
          100: '#ffe8d4',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
      },
      fontFamily: {
        sans: ['var(--font-instrument)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        display: ['var(--font-bodoni)', 'Didot', 'Georgia', 'serif'],
      },
      letterSpacing: {
        caps: '0.14em',
      },
    },
  },
  plugins: [],
};

export default config;
