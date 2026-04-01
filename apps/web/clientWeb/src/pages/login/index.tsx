import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '@/api/auth';
import './Login.css';

const Login = () => {
  const [email, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res: any = await login({ email, password });
      localStorage.setItem('khaccessToken', res.accessToken);
      localStorage.setItem('khrefreshToken', res.refreshToken);
      localStorage.setItem('khuserInfo', JSON.stringify(res.user));
      navigate('/');
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查账号密码');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>协同编辑 · 欢迎回来</h1>
          <p>登录以开始您的实时创作之旅</p>
        </div>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-item">
            <label>邮箱</label>
            <input
              type="text"
              placeholder="请输入您的邮箱"
              value={email}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-item">
            <label>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '正在登录...' : '立即登录'}
          </button>
        </form>
        <div className="login-footer">
          还没有账号？<a href="/register">点击注册</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
