import { createBrowserRouter } from 'react-router-dom';
import Home from '@/pages/home';

/**
 * 路由配置
 * 这里定义了应用的路由结构。
 */
const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
]);

export default router;
