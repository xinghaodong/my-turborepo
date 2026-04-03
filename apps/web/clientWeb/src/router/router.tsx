import { createBrowserRouter, Navigate } from 'react-router-dom';
import Home from '@/pages/home';
import RoomPage from '@/pages/room';
import Login from '@/pages/login';
import Register from '@/pages/register';

// 鉴权高阶组件，如果没登录重定向到登录页
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const token = localStorage.getItem('khaccessToken');
    if (!token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

/**
 * 路由配置
 * 这里定义了应用的路由结构。
 */
const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Home />
            </ProtectedRoute>
        ),
    },
    {
        path: '/room/:id',
        element: (
            <ProtectedRoute>
                <RoomPage />
            </ProtectedRoute>
        ),
    },
    {
        path: '/login',
        element: <Login />,
    },
    {
        path: '/register',
        element: <Register />,
    },
]);

export default router;
