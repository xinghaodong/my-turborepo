import { useEffect, useState } from 'react';
import { Layout, Menu, Avatar, Dropdown, Button, Space, Switch } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  TeamOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  AppstoreAddOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTheme } from '@/contexts/ThemeContext';
import styles from './MainLayout.module.css';
import { User } from '@repo/types/user';

const { Header, Sider, Content } = Layout;

export default function MainLayout() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();

  useEffect(() => {
    setCurrentUser(JSON.parse(localStorage.getItem('user') || '{}'));
  }, []);

  const menuItems = [
    {
      key: '/home',
      icon: <DashboardOutlined />,
      label: '管理仪表盘',
    },
    {
      key: '/users',
      icon: <TeamOutlined />,
      label: '用户与权限',
    },
    {
      key: '/rooms',
      icon: <AppstoreAddOutlined />,
      label: '房间管理',
    },
    {
      key: '/about',
      icon: <InfoCircleOutlined />,
      label: '关于系统',
    },
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    navigate('/login');
  };

  const userMenu = {
    items: [
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录',
        onClick: handleLogout,
      },
    ],
  };

  return (
    <Layout className={styles.layout}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        theme={isDark ? 'dark' : 'light'}
        className={styles.sider}
      >
        <div
          className={`${styles.logo} ${isDark ? styles.logoDark : styles.logoLight}`}
        >
          {collapsed ? 'Tiptap' : 'Tiptap Admin'}
        </div>
        <Menu
          theme={isDark ? 'dark' : 'light'}
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header
          className={`${styles.header} ${isDark ? styles.headerDark : styles.headerLight}`}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={`${styles.trigger} ${isDark ? styles.triggerDark : styles.triggerLight}`}
          />
          <Space size="middle" style={{ paddingRight: 24 }}>
            <Switch
              checkedChildren="🌙"
              unCheckedChildren="☀️"
              checked={isDark}
              onChange={toggleTheme}
            />
            <Dropdown menu={userMenu} placement="bottomRight" arrow>
              <div className={styles.userProfile}>
                <Avatar className={styles.avatar} icon={<UserOutlined />} />
                <span
                  className={`${styles.username} ${isDark ? styles.usernameDark : styles.usernameLight}`}
                >
                  {currentUser?.username || '未知用户'}
                </span>
              </div>
            </Dropdown>
          </Space>
        </Header>
        <Content
          className={`${styles.content} ${isDark ? styles.contentDark : styles.contentLight}`}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
