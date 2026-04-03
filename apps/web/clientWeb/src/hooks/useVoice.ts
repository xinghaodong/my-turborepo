import { useEffect, useRef, useState, useCallback } from 'react';
import Peer from 'simple-peer';

/**
 * 语音通话 Hook — 基于 WebRTC + Yjs Awareness 信令
 *
 * 关键设计：
 * - 用 awareness.clientID（每个浏览器标签页唯一）做对等标识
 *   而不是 user.id（同一账号多标签页会重复）
 * - 信令通过 awareness state 广播，y-websocket 天然同步
 * - trickle: false → 一次性交换完整 SDP，简化信令流程
 */

interface UseVoiceProps {
    awareness: any;
    currentUserId: string; // 仅用于日志，不用于匹配
    isMicOn: boolean;
}

// Google 免费 STUN 服务器，帮助 NAT 穿透（本地测试可不需要）
const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];

export const useVoice = ({ awareness, currentUserId, isMicOn }: UseVoiceProps) => {
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());
    const localStreamRef = useRef<MediaStream | null>(null);
    const peersRef = useRef<Map<string, Peer.Instance>>(new Map());
    // 记录已处理过的信号时间戳，避免重复处理
    const processedSignalsRef = useRef<Map<string, number>>(new Map());

    const stopLocalStream = useCallback(() => {
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach((t) => t.stop());
            localStreamRef.current = null;
        }
    }, []);

    const destroyAllPeers = useCallback(() => {
        peersRef.current.forEach((p) => {
            try {
                p.destroy();
            } catch (_) {}
        });
        peersRef.current.clear();
        setRemoteStreams(new Map());
        processedSignalsRef.current.clear();
    }, []);

    const createPeer = useCallback(
        (targetClientId: string, initiator: boolean, stream: MediaStream): Peer.Instance => {
            console.log(`[Voice] Creating peer → clientId=${targetClientId} (initiator=${initiator})`);

            if (peersRef.current.has(targetClientId)) {
                try {
                    peersRef.current.get(targetClientId)!.destroy();
                } catch (_) {}
                peersRef.current.delete(targetClientId);
            }

            const peer = new Peer({
                initiator,
                trickle: false,
                stream,
                config: { iceServers: ICE_SERVERS },
            });

            peer.on('signal', (signalData: any) => {
                const type = initiator ? 'offer' : 'answer';
                console.log(`[Voice] 📡 Signal generated (${type}) → clientId=${targetClientId}`);

                // 写入自己的 awareness voiceSignals 字段
                const localState = awareness.getLocalState();
                awareness.setLocalStateField('voiceSignals', {
                    ...(localState?.voiceSignals || {}),
                    [targetClientId]: {
                        type,
                        data: JSON.stringify(signalData),
                        timestamp: Date.now(),
                    },
                });
            });

            peer.on('stream', (remoteStream: MediaStream) => {
                console.log(`[Voice] ✅ 收到远端音频流 clientId=${targetClientId}`);
                setRemoteStreams((prev) => {
                    const next = new Map(prev);
                    next.set(targetClientId, remoteStream);
                    return next;
                });
            });

            peer.on('connect', () => {
                console.log(`[Voice] ✅ Peer 已连通 clientId=${targetClientId}`);
            });

            peer.on('error', (err: Error) => {
                console.error(`[Voice] ❌ Peer error (${targetClientId}):`, err.message);
            });

            peer.on('close', () => {
                console.log(`[Voice] Peer closed (${targetClientId})`);
                peersRef.current.delete(targetClientId);
                setRemoteStreams((prev) => {
                    const next = new Map(prev);
                    next.delete(targetClientId);
                    return next;
                });
            });

            peersRef.current.set(targetClientId, peer);
            return peer;
        },
        [awareness],
    );

    useEffect(() => {
        if (!isMicOn) {
            stopLocalStream();
            destroyAllPeers();
            awareness.setLocalStateField('voiceSignals', null);
            return;
        }

        let cancelled = false;
        // ★ 关键：myClientId 是当前标签页在 awareness 中的唯一标识
        const myClientId: number = awareness.clientID;
        console.log(`[Voice] 🎙️ 初始化语音, 我的 clientId=${myClientId}, userId=${currentUserId}`);

        const init = async () => {
            let stream: MediaStream;
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                    },
                    video: false,
                });
            } catch (err) {
                console.error('[Voice] 无法获取麦克风权限:', err);
                return;
            }

            if (cancelled) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            localStreamRef.current = stream;
            console.log('[Voice] 🎙️ 麦克风已就绪');

            const handleAwarenessChange = () => {
                if (cancelled) return;

                const states = awareness.getStates() as Map<number, any>;
                // 收集当前所有开着麦的远端 clientId
                const activePeerIds = new Set<string>();

                states.forEach((state: any, remoteClientId: number) => {
                    if (remoteClientId === myClientId) return;

                    const remoteUser = state?.user;
                    const peerId = String(remoteClientId);

                    // ★ 对方没开麦或离线 → 清理该 peer
                    if (!remoteUser?.isMicOn) {
                        if (peersRef.current.has(peerId)) {
                            console.log(`[Voice] 🔌 ${remoteUser?.name || peerId} 关闭了麦克风，断开连接`);
                            try {
                                peersRef.current.get(peerId)!.destroy();
                            } catch (_) {}
                            peersRef.current.delete(peerId);
                            setRemoteStreams((prev) => {
                                const next = new Map(prev);
                                next.delete(peerId);
                                return next;
                            });
                            // 清除该peer的已处理信号记录，以便对方重新加入时能重新连接
                            processedSignalsRef.current.delete(`${remoteClientId}_offer`);
                            processedSignalsRef.current.delete(`${remoteClientId}_answer`);
                        }
                        return;
                    }

                    activePeerIds.add(peerId);

                    // === 主动发起连接：clientId 较大的一方作为 initiator ===
                    if (!peersRef.current.has(peerId) && myClientId > remoteClientId) {
                        console.log(`[Voice] 🔗 我(${myClientId})主动向 ${remoteUser.name}(${remoteClientId}) 发起连接`);
                        createPeer(peerId, true, stream);
                    }

                    // === 处理对方发来的信令 ===
                    const remoteSignals = state?.voiceSignals;
                    if (!remoteSignals) return;

                    const signalForMe = remoteSignals[String(myClientId)];
                    if (!signalForMe) return;

                    const { type, data, timestamp } = signalForMe;

                    const signalKey = `${remoteClientId}_${type}`;
                    const prevTs = processedSignalsRef.current.get(signalKey);
                    if (prevTs && prevTs >= timestamp) return;
                    processedSignalsRef.current.set(signalKey, timestamp);

                    console.log(`[Voice] 📨 收到信令: ${type} from ${remoteUser.name}(${remoteClientId})`);
                    const signalData = JSON.parse(data);

                    if (type === 'offer') {
                        const peer = peersRef.current.get(peerId) || createPeer(peerId, false, stream);
                        try {
                            peer.signal(signalData);
                        } catch (e) {
                            console.error('[Voice] signal offer error:', e);
                        }
                    } else if (type === 'answer') {
                        const peer = peersRef.current.get(peerId);
                        if (peer) {
                            try {
                                peer.signal(signalData);
                            } catch (e) {
                                console.error('[Voice] signal answer error:', e);
                            }
                        }
                    }
                });

                // 清理已经离开房间（不在 awareness 中）的 peer
                peersRef.current.forEach((peer, peerId) => {
                    if (!activePeerIds.has(peerId)) {
                        console.log(`[Voice] 🔌 ${peerId} 已离开房间，断开连接`);
                        try {
                            peer.destroy();
                        } catch (_) {}
                        peersRef.current.delete(peerId);
                        setRemoteStreams((prev) => {
                            const next = new Map(prev);
                            next.delete(peerId);
                            return next;
                        });
                    }
                });
            };

            awareness.on('change', handleAwarenessChange);
            // 初始扫描
            handleAwarenessChange();

            return () => {
                awareness.off('change', handleAwarenessChange);
            };
        };

        let cleanupAwareness: (() => void) | undefined;
        init().then((fn) => {
            cleanupAwareness = fn;
        });

        return () => {
            cancelled = true;
            cleanupAwareness?.();
            stopLocalStream();
            destroyAllPeers();
            awareness.setLocalStateField('voiceSignals', null);
        };
    }, [isMicOn, awareness, currentUserId, createPeer, stopLocalStream, destroyAllPeers]);

    return { remoteStreams };
};
