import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRooms, getPublicRooms, joinRoom } from '@/api/room';
import './Home.css';

const Home = () => {
  const [myRooms, setMyRooms] = useState<any[]>([]);
  const [publicRooms, setPublicRooms] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState('');
  const [userInfo, setUserInfo] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const info = localStorage.getItem('khuserInfo');
    if (info) setUserInfo(JSON.parse(info));

    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const myData = await getMyRooms();
      setMyRooms(myData);
      const publicData = await getPublicRooms();
      setPublicRooms(publicData);
    } catch (err) {
      console.error('加载房间失败', err);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode) return;
    try {
      const res: any = await joinRoom({ inviteCode });
      navigate(`/room/${res.roomId}`);
    } catch (err: any) {
      alert(err?.message || '加入房间失败');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="brand">
          <span className="logo">🚀</span>
          <h1>协同编辑 · 首页</h1>
        </div>
        <div className="user-profile">
          <span className="username">👋 欢迎, {userInfo?.username}</span>
          <button className="logout-btn" onClick={logout}>
            退出登录
          </button>
        </div>
      </header>

      <main className="home-main">
        <section className="join-section">
          <div className="section-header">
            <h2>加入已有房间</h2>
            <p>输入邀请码，立刻开始协作</p>
          </div>
          <div className="join-input-group">
            <input
              type="text"
              placeholder="请输入邀请码 (如: ABC-123)"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            />
            <button className="join-btn" onClick={handleJoin}>
              立即加入
            </button>
          </div>
        </section>

        <section className="rooms-section">
          <div className="section-header">
            <h2>我的房间</h2>
            <p>您加入或创建的房间列表</p>
          </div>
          <div className="rooms-grid">
            {myRooms.length > 0 ? (
              myRooms.map((room) => (
                <div
                  key={room.id}
                  className="room-card"
                  onClick={() => navigate(`/room/${room.id}`)}
                >
                  <div className="room-card-header">
                    <h3>{room.title}</h3>
                    <span
                      className={`role-badge ${room.myRole?.toLowerCase()}`}
                    >
                      {room.myRole}
                    </span>
                  </div>
                  <p>{room.description || '暂无描述'}</p>
                  <div className="room-card-footer">
                    <span>👥 {room._count?.members || 0} 人已加入</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                暂无房间，去公众大厅看看或通过邀请码加入
              </div>
            )}
          </div>
        </section>

        <section className="rooms-section">
          <div className="section-header">
            <h2>公共大厅</h2>
            <p>发现并参与大家的讨论</p>
          </div>
          <div className="rooms-grid">
            {publicRooms.map((room) => (
              <div
                key={room.id}
                className="room-card room-card-public"
                onClick={() => navigate(`/room/${room.id}`)}
              >
                <div className="room-card-header">
                  <h3>{room.title}</h3>
                </div>
                <div className="room-tags">
                  {room.tags?.map((tag: any) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <p>{room.description || '发现值得协作的乐趣'}</p>
                <div className="room-card-footer">
                  <span>🆔 {room.inviteCode}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;
