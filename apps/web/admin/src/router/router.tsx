import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '@/components/Layout/MainLayout';

// 懒加载页面组件
const Home = lazy(() => import('@/pages/home'));
const About = lazy(() => import('@/pages/about'));
const Login = lazy(() => import('@/pages/login'));
const Register = lazy(() => import('@/pages/register'));
const UserManagement = lazy(() => import('@/pages/user'));
const RoomManagement = lazy(() => import('@/pages/room'));

// 全局 loading 回退组件
const SuspenseFallback = ({ fullScreen = false }: { fullScreen?: boolean }) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: fullScreen ? '100vh' : '100%',
      width: '100%',
    }}
  >
    <Spin size="large" description="加载中..." />
  </div>
);

// 高阶函数：包裹懒加载组件
const load = (Component: React.ComponentType, fullScreen: boolean = false) => (
  <Suspense fallback={<SuspenseFallback fullScreen={fullScreen} />}>
    <Component />
  </Suspense>
);

/**
 * 路由配置
 * 这里定义了应用的路由结构。
 */
const router = createBrowserRouter([
  {
    path: '/login',
    element: load(Login, true),
  },
  {
    path: '/register',
    element: load(Register, true),
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/home" replace />, // 默认根路径重定向
      },
      {
        path: 'home',
        element: load(Home),
      },
      {
        path: 'users',
        element: load(UserManagement),
      },
      {
        path: 'rooms',
        element: load(RoomManagement),
      },
      {
        path: 'about',
        element: load(About),
      },
    ],
  },
]);

export default router;
