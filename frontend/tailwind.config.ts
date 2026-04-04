import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-purple': '#7c3aed',
        'brand-violet': '#8b5cf6',
        'brand-indigo': '#4f46e5',
      },
    },
  },
  plugins: [],
}
export default config
