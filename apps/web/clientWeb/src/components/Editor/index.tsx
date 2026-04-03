import { useEffect, useState, useMemo } from 'react';
import { Editor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { useNavigate } from 'react-router-dom';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import { message } from 'antd';
import { RoomSidebar } from '../RoomSidebar';

import './Editor.css';

interface CollaborativeEditorProps {
    roomId: string;
    currentUser: {
        id: string;
        username: string;
        avatar?: string;
        color: string;
        isAdmin: boolean;
    };
}

// 精选常用的 SVG 图标组件
const Icons = {
    Bold: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
        </svg>
    ),
    Italic: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="19" y1="4" x2="10" y2="4" />
            <line x1="14" y1="20" x2="5" y2="20" />
            <line x1="15" y1="4" x2="9" y2="20" />
        </svg>
    ),
    Strike: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M16 4h-7a4 4 0 0 0-4 4v2a4 4 0 0 0 4 4h7a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-7" />
            <line x1="4" y1="12" x2="20" y2="12" />
        </svg>
    ),
    List: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
        </svg>
    ),
    OrderedList: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <line x1="10" y1="6" x2="21" y2="6" />
            <line x1="10" y1="12" x2="21" y2="12" />
            <line x1="10" y1="18" x2="21" y2="18" />
            <path d="M4 6h1v4" />
            <path d="M4 10h2" />
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
        </svg>
    ),
    Quote: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M3 21c3 0 7-1 7-8V5H3v8h4c0 2-2 4-4 4zM14 21c3 0 7-1 7-8V5h-7v8h4c0 2-2 4-4 4z" />
        </svg>
    ),
    Code: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <polyline points="16 18 22 12 16 6" />
            <polyline points="8 6 2 12 8 18" />
        </svg>
    ),
    CodeBlock: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" />
            <path d="m10 10-2 2 2 2" />
            <path d="m14 14 2-2-2-2" />
        </svg>
    ),
    Undo: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M9 14 4 9l5-5" />
            <path d="M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5v0a5.5 5.5 0 0 1-5.5 5.5H11" />
        </svg>
    ),
    Redo: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="m15 14 5-5-5-5" />
            <path d="M20 9H9.5A5.5 5.5 0 0 0 4 14.5v0A5.5 5.5 0 0 0 9.5 20H13" />
        </svg>
    ),
    H1: () => <span style={{ fontSize: '14px' }}>H1</span>,
    H2: () => <span style={{ fontSize: '14px' }}>H2</span>,
    H3: () => <span style={{ fontSize: '14px' }}>H3</span>,
    Image: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Table: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
        </svg>
    ),
    Delete: () => (
        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    ),
};

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;

    const buttons = [
        {
            icon: <Icons.Bold />,
            action: () => editor.chain().focus().toggleBold().run(),
            active: 'bold',
            title: '加粗',
        },
        {
            icon: <Icons.Italic />,
            action: () => editor.chain().focus().toggleItalic().run(),
            active: 'italic',
            title: '斜体',
        },
        {
            icon: <Icons.Strike />,
            action: () => editor.chain().focus().toggleStrike().run(),
            active: 'strike',
            title: '删除线',
        },
        { type: 'divider' },
        {
            icon: <Icons.H1 />,
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
            active: { heading: { level: 1 } },
            title: '一级标题',
        },
        {
            icon: <Icons.H2 />,
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
            active: { heading: { level: 2 } },
            title: '二级标题',
        },
        {
            icon: <Icons.H3 />,
            action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
            active: { heading: { level: 3 } },
            title: '三级标题',
        },
        { type: 'divider' },
        {
            icon: <Icons.List />,
            action: () => editor.chain().focus().toggleBulletList().run(),
            active: 'bulletList',
            title: '无序列表',
        },
        {
            icon: <Icons.OrderedList />,
            action: () => editor.chain().focus().toggleOrderedList().run(),
            active: 'orderedList',
            title: '有序列表',
        },
        {
            icon: <Icons.Quote />,
            action: () => editor.chain().focus().toggleBlockquote().run(),
            active: 'blockquote',
            title: '引用',
        },
        { type: 'divider' },
        {
            icon: <Icons.Code />,
            action: () => editor.chain().focus().toggleCode().run(),
            active: 'code',
            title: '行内代码',
        },
        {
            icon: <Icons.CodeBlock />,
            action: () => editor.chain().focus().toggleCodeBlock().run(),
            active: 'codeBlock',
            title: '代码块',
        },
        { type: 'divider' },
        {
            icon: <Icons.Undo />,
            action: () => editor.chain().focus().undo().run(),
            title: '撤销',
        },
        {
            icon: <Icons.Redo />,
            action: () => editor.chain().focus().redo().run(),
            title: '重做',
        },
        { type: 'divider' },
        {
            icon: <Icons.Image />,
            action: () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/jpeg,image/png,image/gif,image/webp';
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                            const src = re.target?.result as string;
                            if (src) {
                                editor.chain().focus().setImage({ src }).run();
                            }
                        };
                        reader.readAsDataURL(file);
                    }
                };
                input.click();
            },
            title: '插入图片',
        },
        { type: 'divider' },
        {
            icon: <Icons.Table />,
            action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
            title: '插入 3x3 表格',
        },
    ];

    return (
        <div className="menu-bar">
            {buttons.map((btn, index) => {
                if (btn.type === 'divider') return <div key={index} className="menu-divider" />;
                return (
                    <button
                        key={index}
                        onClick={btn.action}
                        title={btn.title}
                        className={`menu-button ${btn.active && editor.isActive(btn.active as any) ? 'is-active' : ''}`}
                    >
                        {btn.icon}
                    </button>
                );
            })}
        </div>
    );
};

export default function CollaborativeEditor({ roomId, currentUser }: CollaborativeEditorProps) {
    const navigate = useNavigate();
    const [status, setStatus] = useState<string>('connecting');
    const [editor, setEditor] = useState<Editor | null>(null);
    const [menu, setMenu] = useState<{ show: boolean; x: number; y: number }>({ show: false, x: 0, y: 0 });

    const { ydoc, provider } = useMemo(() => {
        const ydoc = new Y.Doc();
        const token = localStorage.getItem('khaccessToken');
        const API_PORT = 3002;
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const provider = new WebsocketProvider(
            `${protocol}//${window.location.hostname}:${API_PORT}/collaboration?room=${roomId}&token=${token}`,
            '',
            ydoc,
        );
        return { ydoc, provider };
    }, [roomId]);

    useEffect(() => {
        const onStatus = ({ status }: { status: string }) => {
            setStatus(status);
            if (status === 'connected' && provider.ws) {
                const handleWSMessage = (event: MessageEvent) => {
                    if (typeof event.data === 'string') {
                        try {
                            const data = JSON.parse(event.data);
                            if (data.event === 'room_disabled') {
                                const { message: msg, duration } = data.data as { message: string; duration: number };
                                message.error(msg, duration / 1000);
                                setTimeout(() => navigate('/', { replace: true }), duration || 5000);
                            }
                        } catch (e) {}
                    }
                };
                provider.ws.addEventListener('message', handleWSMessage);
            }
        };
        provider.on('status', onStatus);
        provider.awareness.setLocalStateField('user', {
            id: currentUser.id,
            name: currentUser.username,
            color: currentUser.color,
            isAdmin: currentUser.isAdmin,
            isMicOn: false,
        });
        return () => {
            provider.off('status', onStatus);
            provider.destroy();
            ydoc.destroy();
        };
    }, [provider, ydoc, currentUser, navigate]);

    useEffect(() => {
        if (!ydoc || !provider) return;

        const editorInstance = new Editor({
            extensions: [
                StarterKit.configure({ history: false }),
                Collaboration.configure({ document: ydoc }),
                CollaborationCursor.configure({
                    provider: provider,
                    // @ts-ignore
                    awareness: provider.awareness,
                    user: { name: currentUser.username, color: currentUser.color, isAdmin: currentUser.isAdmin },
                }),
                Image.configure({ HTMLAttributes: { class: 'editor-image' } }),
                Table.configure({ resizable: true }),
                TableRow,
                TableHeader,
                TableCell,
            ],
            content: '',
            editorProps: {
                attributes: { class: 'prose-container focus:outline-none' },
                handlePaste: (view, event) => {
                    const items = Array.from(event.clipboardData?.items || []);
                    const imageItems = items.filter((item: any) => /image\/(jpeg|png|gif|webp)/.test(item.type));
                    if (imageItems.length === 0) return false;
                    event.preventDefault();
                    imageItems.forEach((item: any) => {
                        const blob = item.getAsFile();
                        if (!blob) return;
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            const src = e.target?.result as string;
                            if (src) {
                                const node = view.state.schema.nodes.image.create({ src });
                                view.dispatch(view.state.tr.replaceSelectionWith(node));
                            }
                        };
                        reader.readAsDataURL(blob);
                    });
                    return true;
                },
                handleDrop: (view, event: any, _slice, moved) => {
                    if (!moved && event.dataTransfer?.files?.[0]) {
                        const files = Array.from(event.dataTransfer.files);
                        const imageFiles = files.filter((file: any) => /image\/(jpeg|png|gif|webp)/.test(file.type));
                        if (imageFiles.length > 0) {
                            event.preventDefault();
                            imageFiles.forEach((file: any) => {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                    const src = e.target?.result as string;
                                    if (src) {
                                        const node = view.state.schema.nodes.image.create({ src });
                                        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
                                        if (coords) view.dispatch(view.state.tr.insert(coords.pos, node));
                                    }
                                };
                                reader.readAsDataURL(file);
                            });
                            return true;
                        }
                    }
                    return false;
                },
            },
        });
        setEditor(editorInstance);
        return () => editorInstance.destroy();
    }, [ydoc, provider, currentUser]);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!editor) return;
        const isInTable = editor.isActive('table') || editor.isActive('tableCell') || editor.isActive('tableHeader');
        if (isInTable) setMenu({ show: true, x: e.clientX, y: e.clientY });
        else setMenu({ show: false, x: 0, y: 0 });
    };

    useEffect(() => {
        const handleClick = () => setMenu({ show: false, x: 0, y: 0 });
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    return (
        <div className="editor-layout-container" style={{ display: 'flex', height: '100%', width: '100%' }}>
            <div className="editor-outer-wrapper" onContextMenu={handleContextMenu} style={{ flex: 1, padding: '20px' }}>
                <div className="editor-container" style={{ height: '100%', maxWidth: '900px' }}>
                    <div className="editor-header">
                        <div className={`status-indicator status-${status}`}>
                            <div className="status-dot" />
                            <span>{status === 'connected' ? '协同在线' : '连接服务器中...'}</span>
                        </div>
                        <div className="collaborators-list">
                            <div className="user-avatar-small" style={{ backgroundColor: currentUser.color }}>
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="current-user-name">{currentUser.username}</span>
                        </div>
                    </div>

                    <MenuBar editor={editor} />

                    <div className="editor-content-scrollable">
                        <div className="editor-document-page">
                            {editor && (
                                <BubbleMenu
                                    editor={editor}
                                    tippyOptions={{ duration: 100 }}
                                    shouldShow={({ state }) => {
                                        return editor.isActive('table') || !state.selection.empty;
                                    }}
                                >
                                    <div className="bubble-menu-content">
                                        <button
                                            onClick={() => editor.chain().focus().toggleBold().run()}
                                            className={`menu-button ${editor.isActive('bold') ? 'is-active' : ''}`}
                                        >
                                            <Icons.Bold />
                                        </button>
                                        <button
                                            onClick={() => editor.chain().focus().toggleItalic().run()}
                                            className={`menu-button ${editor.isActive('italic') ? 'is-active' : ''}`}
                                        >
                                            <Icons.Italic />
                                        </button>
                                        <button
                                            onClick={() => editor.chain().focus().toggleCode().run()}
                                            className={`menu-button ${editor.isActive('code') ? 'is-active' : ''}`}
                                        >
                                            <Icons.Code />
                                        </button>
                                        {(editor.isActive('table') || editor.isActive('tableCell') || editor.isActive('tableHeader')) && (
                                            <>
                                                <div className="menu-divider" />
                                                <button
                                                    onClick={() => editor.chain().focus().addColumnAfter().run()}
                                                    title="在右侧添加列"
                                                    className="menu-button"
                                                >
                                                    <Icons.Table />
                                                </button>
                                                <button
                                                    onClick={() => editor.chain().focus().addRowAfter().run()}
                                                    title="在下方添加行"
                                                    className="menu-button"
                                                >
                                                    <Icons.Table />
                                                </button>
                                                <button
                                                    onClick={() => editor.chain().focus().deleteTable().run()}
                                                    title="删除表格"
                                                    className="menu-button"
                                                    style={{ color: '#ef4444' }}
                                                >
                                                    <Icons.Delete />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </BubbleMenu>
                            )}
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
            </div>

            <RoomSidebar ydoc={ydoc} awareness={provider.awareness} currentUser={currentUser} />

            {menu.show && editor && (
                <div className="context-menu" style={{ top: menu.y, left: menu.x, position: 'fixed', zIndex: 9999 }}>
                    <div className="context-menu-group">
                        <button onClick={() => editor.chain().focus().addRowBefore().run()}>在上方插入行</button>
                        <button onClick={() => editor.chain().focus().addRowAfter().run()}>在下方插入行</button>
                    </div>
                    <div className="context-menu-divider" />
                    <div className="context-menu-group">
                        <button onClick={() => editor.chain().focus().addColumnBefore().run()}>在左侧插入列</button>
                        <button onClick={() => editor.chain().focus().addColumnAfter().run()}>在右侧插入列</button>
                    </div>
                    <div className="context-menu-divider" />
                    <div className="context-menu-group">
                        <button onClick={() => editor.chain().focus().deleteTable().run()} className="delete">
                            删除整个表格
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
