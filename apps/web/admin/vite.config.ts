import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path'; // 新增这一行

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  //   server: {
  //     port: 3002,   // admin 建议使用 3002，避免与 web（通常 3000）冲突
  //   },
});
