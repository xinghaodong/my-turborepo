import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/home';
import About from '@/pages/about';

/**
 * 路由配置
 * 这里定义了应用的路由结构。
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/about',
    element: <About />,
  },
]);

export default router;
