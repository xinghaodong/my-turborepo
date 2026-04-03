import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import CollaborativeEditor from '@/components/Editor';
import { useEffect } from 'react';
import { getRoomDetail } from '@/api/room';
import { message } from 'antd';
import Header from '@/components/header';

// 获取一个随机颜色用于光标显示
const getRandomColor = () => {
    const colors = ['#f56a00', '#7265e6', '#ffbf00', '#00a2ae', '#eb2f96', '#52c41a', '#1890ff'];
    return colors[Math.floor(Math.random() * colors.length)];
};

export default function RoomPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const title = searchParams.get('title') || '未命名房间';
    
    // 从 localStorage 获取真实登录用户的信息
    const userInfoStr = localStorage.getItem('khuserInfo');
    const userInfo = userInfoStr ? JSON.parse(userInfoStr) : null;

    const currentUser = {
        id: userInfo?.id || `guest-${Math.floor(Math.random() * 1000)}`,
        username: userInfo?.username || `游客 ${Math.floor(Math.random() * 1000)}`,
        color: getRandomColor(),
        avatar: userInfo?.avatar || '',
        isAdmin: userInfo?.role === 'ADMIN' || true, // 临时默认 admin 以便测试功能
    };

    const goToRoom = async (roomId: string) => {
        try {
            const res: any = await getRoomDetail(roomId);
            if (res.status != 'ACTIVE') {
                message.error('房间已关闭');
                navigate('/', { replace: true });
                return;
            }
        } catch (error: any) {
            message.error(error.message);
            navigate('/', { replace: true });
        }
    };
    
    useEffect(() => {
        if (id) {
            goToRoom(id);
        }
    }, [id]);

    return (
        <div className="room-page-wrapper" style={{ height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
            <Header title={title} />
            
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* 左侧编辑器区域 */}
                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '16px 24px 0 24px' }}>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{title}</h1>
                        <p style={{ color: '#64748b', fontSize: '14px', margin: '4px 0 16px 0' }}>
                            编辑者: {currentUser.username} • 正在进行实时协作
                        </p>
                    </div>
                    
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        {id ? (
                            <CollaborativeEditor key={id} roomId={id} currentUser={currentUser} />
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center' }}>缺少房间ID参数</div>
                        )}
                    </div>
                </div>

                {/* 右侧语音/人员面板将由 CollaborativeEditor 内部逻辑挂载或在这里独立显示 */}
                {/* 为了方便获取 Yjs provider 状态，我建议将其放在 CollaborativeEditor 内部，或者通过 context/provider 共享 */}
            </div>
        </div>
    );
}
