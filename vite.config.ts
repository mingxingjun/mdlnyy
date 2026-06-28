import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from "vite-tsconfig-paths";

// https://vite.dev/config/
export default defineConfig({
  base: '/mdlnyy/',
  build: {
    sourcemap: false,
    // 目标 ES2022：现代浏览器原生支持 top-level await、class fields、
    // private methods 等，减少语法降级转换，减小 bundle 体积
    target: 'es2022',
    rollupOptions: {
      output: {
        // 代码分割：将第三方依赖拆分为独立 chunk，提升首屏加载与缓存命中率
        manualChunks: {
          // React 核心（react + react-dom + react-dom/client）
          'react-vendor': ['react', 'react-dom'],
          // framer-motion 动画库单独拆分（体积较大）
          'motion-vendor': ['framer-motion'],
          // 图标库单独拆分
          'icons-vendor': ['lucide-react'],
          // 状态管理
          'state-vendor': ['zustand'],
        },
      },
    },
  },
  plugins: [
    react(),
    tsconfigPaths()
  ],
})
