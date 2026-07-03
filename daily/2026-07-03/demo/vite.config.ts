import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps asset paths relative so the build works when served from
// any GitHub Pages subpath, e.g. /product-opportunity-lab/2026-07-03/
export default defineConfig({
  base: './',
  plugins: [react()],
})
