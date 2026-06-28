import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import ConversationList from '@/components/chat/ConversationList';
import ChatWindow from '@/components/chat/ChatWindow';
import FriendsPanel from '@/components/chat/FriendsPanel';
import NotificationsPanel from '@/components/chat/NotificationsPanel';
import ProfilePanel from '@/components/chat/ProfilePanel';
import AIBotChat from '@/components/chat/AIBotChat';
import NewChatModal from '@/components/chat/NewChatModal';
import NewGroupModal from '@/components/chat/NewGroupModal';
import ConversationInfo from '@/components/chat/ConversationInfo';
import Avatar from '@/components/chat/Avatar';
import { MessageCircle, Users, Bell, Settings, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const { user, profile, setProfile, loading } = useCurrentUser();
  const navigate = useNavigate();
  const [selectedConv, setSelectedConv] = useState(null);
  const [activeTab, setActiveTab] = useState('chats');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showConvInfo, setShowConvInfo] = useState(false);
  const [profiles, setProfiles] = useState({});
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [mobileView, setMobileView] = useState('list'); // list | chat

  useEffect(() => {
    if (!user) return;
    const loadProfiles = async () => {
      const all = await base44.entities.UserProfile.list('-created_date', 500);
      const map = {};
      all.forEach(p => { map[p.user_id] = p; });
      setProfiles(map);
    };
    loadProfiles();

    const loadNotifs = async () => {
      const notifs = await base44.entities.Notification.filter({ user_id: user.id, is_read: false });
      setUnreadNotifs(notifs.length);
    };
    loadNotifs();

    const u1 = base44.entities.UserProfile.subscribe(() => loadProfiles());
    const u2 = base44.entities.Notification.subscribe(() => loadNotifs());
    return () => { u1(); u2(); };
  }, [user?.id]);

  const selectConversation = (conv) => {
    setSelectedConv(conv);
    setMobileView('chat');
    setActiveTab('chats');
  };

  const startChatWith = async (friendId) => {
    if (!user) return;
    const convs = await base44.entities.Conversation.filter({ type: 'direct' });
    const existing = convs.find(c =>
      c.participant_ids?.includes(user.id) && c.participant_ids?.includes(friendId)
    );
    if (existing) {
      selectConversation(existing);
      return;
    }
    const friendProfile = profiles[friendId];
    const conv = await base44.entities.Conversation.create({
      type: 'direct',
      participant_ids: [user.id, friendId],
      participant_names: [profile?.display_name || 'Bạn', friendProfile?.display_name || 'Bạn bè']
    });
    selectConversation(conv);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Đang tải...</p>
        </div>
      </div>
    );
  }

  if (profile?.is_banned) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900 p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚫</span>
          </div>
          <h2 className="text-xl font-bold dark:text-white mb-2">Tài khoản bị khóa</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
            {profile.ban_type === 'permanent'
              ? 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm quy tắc cộng đồng.'
              : `Tài khoản bị khóa tạm thời đến ${profile.ban_until ? new Date(profile.ban_until).toLocaleDateString('vi-VN') : 'khi có thông báo mới'}.`}
          </p>
          <button onClick={() => base44.auth.logout('/login')} className="px-6 py-2 bg-gray-200 dark:bg-gray-700 dark:text-white rounded-lg text-sm">
            Đăng xuất
          </button>
        </div>
      </div>
    );
  }

  const navItems = [
    { key: 'chats', icon: MessageCircle, label: 'Chat' },
    { key: 'friends', icon: Users, label: 'Bạn bè' },
    { key: 'bot', icon: Bot, label: 'AI Bot' },
    { key: 'notifications', icon: Bell, label: 'Thông báo', badge: unreadNotifs },
    { key: 'profile', icon: Settings, label: 'Cài đặt' },
  ];

  const renderSidebar = () => {
    switch (activeTab) {
      case 'friends':
        return <FriendsPanel currentUserId={user.id} profile={profile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} onStartChat={startChatWith} />;
      case 'bot':
        return <AIBotChat currentUserId={user.id} profile={profile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} />;
      case 'notifications':
        return <NotificationsPanel currentUserId={user.id} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} />;
      case 'profile':
        return <ProfilePanel user={user} profile={profile} setProfile={setProfile} onClose={() => { setActiveTab('chats'); setMobileView('list'); }} onAdmin={() => navigate('/admin')} />;
      default:
        return (
          <ConversationList
            currentUserId={user.id}
            profile={profile}
            selectedId={selectedConv?.id}
            onSelect={selectConversation}
            onNewChat={() => setShowNewChat(true)}
            onNewGroup={() => setShowNewGroup(true)}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 flex flex-col bg-white dark:bg-gray-900">
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop: sidebar always visible */}
        {/* Mobile: show list or chat */}
        <div className={`w-full md:w-[360px] md:border-r dark:border-gray-700 flex flex-col ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <div className="flex-1 overflow-hidden">
            {renderSidebar()}
          </div>
          {/* Bottom nav */}
          <div className="flex items-center justify-around border-t dark:border-gray-700 bg-white dark:bg-gray-900 py-1 px-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveTab(item.key);
                    if (item.key !== 'chats') setMobileView('list');
                  }}
                  className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors ${
                    isActive ? 'text-blue-500' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                  }`}
                >
                  <Icon size={20} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className="absolute -top-0.5 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat area */}
        <div className={`flex-1 ${mobileView === 'list' ? 'hidden md:flex' : 'flex'} flex-col`}>
          {selectedConv ? (
            <ChatWindow
              conversation={selectedConv}
              currentUserId={user.id}
              profile={profile}
              profiles={profiles}
              onBack={() => setMobileView('list')}
              onOpenInfo={() => setShowConvInfo(true)}
              onDeleteConversation={() => { setSelectedConv(null); setMobileView('list'); }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-950">
              <div className="text-center">
                <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle size={36} className="text-blue-500" />
                </div>
                <h2 className="text-xl font-bold dark:text-white mb-1">Kin Book</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Chọn cuộc trò chuyện để bắt đầu nhắn tin</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewChat && (
        <NewChatModal
          currentUserId={user.id}
          onClose={() => setShowNewChat(false)}
          onConversationCreated={(conv) => { selectConversation(conv); setShowNewChat(false); }}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          currentUserId={user.id}
          profile={profile}
          onClose={() => setShowNewGroup(false)}
          onCreated={(conv) => { selectConversation(conv); setShowNewGroup(false); }}
        />
      )}
      {showConvInfo && selectedConv && (
        <ConversationInfo
          conversation={selectedConv}
          currentUserId={user.id}
          profile={profile}
          profiles={profiles}
          onClose={() => setShowConvInfo(false)}
          onUpdated={async () => {
            const updated = await base44.entities.Conversation.filter({ id: selectedConv.id });
            if (updated[0]) setSelectedConv(updated[0]);
            setShowConvInfo(false);
          }}
        />
      )}
    </div>
  );
}
