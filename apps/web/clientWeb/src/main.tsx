// simple-peer 依赖 Node.js 的 process.nextTick，浏览器没有，需要 polyfill
if (typeof globalThis.process === 'undefined') {
  (globalThis as any).process = { env: {}, nextTick: (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0) };
} else if (typeof globalThis.process.nextTick !== 'function') {
  (globalThis as any).process.nextTick = (fn: Function, ...args: any[]) => setTimeout(() => fn(...args), 0);
}

import { createRoot } from 'react-dom/client';
import './index.css';
import router from './router/router';
import { RouterProvider } from 'react-router-dom';

createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />,
);
