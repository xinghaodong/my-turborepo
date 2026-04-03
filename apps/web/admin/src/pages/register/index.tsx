import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { registerApi } from '@/api/auth';
import styles from '../login/Auth.module.css';

const { Title, Text } = Typography;

export default function Register() {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const onFinish = async (values: any) => {
        try {
            setLoading(true);
            await registerApi({
                username: values.username,
                email: values.email,
                password: values.password,
                role: 'ADMIN', // 显式声明注册为管理员
                adminSecret: values.adminSecret, // 用户填入的密钥
            });
            message.success('注册成功，请重新登录管理系统');
            navigate('/login');
        } catch (error: any) {
            // 捕获权限错误提示
            message.error(error.message || '注册失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <Card className={styles.card}>
                <div className={styles.header}>
                    <Title level={3}>创建账号</Title>
                    <Text type="secondary">欢迎加入 Tiptap 协同系统管理平台</Text>
                </div>

                <Form name="register" onFinish={onFinish} layout="vertical" size="large">
                    <Form.Item name="username" rules={[{ required: true, message: '请输入用户名!' }]}>
                        <Input prefix={<UserOutlined />} placeholder="用户名" />
                    </Form.Item>

                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: '请输入邮箱!' },
                            { type: 'email', message: '请输入有效的邮箱地址!' },
                        ]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="邮箱" />
                    </Form.Item>

                    <Form.Item name="password" rules={[{ required: true, message: '请输入密码!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="密码" />
                    </Form.Item>

                    <Form.Item
                        name="confirmPassword"
                        dependencies={['password']}
                        rules={[
                            { required: true, message: '请确认密码!' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次输入的密码不一致!'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="确认密码" />
                    </Form.Item>

                    <div style={{ height: '1px', background: '#f0f0f0', margin: '24px 0' }} />
                    <Text type="secondary" style={{ display: 'block', marginBottom: 8, fontSize: '12px' }}>
                        🔒 管理员权限验证
                    </Text>

                    <Form.Item name="adminSecret" rules={[{ required: true, message: '请输入管理员注册口令!' }]}>
                        <Input.Password prefix={<LockOutlined />} placeholder="管理员注册口令" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading} block>
                            注册
                        </Button>
                    </Form.Item>

                    <div className={styles.footer}>
                        <Link to="/login">已有账号？点击登录</Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
}
