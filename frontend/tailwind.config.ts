import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        lamberpool: {
          dark: '#0f3460',
          light: '#16a085',
        },
      },
    },
  },
  plugins: [],
}
export default config
