import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Code, File, Folder, Search, Save, Eye } from 'lucide-react';
import AICodeAnalyzer from '@/components/code/AICodeAnalyzer';

const FILES = [
  'src/pages/Home.jsx',
  'src/pages/AdminPanel.jsx',
  'src/pages/CallRoom.jsx',
  'src/pages/Welcome.jsx',
  'src/components/chat/ChatWindow.jsx',
  'src/components/chat/AIBotChat.jsx',
  'src/components/chat/ConversationList.jsx',
  'src/components/chat/MessageBubble.jsx',
  'src/components/chat/Avatar.jsx',
  'src/components/chat/ProfilePanel.jsx',
  'src/components/chat/FriendsPanel.jsx',
  'src/components/chat/NotificationsPanel.jsx',
  'src/components/chat/ConversationInfo.jsx',
  'src/components/chat/NewChatModal.jsx',
  'src/components/chat/NewGroupModal.jsx',
  'src/components/chat/ConversationSettingsMenu.jsx',
  'src/components/admin/AISettingsTab.jsx',
  'src/App.jsx',
  'src/index.css',
  'src/tailwind.config.js',
];

export default function CodeExplorer() {
  const [selected, setSelected] = useState(FILES[0]);
  const [content, setContent] = useState('');
  const [edited, setEdited] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState('');
  const [readOnly, setReadOnly] = useState(true);
  const [editedFiles, setEditedFiles] = useState({});

  const loadFile = async (path) => {
    setLoading(true);
    setSaved(false);
    try {
      const res = await fetch(`/${path.replace('src/', 'src/')}`);
      if (!res.ok) throw new Error('fetch failed');
      const text = await res.text();
      setContent(text);
      setEdited(text);
    } catch {
      // Fallback: try loading from Vite dev server
      try {
        const res2 = await fetch(`/@fs/${path}`);
        if (!res2.ok) throw new Error('fetch failed');
        const text = await res2.text();
        setContent(text);
        setEdited(text);
      } catch {
        setContent('// Không thể đọc file trong môi trường này.\n// Tính năng này chỉ hoạt động trên dev server.');
        setEdited('');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFile(selected);
    // Load edited state
    try {
      const saved = localStorage.getItem(`code_edit_${selected}`);
      setEditedFiles(prev => ({ ...prev, [selected]: !!saved }));
    } catch (e) {}
  }, [selected]);

  const handleSave = () => {
    setSaving(true);
    try {
      localStorage.setItem(`code_edit_${selected}`, edited);
      setEditedFiles(prev => ({ ...prev, [selected]: true }));
    } catch (e) {}
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 500);
  };

  const filtered = FILES.filter(f => f.toLowerCase().includes(search.toLowerCase()));

  const formatLang = (f) => f.endsWith('.jsx') ? 'javascript' : f.endsWith('.css') ? 'css' : 'javascript';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
          <Link to="/" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft size={20} className="dark:text-gray-300" />
          </Link>
          <Code size={22} className="text-blue-500" />
          <h1 className="font-bold text-lg dark:text-white">Code Explorer</h1>
          <span className="text-xs text-gray-400 ml-2">Xem & sửa code</span>
        </div>

        <div className="flex flex-col md:flex-row h-[calc(100vh-60px)]">
          {/* File list */}
          <div className="w-full md:w-64 border-r dark:border-gray-700 bg-white dark:bg-gray-900 flex flex-col">
            <div className="p-3 border-b dark:border-gray-700">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Tìm file..."
                  className="w-full pl-8 pr-2 py-1.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded text-xs outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(path => {
                const name = path.split('/').pop();
                const isDir = false;
                return (
                  <button
                    key={path}
                    onClick={() => setSelected(path)}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-gray-100 dark:hover:bg-gray-800 text-left ${
                      selected === path ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' : 'dark:text-gray-300'
                    }`}
                  >
                    <File size={12} className="shrink-0" />
                    <span className="truncate">{name}</span>
                    {editedFiles[path] && (
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full ml-auto" title="Có bản chỉnh sửa đã lưu" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
              <span className="text-xs font-mono dark:text-gray-400">{selected}</span>
              <div className="flex items-center gap-2">
                <AICodeAnalyzer filePath={selected} code={edited} />
                <button
                  onClick={() => setReadOnly(!readOnly)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs ${readOnly ? 'bg-gray-100 dark:bg-gray-800 text-gray-500' : 'bg-blue-500 text-white'}`}
                >
                  <Eye size={12} /> {readOnly ? 'Chỉ xem' : 'Đang sửa'}
                </button>
                <button
                  onClick={handleSave}
                  disabled={readOnly || saving || edited === content}
                  className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-green-500 text-white disabled:opacity-40"
                >
                  <Save size={12} /> {saved ? 'Đã lưu!' : saving ? 'Đang lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
            {loading ? (
              <div className="flex-1 flex justify-center items-center">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <div className="flex-1 overflow-auto bg-[#1e1e2e]">
                <textarea
                  value={edited}
                  onChange={e => setEdited(e.target.value)}
                  readOnly={readOnly}
                  spellCheck={false}
                  className="w-full h-full min-h-[calc(100vh-120px)] p-4 bg-transparent text-green-300 font-mono text-xs leading-relaxed outline-none resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
