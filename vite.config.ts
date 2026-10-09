import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    include: ['scripts/**/*.test.ts', 'src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
