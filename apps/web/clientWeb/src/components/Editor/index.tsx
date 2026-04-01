import { useEffect, useState, useMemo } from 'react';
import { Editor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

import './Editor.css'; // 我们将为编辑器加入一些基本样式

interface CollaborativeEditorProps {
  roomId: string;
  currentUser: {
    id: string;
    username: string;
    avatar?: string;
    color: string;
  };
}

export default function CollaborativeEditor({
  roomId,
  currentUser,
}: CollaborativeEditorProps) {
  const [status, setStatus] = useState<string>('connecting');

  // 使用 useMemo 确保全局唯一的 Doc 和 Provider 实例，且随 roomId 变化而重构
  const { ydoc, provider } = useMemo(() => {
    const ydoc = new Y.Doc();
    const token = localStorage.getItem('khaccessToken');
    const provider = new WebsocketProvider(
      `ws://localhost:3002/collaboration?room=${roomId}&token=${token}`,
      '', // 留空 room，防止 y-websocket 自动在路径后追加斜杠
      ydoc,
    );
    return { ydoc, provider };
  }, [roomId]);

  useEffect(() => {
    const onStatus = (event: { status: string }) => {
      setStatus(event.status);
    };

    provider.on('status', onStatus);

    return () => {
      provider.off('status', onStatus);
      provider.destroy();
      ydoc.destroy();
    };
  }, [provider, ydoc]);

  const [editor, setEditor] = useState<any>(null);

  useEffect(() => {
    console.log('currentUser', currentUser, ydoc, provider);
    // 强制等待 ydoc 和 provider 准备完毕后再构建编辑器。虽然 useMemo 已经准备好，但在 strict mode 下 useEffect 更稳健。
    if (!ydoc || !provider) return;

    const editorInstance = new Editor({
      extensions: [
        StarterKit.configure({
          // @ts-ignore
          history: false,
        }),
        Collaboration.configure({
          document: ydoc,
        }),
        CollaborationCursor.configure({
          provider: provider,
          // 额外补充 awareness 映射，防止某些版本的 tiptap extension 读取不到
          // @ts-ignore
          awareness: provider.awareness,
          user: {
            name: currentUser.username,
            color: currentUser.color,
          },
        }),
      ],
      content: '', // 初始内容置空，因为协同会从 provider 同步
    });

    setEditor(editorInstance);

    return () => {
      editorInstance.destroy();
    };
  }, [ydoc, provider, currentUser.username, currentUser.color]);

  return (
    <div className="editor-container">
      <div className="editor-header">
        <div className="status-indicator">
          状态: {status}
          <span className={`status-${status}`}>
            {status === 'connected' ? '🟢 在线' : '🔴 离线'}
          </span>
        </div>
        <div className="current-user">
          当前身份:{' '}
          <span style={{ color: currentUser.color, fontWeight: 'bold' }}>
            {currentUser.username}
          </span>
        </div>
      </div>

      <div className="editor-content-wrapper">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
