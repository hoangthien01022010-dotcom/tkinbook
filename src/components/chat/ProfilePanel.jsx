import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { ArrowLeft, Camera, Sun, Moon, LogOut, Shield, Code, Bot, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/lib/ThemeContext';

export default function ProfilePanel({ user, profile, setProfile, onClose, onAdmin }) {
  const { theme, toggleTheme } = useTheme();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState(profile?.display_name || '');
  const [editingBio, setEditingBio] = useState(false);
  const [newBio, setNewBio] = useState(profile?.bio || '');
  const [saving, setSaving] = useState(false);

  const updateAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      await base44.entities.UserProfile.update(profile.id, { avatar_url: file_url });
      setProfile({ ...profile, avatar_url: file_url });
    } catch (err) { console.error(err); }
    finally { setSaving(false); }
  };

  const saveName = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    await base44.entities.UserProfile.update(profile.id, { display_name: newName.trim() });
    setProfile({ ...profile, display_name: newName.trim() });
    setEditingName(false);
    setSaving(false);
  };

  const saveBio = async () => {
    setSaving(true);
    await base44.entities.UserProfile.update(profile.id, { bio: newBio.trim() });
    setProfile({ ...profile, bio: newBio.trim() });
    setEditingBio(false);
    setSaving(false);
  };

  const handleLogout = () => {
    if (profile?.id) {
      base44.entities.UserProfile.update(profile.id, { is_online: false, last_active: new Date().toISOString() }).catch(() => {});
    }
    base44.auth.logout('/login');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2 p-4 border-b dark:border-gray-700">
        <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft size={20} className="dark:text-gray-300" />
        </button>
        <h2 className="font-bold text-lg dark:text-white">Cài đặt</h2>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar */}
        <div className="flex flex-col items-center py-8">
          <div className="relative">
            <Avatar src={profile?.avatar_url} name={profile?.display_name} size={96} />
            <label className="absolute bottom-0 right-0 p-2 bg-blue-500 rounded-full cursor-pointer hover:bg-blue-600 transition-colors">
              <Camera size={16} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={updateAvatar} />
            </label>
          </div>
        </div>

        <div className="px-4 space-y-4">
          {/* Display Name */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Tên hiển thị</label>
            {editingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input value={newName} onChange={e => setNewName(e.target.value)} className="flex-1 px-3 py-1.5 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm outline-none" />
                <button onClick={saveName} disabled={saving} className="text-blue-500 text-sm font-medium">Lưu</button>
                <button onClick={() => setEditingName(false)} className="text-gray-500 text-sm">Hủy</button>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="font-medium dark:text-white">{profile?.display_name}</p>
                <button onClick={() => setEditingName(true)} className="text-blue-500 text-sm">Sửa</button>
              </div>
            )}
          </div>

          {/* Bio */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Giới thiệu</label>
            {editingBio ? (
              <div className="mt-1">
                <textarea value={newBio} onChange={e => setNewBio(e.target.value)} className="w-full px-3 py-1.5 border dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-sm outline-none resize-none" rows={3} />
                <div className="flex gap-2 mt-1">
                  <button onClick={saveBio} disabled={saving} className="text-blue-500 text-sm font-medium">Lưu</button>
                  <button onClick={() => setEditingBio(false)} className="text-gray-500 text-sm">Hủy</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm dark:text-gray-300">{profile?.bio || 'Chưa có giới thiệu'}</p>
                <button onClick={() => setEditingBio(true)} className="text-blue-500 text-sm">Sửa</button>
              </div>
            )}
          </div>

          {/* Email */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <label className="text-xs text-gray-500 dark:text-gray-400 font-medium">Email</label>
            <p className="mt-1 text-sm dark:text-gray-300">{user?.email}</p>
          </div>

          {/* Theme toggle */}
          <button onClick={toggleTheme} className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-3">
              {theme === 'dark' ? <Moon size={20} className="text-blue-500" /> : <Sun size={20} className="text-yellow-500" />}
              <span className="font-medium dark:text-white">{theme === 'dark' ? 'Chế độ tối' : 'Chế độ sáng'}</span>
            </div>
            <div className={`w-11 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </div>
          </button>

          {/* Admin */}
          {isAdmin && (
            <button onClick={onAdmin} className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <Shield size={20} className="text-red-500" />
              <span className="font-medium dark:text-white">Trang quản trị</span>
            </button>
          )}

          {/* AI Agent (admin only) */}
          {isAdmin && (
            <Link to="/ai-agent" className="w-full flex items-center gap-3 bg-gradient-to-r from-gray-800 to-gray-600 rounded-xl p-4 text-white">
              <Bot size={20} />
              <span className="font-medium">AI Agent</span>
            </Link>
          )}

          {/* Code Explorer (admin only) */}
          {isAdmin && (
            <Link to="/code" className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <Code size={20} className="text-blue-500" />
              <span className="font-medium dark:text-white">Code Explorer</span>
            </Link>
          )}

          {/* Backup (admin only) */}
          {isAdmin && (
            <Link to="/backup" className="w-full flex items-center gap-3 bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
              <Download size={20} className="text-green-500" />
              <span className="font-medium dark:text-white">Tải dữ liệu backup</span>
            </Link>
          )}

          {/* Logout */}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-red-600">
            <LogOut size={20} />
            <span className="font-medium">Đăng xuất</span>
          </button>
        </div>
        <div className="h-8" />
      </div>
    </div>
  );
}
