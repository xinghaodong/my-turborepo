import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const header = ({ title }: { title: string }) => {
    const [userInfo, setUserInfo] = useState<any>(null);
    const navigate = useNavigate();
    const logout = () => {
        localStorage.removeItem('khaccessToken');
        localStorage.removeItem('khrefreshToken');
        localStorage.removeItem('khuserInfo');
        navigate('/login');
    };

    useEffect(() => {
        const info = localStorage.getItem('khuserInfo');
        if (info) setUserInfo(JSON.parse(info));
    }, []);

    return (
        <header className="home-header">
            <div className="brand">
                <span className="logo">🚀</span>
                <h1>协同编辑 · {title}</h1>
            </div>
            <div className="user-profile">
                <span className="username">👋 欢迎, {userInfo?.username}</span>
                <button className="logout-btn" onClick={logout}>
                    退出登录
                </button>
            </div>
        </header>
    );
};
export default header;
