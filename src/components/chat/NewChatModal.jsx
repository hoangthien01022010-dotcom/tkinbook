import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { X, Search } from 'lucide-react';

export default function NewChatModal({ currentUserId, onClose, onConversationCreated }) {
  const [friends, setFriends] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState({});

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

  const startChat = async (friendId) => {
    // Check if conversation already exists
    const convs = await base44.entities.Conversation.filter({ type: 'direct' });
    const existing = convs.find(c => 
      c.participant_ids?.includes(currentUserId) && c.participant_ids?.includes(friendId)
    );
    if (existing) {
      onConversationCreated(existing);
      return;
    }
    const friendProfile = profiles[friendId];
    const conv = await base44.entities.Conversation.create({
      type: 'direct',
      participant_ids: [currentUserId, friendId],
      participant_names: [profiles[currentUserId]?.display_name || 'Bạn', friendProfile?.display_name || 'Bạn bè']
    });
    onConversationCreated(conv);
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
          <h2 className="font-bold dark:text-white">Tin nhắn mới</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>
        <div className="p-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Tìm bạn bè..."
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">Chưa có bạn bè nào</p>
          ) : (
            filtered.map(f => {
              const fid = getFriendId(f);
              const p = profiles[fid];
              return (
                <button
                  key={f.id}
                  onClick={() => startChat(fid)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <Avatar src={p?.avatar_url} name={p?.display_name} size={40} isOnline={p?.is_online} />
                  <span className="font-medium text-sm dark:text-white">{p?.display_name || 'Người dùng'}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
