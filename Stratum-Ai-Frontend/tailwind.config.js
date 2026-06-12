/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // CSS-variable-backed zinc palette — auto-switches with .dark class
        zinc: {
          50:  'hsl(var(--zinc-50)  / <alpha-value>)',
          100: 'hsl(var(--zinc-100) / <alpha-value>)',
          200: 'hsl(var(--zinc-200) / <alpha-value>)',
          300: 'hsl(var(--zinc-300) / <alpha-value>)',
          400: 'hsl(var(--zinc-400) / <alpha-value>)',
          500: 'hsl(var(--zinc-500) / <alpha-value>)',
          600: 'hsl(var(--zinc-600) / <alpha-value>)',
          700: 'hsl(var(--zinc-700) / <alpha-value>)',
          800: 'hsl(var(--zinc-800) / <alpha-value>)',
          900: 'hsl(var(--zinc-900) / <alpha-value>)',
          950: 'hsl(var(--zinc-950) / <alpha-value>)',
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
        },
        brand: {
          blue: '#3B82F6',
          'blue-light': '#60A5FA',
          orange: '#F97316',
          'orange-light': '#FB923C',
          green: '#10B981',
          'green-light': '#34D399',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in': { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgba(59,130,246,0.4)' },
          '70%': { boxShadow: '0 0 0 12px rgba(59,130,246,0)' },
          '100%': { boxShadow: '0 0 0 0 rgba(59,130,246,0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.3s ease-out',
        'pulse-ring': 'pulse-ring 2.5s ease-out infinite',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
