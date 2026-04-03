import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Avatar, Tooltip, Button, Badge, message } from 'antd';
import { AudioOutlined, AudioMutedOutlined, UserOutlined, CrownOutlined, TeamOutlined, LockOutlined } from '@ant-design/icons';
import * as Y from 'yjs';
import { useVoice } from '../../hooks/useVoice';
import './RoomSidebar.css';

interface UserState {
    id: string;
    clientId: number;
    name: string;
    color: string;
    isMicOn: boolean;
    isAdmin: boolean;
    isBanned?: boolean;
}

interface RoomSidebarProps {
    ydoc: Y.Doc;
    awareness: any;
    currentUser: {
        id: string;
        username: string;
        isAdmin: boolean;
    };
}

const RemoteAudio = ({ stream }: { stream: MediaStream }) => {
    const audioRef = useRef<HTMLAudioElement>(null);
    useEffect(() => {
        if (audioRef.current && stream) {
            audioRef.current.srcObject = stream;
        }
    }, [stream]);
    return <audio ref={audioRef} autoPlay style={{ display: 'none' }} />;
};

export const RoomSidebar: React.FC<RoomSidebarProps> = ({ ydoc, awareness, currentUser }) => {
    const [users, setUsers] = useState<UserState[]>([]);
    const [localMicOn, setLocalMicOn] = useState(false);
    const [isBanned, setIsBanned] = useState(false);

    // 记录已处理过的管理员闭麦指令时间戳
    const processedMuteTs = useRef<number>(0);

    // 持久化的禁言数据集
    const bannedMics = useMemo(() => ydoc.getMap<boolean>('banned-mics'), [ydoc]);

    const { remoteStreams } = useVoice({
        awareness,
        currentUserId: currentUser.id,
        isMicOn: localMicOn,
    });

    useEffect(() => {
        if (!awareness) return;
        const myClientId = awareness.clientID;

        const updateData = () => {
            const states = awareness.getStates();

            // 1. 检查是否有管理员发给我的“闭麦指令”
            states.forEach((state: any) => {
                const cmd = state?.muteCommand;
                if (cmd && cmd.targetClientId === myClientId && cmd.timestamp > processedMuteTs.current) {
                    processedMuteTs.current = cmd.timestamp;
                    handleForceMute();
                }
            });

            // 2. 更新用户列表
            const userList: UserState[] = [];
            states.forEach((state: any, clientId: number) => {
                if (state.user) {
                    userList.push({
                        id: state.user.id || `client-${clientId}`,
                        clientId,
                        name: state.user.name,
                        color: state.user.color,
                        isMicOn: state.user.isMicOn || false,
                        isAdmin: state.user.isAdmin || false,
                        isBanned: !!bannedMics.get(state.user.id),
                    });
                }
            });
            setUsers(userList);

            // 3. 更新自己的本地状态
            const localState = awareness.getLocalState();
            if (localState?.user) {
                setLocalMicOn(localState.user.isMicOn || false);
            }
        };

        const handleForceMute = () => {
            setLocalMicOn(false);
            const localState = awareness.getLocalState();
            if (localState?.user) {
                awareness.setLocalStateField('user', {
                    ...localState.user,
                    isMicOn: false,
                });
            }
            message.warning('管理员已关闭了你的麦克风');
        };

        const handleBannedChange = () => {
            const currentlyBanned = !!bannedMics.get(currentUser.id);
            setIsBanned(currentlyBanned);
            if (currentlyBanned) {
                handleForceMute();
            }
            updateData();
        };

        awareness.on('change', updateData);
        bannedMics.observe(handleBannedChange);

        updateData();
        setIsBanned(!!bannedMics.get(currentUser.id));

        return () => {
            awareness.off('change', updateData);
            bannedMics.unobserve(handleBannedChange);
        };
    }, [awareness, bannedMics, currentUser.id]);

    const toggleMic = () => {
        if (isBanned && !localMicOn) {
            message.warning('无法开启：你已被管理员禁言');
            return;
        }

        const newState = !localMicOn;
        setLocalMicOn(newState);

        const localState = awareness.getLocalState();
        if (localState?.user) {
            awareness.setLocalStateField('user', {
                ...localState.user,
                isMicOn: newState,
            });
        }
    };

    // 管理员：一键闭麦 + 持久禁言切换
    const handleAdminAction = (targetClientId: number, targetUserId: string, targetName: string, isMicOn: boolean) => {
        if (!currentUser.isAdmin) return;

        // 1. 发射即时闭麦指令 (针对该特定标签页)
        awareness.setLocalStateField('muteCommand', {
            targetClientId,
            timestamp: Date.now(),
        });

        // 2. 同时在持久化 Map 中切换该用户的禁言状态 (针对该账号全标签页)
        const currentlyBanned = !!bannedMics.get(targetUserId);
        if (!currentlyBanned) {
            bannedMics.set(targetUserId, true);
            message.success(`已关闭 ${targetName} 的麦克风并禁言`);
        } else {
            bannedMics.delete(targetUserId);
            message.success(`已解除 ${targetName} 的禁言`);
        }
    };

    return (
        <div className="room-sidebar">
            {Array.from(remoteStreams.entries()).map(([clientId, stream]) => (
                <RemoteAudio key={clientId} stream={stream} />
            ))}

            <div className="sidebar-header">
                <div className="header-title">
                    <TeamOutlined />
                    <span>在线通话 ({users.length})</span>
                </div>
                <div className="voice-visualizer">
                    <div className="bar"></div>
                    <div className="bar scale-1"></div>
                    <div className="bar scale-2"></div>
                </div>
            </div>

            <div className="user-list-container">
                {users.map((user) => (
                    <div key={user.clientId} className="user-item">
                        <div className="user-info">
                            <Badge dot status={user.isMicOn ? 'success' : 'default'} offset={[-2, 24]}>
                                <Avatar size={36} style={{ backgroundColor: user.color }} icon={<UserOutlined />}>
                                    {user.name.charAt(0).toUpperCase()}
                                </Avatar>
                            </Badge>
                            <div className="user-detail">
                                <div className="user-name">
                                    {user.name}
                                    {user.isAdmin && (
                                        <Tooltip title="管理员">
                                            <CrownOutlined className="admin-icon" />
                                        </Tooltip>
                                    )}
                                    {user.id === currentUser.id && <span className="self-tag">(你)</span>}
                                    {user.isBanned && <LockOutlined style={{ marginLeft: 4, color: '#ff4d4f' }} />}
                                </div>
                                <div className="user-status">
                                    {user.isBanned ? <span className="banned-status">禁言中</span> : user.isMicOn ? '正在讲话...' : '静音'}
                                </div>
                            </div>
                        </div>

                        <div className="user-actions">
                            {user.id === currentUser.id ? (
                                <Button
                                    type={user.isMicOn ? 'primary' : 'default'}
                                    shape="circle"
                                    disabled={isBanned}
                                    icon={user.isMicOn ? <AudioOutlined /> : <AudioMutedOutlined />}
                                    onClick={toggleMic}
                                    className={user.isMicOn ? 'mic-active-btn' : ''}
                                />
                            ) : (
                                <Tooltip title={user.isBanned ? '点击解禁' : user.isMicOn ? '点击闭麦' : '禁言该用户'}>
                                    <Button
                                        type="text"
                                        shape="circle"
                                        icon={
                                            user.isBanned ? (
                                                <LockOutlined style={{ color: '#ff4d4f' }} />
                                            ) : user.isMicOn ? (
                                                <AudioOutlined />
                                            ) : (
                                                <AudioMutedOutlined />
                                            )
                                        }
                                        disabled={!currentUser.isAdmin}
                                        onClick={() => handleAdminAction(user.clientId, user.id, user.name, user.isMicOn)}
                                        className={user.isMicOn ? 'remote-mic-active' : ''}
                                    />
                                </Tooltip>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="sidebar-footer">
                <div className="local-controls">
                    <Button
                        type="primary"
                        block
                        danger={isBanned}
                        disabled={isBanned}
                        icon={localMicOn ? <AudioMutedOutlined /> : <AudioOutlined />}
                        onClick={toggleMic}
                        className={localMicOn ? 'mute-all-btn danger' : 'join-voice-btn'}
                    >
                        {isBanned ? '禁言中无法发言' : localMicOn ? '退出语音' : '加入语音'}
                    </Button>
                </div>
            </div>
        </div>
    );
};
