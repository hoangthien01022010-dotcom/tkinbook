import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { Search, Plus, Users, MessageCircle, Phone } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');
import { useNavigate } from 'react-router-dom';

export default function ConversationList({ currentUserId, profile, selectedId, onSelect, onNewChat, onNewGroup }) {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadConversations = async () => {
    try {
      const all = await base44.entities.Conversation.list('-last_message_time', 200);
      const mine = all.filter(c => c.participant_ids?.includes(currentUserId));
      setConversations(mine);

      // Load profiles for direct chats
      const allProfiles = await base44.entities.UserProfile.list('-created_date', 500);
      const map = {};
      allProfiles.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
    const unsub = base44.entities.Conversation.subscribe(() => loadConversations());
    const unsubMsg = base44.entities.Message.subscribe(() => loadConversations());
    return () => { unsub(); unsubMsg(); };
  }, [currentUserId]);

  const computeOnline = (profile) => {
    if (!profile) return false;
    if (profile.last_active) {
      const diff = Date.now() - new Date(profile.last_active).getTime();
      return diff < 2 * 60 * 1000;
    }
    return profile.is_online || false;
  };

  const getConvDisplay = (conv) => {
    if (conv.type === 'group') {
      return { name: conv.name || 'Nhóm chat', avatar: conv.avatar_url, isOnline: null };
    }
    const otherId = conv.participant_ids?.find(id => id !== currentUserId);
    const otherProfile = profiles[otherId];
    return {
      name: otherProfile?.display_name || 'Người dùng',
      avatar: otherProfile?.avatar_url,
      isOnline: computeOnline(otherProfile)
    };
  };

  const filtered = conversations.filter(c => {
    if (!search) return true;
    const display = getConvDisplay(c);
    return display.name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-bold dark:text-white">Đoạn chat</h1>
          <div className="flex gap-1">
            <button 
              onClick={() => navigate('/call-room')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Tham gia phòng gọi"
            >
              <Phone size={20} className="dark:text-gray-300" />
            </button>
            <button 
              onClick={onNewChat}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Tin nhắn mới"
            >
              <MessageCircle size={20} className="dark:text-gray-300" />
            </button>
            <button 
              onClick={onNewGroup}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
              title="Tạo nhóm"
            >
              <Users size={20} className="dark:text-gray-300" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm kiếm trên Messenger"
            className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có cuộc trò chuyện nào</p>
          </div>
        ) : (
          filtered.map(conv => {
            const display = getConvDisplay(conv);
            const isActive = selectedId === conv.id;
            return (
              <button
                key={conv.id}
                onClick={() => onSelect(conv)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${isActive ? 'bg-blue-50 dark:bg-gray-800' : ''}`}
              >
                <Avatar 
                  src={display.avatar} 
                  name={display.name} 
                  size={48} 
                  isOnline={conv.type === 'direct' ? display.isOnline : undefined}
                />
                <div className="flex-1 min-w-0 text-left">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm truncate dark:text-white">{display.name}</span>
                    {conv.last_message_time && (
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {moment(conv.last_message_time).utcOffset(420).fromNow()}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                      {conv.last_message_sender === currentUserId ? 'Bạn: ' : ''}
                      {conv.last_message}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
