import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { X, Search, Check } from 'lucide-react';

export default function NewGroupModal({ currentUserId, profile, onClose, onCreated }) {
  const [friends, setFriends] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const allFriends = await base44.entities.Friendship.filter({ status: 'accepted' });
        const myFriends = allFriends.filter(f => f.requester_id === currentUserId || f.receiver_id === currentUserId);
        setFriends(myFriends);
        const allProfiles = await base44.entities.UserProfile.list('-created_date', 500);
        const map = {};
        allProfiles.forEach(p => { map[p.user_id] = p; });
        setProfiles(map);
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  const getFriendId = (f) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id;

  const toggle = (id) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const createGroup = async () => {
    if (selected.length < 1) return;
    setCreating(true);
    try {
      const participantIds = [currentUserId, ...selected];
      const participantNames = participantIds.map(id => profiles[id]?.display_name || 'Người dùng');
      const conv = await base44.entities.Conversation.create({
        type: 'group',
        name: groupName || `Nhóm (${participantIds.length} thành viên)`,
        participant_ids: participantIds,
        participant_names: participantNames,
        admin_id: currentUserId
      });
      // System message
      await base44.entities.Message.create({
        conversation_id: conv.id,
        sender_id: currentUserId,
        sender_name: 'Hệ thống',
        content: `${profile?.display_name || 'Bạn'} đã tạo nhóm`,
        type: 'system',
        read_by: [],
        deleted_by: []
      });
      // Notify members
      for (const uid of selected) {
        await base44.entities.Notification.create({
          user_id: uid,
          type: 'group_added',
          title: 'Được thêm vào nhóm',
          body: `${profile?.display_name} đã thêm bạn vào nhóm "${conv.name}"`,
          related_id: conv.id,
          from_user_name: profile?.display_name,
          from_user_avatar: profile?.avatar_url
        });
      }
      onCreated(conv);
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const filtered = friends.filter(f => {
    const fid = getFriendId(f);
    const p = profiles[fid];
    if (!search) return true;
    return p?.display_name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 rounded-xl w-full max-w-md max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="font-bold dark:text-white">Tạo nhóm chat</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>
        <div className="p-3 space-y-2">
          <input
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Tên nhóm (không bắt buộc)"
            className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-lg text-sm outline-none"
          />
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none"
            />
          </div>
          {selected.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selected.map(id => (
                <span key={id} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 px-2 py-0.5 rounded-full text-xs">
                  {profiles[id]?.display_name}
                  <button onClick={() => toggle(id)} className="hover:text-red-500"><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map(f => {
            const fid = getFriendId(f);
            const p = profiles[fid];
            const isSelected = selected.includes(fid);
            return (
              <button
                key={f.id}
                onClick={() => toggle(fid)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Avatar src={p?.avatar_url} name={p?.display_name} size={40} />
                <span className="flex-1 font-medium text-sm text-left dark:text-white">{p?.display_name}</span>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300'}`}>
                  {isSelected && <Check size={12} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-3 border-t dark:border-gray-700">
          <button
            onClick={createGroup}
            disabled={selected.length < 1 || creating}
            className="w-full py-2.5 bg-blue-500 text-white rounded-lg font-medium text-sm disabled:opacity-50 hover:bg-blue-600 transition-colors"
          >
            {creating ? 'Đang tạo...' : `Tạo nhóm (${selected.length} thành viên)`}
          </button>
        </div>
      </div>
    </div>
  );
}
