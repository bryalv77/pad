import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    coverage: { reporter: ['text', 'html'], include: ['src/lib/fonts.ts', 'src/lib/markdown.ts', 'src/components/font-picker.tsx', 'src/components/markdown-editor.tsx'] },
  },
})
