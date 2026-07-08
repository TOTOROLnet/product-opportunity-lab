import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the build works under any
// GitHub Pages subdirectory (e.g. /product-opportunity-lab/2026-07-08/).
export default defineConfig({
  base: './',
  plugins: [react()],
})
