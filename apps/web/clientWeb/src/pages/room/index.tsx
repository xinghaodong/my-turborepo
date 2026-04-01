import { useParams, useSearchParams } from 'react-router-dom';
import CollaborativeEditor from '@/components/Editor';

// 获取一个随机颜色用于光标显示
const getRandomColor = () => {
  const colors = [
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#eb2f96',
    '#52c41a',
    '#1890ff',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export default function RoomPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const title = searchParams.get('title') || '未命名房间';
  console.log(title, 'title')
  // 从 localStorage 获取真实登录用户的信息
  const userInfoStr = localStorage.getItem('khuserInfo');
  const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

  const currentUser = {
    id: userInfo?.id || `guest-${Math.floor(Math.random() * 1000)}`,
    username: userInfo?.username || `游客 ${Math.floor(Math.random() * 1000)}`,
    color: getRandomColor(),
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>{title}</h1>
      <p style={{ color: '#888' }}>
        提示: {currentUser.username}。你正在编辑房间: <strong>{title}</strong>
        。可开启多个浏览器窗口测试。
      </p>

      {id ? (
        <CollaborativeEditor key={id} roomId={id} currentUser={currentUser} />
      ) : (
        <div>缺少房间ID参数</div>
      )}
    </div>
  );
}
