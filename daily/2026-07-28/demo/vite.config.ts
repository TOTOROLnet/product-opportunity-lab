import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' 使用相对路径，保证部署到任意 GitHub Pages 子目录都能正确加载资源。
export default defineConfig({
  base: './',
  plugins: [react()],
});
