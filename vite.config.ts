/// <reference types="vitest" />
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  base: '/food_calculator/',
  plugins: [
    vue(),
    {
      name: 'dev-eruda',
      transformIndexHtml(html, context) {
        if (context.server) { // 開発環境のみ
          return html.replace(
            '<div id="app"></div>',
            `<div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/eruda"></script>
    <script>eruda.init();</script>`
          );
        }
        return html;
      },
    },
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test-utils/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'src/test-utils/**',
        'src/**/*.test.{ts,js}',
        'src/**/*.spec.{ts,js}',
        'src/main.ts',
        'src/vite-env.d.ts'
      ]
    }
  }
})
