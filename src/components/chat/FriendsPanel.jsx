import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { Search, UserPlus, UserCheck, UserX, X, ArrowLeft } from 'lucide-react';

export default function FriendsPanel({ currentUserId, profile, onClose, onStartChat }) {
  const [tab, setTab] = useState('friends');
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingTo, setSendingTo] = useState(null);

  const load = async () => {
    try {
      const [allProfiles, allFriends] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 500),
        base44.entities.Friendship.list('-created_date', 500)
      ]);
      setProfiles(allProfiles);
      setFriendships(allFriends);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const u1 = base44.entities.Friendship.subscribe(() => load());
    return () => u1();
  }, []);

  const profileMap = {};
  profiles.forEach(p => { profileMap[p.user_id] = p; });

  const myFriends = friendships.filter(f => 
    f.status === 'accepted' && (f.requester_id === currentUserId || f.receiver_id === currentUserId)
  );

  const pendingReceived = friendships.filter(f => f.status === 'pending' && f.receiver_id === currentUserId);
  const pendingSent = friendships.filter(f => f.status === 'pending' && f.requester_id === currentUserId);

  const getFriendUserId = (f) => f.requester_id === currentUserId ? f.receiver_id : f.requester_id;

  const friendUserIds = new Set([
    ...myFriends.map(getFriendUserId),
    ...pendingSent.map(f => f.receiver_id),
    ...pendingReceived.map(f => f.requester_id)
  ]);

  const searchResults = profiles.filter(p => 
    p.user_id !== currentUserId &&
    p.display_name?.toLowerCase().includes(search.toLowerCase())
  );

  const sendRequest = async (userId) => {
    if (sendingTo) return;
    const existing = friendships.find(f =>
      (f.requester_id === currentUserId && f.receiver_id === userId) ||
      (f.receiver_id === currentUserId && f.requester_id === userId)
    );
    if (existing) return;
    setSendingTo(userId);
    try {
      const otherProfile = profileMap[userId];
      await base44.entities.Friendship.create({
        requester_id: currentUserId,
        requester_name: profile?.display_name,
        requester_avatar: profile?.avatar_url,
        receiver_id: userId,
        receiver_name: otherProfile?.display_name,
        receiver_avatar: otherProfile?.avatar_url,
        status: 'pending'
      });
      await base44.entities.Notification.create({
        user_id: userId,
        type: 'friend_request',
        title: 'Lời mời kết bạn',
        body: `${profile?.display_name} đã gửi lời mời kết bạn`,
        from_user_name: profile?.display_name,
        from_user_avatar: profile?.avatar_url
      });
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setSendingTo(null);
    }
  };

  const acceptRequest = async (friendshipId, requesterId) => {
    await base44.entities.Friendship.update(friendshipId, { status: 'accepted' });
    await base44.entities.Notification.create({
      user_id: requesterId,
      type: 'friend_accepted',
      title: 'Lời mời được chấp nhận',
      body: `${profile?.display_name} đã chấp nhận lời mời kết bạn`,
      from_user_name: profile?.display_name,
      from_user_avatar: profile?.avatar_url
    });
    load();
  };

  const rejectRequest = async (friendshipId) => {
    await base44.entities.Friendship.update(friendshipId, { status: 'rejected' });
    load();
  };

  const unfriend = async (friendshipId) => {
    await base44.entities.Friendship.delete(friendshipId);
    load();
  };

  const getRelation = (userId) => {
    const sent = pendingSent.find(f => f.receiver_id === userId);
    if (sent) return { type: 'sent', id: sent.id };
    const recv = pendingReceived.find(f => f.requester_id === userId);
    if (recv) return { type: 'received', id: recv.id };
    const friend = myFriends.find(f => getFriendUserId(f) === userId);
    if (friend) return { type: 'friend', id: friend.id };
    return { type: 'none' };
  };

  const suggestions = profiles.filter(p =>
    p.user_id !== currentUserId && !friendUserIds.has(p.user_id)
  ).slice(0, 10);

  const tabs = [
    { key: 'friends', label: 'Bạn bè', count: myFriends.length },
    { key: 'requests', label: 'Lời mời', count: pendingReceived.length },
    { key: 'suggest', label: 'Gợi ý', count: suggestions.length },
    { key: 'search', label: 'Tìm kiếm' }
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft size={20} className="dark:text-gray-300" />
          </button>
          <h2 className="font-bold text-lg dark:text-white">Bạn bè</h2>
        </div>
        <div className="flex gap-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                tab === t.key 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              {t.label} {t.count !== undefined && t.count > 0 ? `(${t.count})` : ''}
            </button>
          ))}
        </div>
      </div>

      {(tab === 'search' || tab === 'friends') && (
        <div className="px-4 pt-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={tab === 'search' ? 'Tìm người dùng...' : 'Tìm bạn bè...'}
              className="w-full pl-9 pr-3 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'friends' ? (
          myFriends.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">Chưa có bạn bè nào</p>
          ) : (
            myFriends.filter(f => {
              if (!search) return true;
              const fid = getFriendUserId(f);
              return profileMap[fid]?.display_name?.toLowerCase().includes(search.toLowerCase());
            }).map(f => {
              const fid = getFriendUserId(f);
              const p = profileMap[fid];
              return (
                <div key={f.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <Avatar src={p?.avatar_url} name={p?.display_name} size={44} isOnline={p?.is_online} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate dark:text-white">{p?.display_name}</p>
                    <p className="text-xs text-gray-500">{p?.is_online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                  </div>
                  <button onClick={() => onStartChat(fid)} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600">
                    Nhắn tin
                  </button>
                  <button onClick={() => unfriend(f.id)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full text-red-500">
                    <X size={16} />
                  </button>
                </div>
              );
            })
          )
        ) : tab === 'requests' ? (
          pendingReceived.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">Không có lời mời nào</p>
          ) : (
            pendingReceived.map(f => {
              const p = profileMap[f.requester_id];
              return (
                <div key={f.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <Avatar src={p?.avatar_url} name={p?.display_name} size={44} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate dark:text-white">{p?.display_name || f.requester_name}</p>
                    <p className="text-xs text-gray-500">Muốn kết bạn</p>
                  </div>
                  <button onClick={() => acceptRequest(f.id, f.requester_id)} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600">
                    Chấp nhận
                  </button>
                  <button onClick={() => rejectRequest(f.id)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                    Từ chối
                  </button>
                </div>
              );
            })
          )
        ) : tab === 'suggest' ? (
          suggestions.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">Không có gợi ý nào</p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1">Những người bạn có thể biết</p>
              {suggestions.map(p => (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <Avatar src={p.avatar_url} name={p.display_name} size={44} isOnline={p.is_online} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate dark:text-white">{p.display_name}</p>
                    <p className="text-xs text-gray-500">{p.is_online ? 'Đang hoạt động' : 'Ngoại tuyến'}</p>
                  </div>
                  <button
                    onClick={() => sendRequest(p.user_id)}
                    disabled={sendingTo === p.user_id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 disabled:opacity-50"
                  >
                    {sendingTo === p.user_id ? (
                      <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Đang gửi</>
                    ) : (
                      <><UserPlus size={12} /> Kết bạn</>
                    )}
                  </button>
                </div>
              ))}
            </>
          )
        ) : (
          search.length < 1 ? (
            <p className="text-center py-12 text-gray-500 text-sm">Nhập tên để tìm người dùng</p>
          ) : searchResults.length === 0 ? (
            <p className="text-center py-12 text-gray-500 text-sm">Không tìm thấy người dùng</p>
          ) : (
            searchResults.map(p => {
              const rel = getRelation(p.user_id);
              return (
                <div key={p.id} className="flex items-center gap-3 px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg">
                  <Avatar src={p.avatar_url} name={p.display_name} size={44} isOnline={p.is_online} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate dark:text-white">{p.display_name}</p>
                  </div>
                  {rel.type === 'none' && (
                    <button
                      onClick={() => sendRequest(p.user_id)}
                      disabled={sendingTo === p.user_id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-full hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingTo === p.user_id ? (
                        <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" /> Đang gửi</>
                      ) : (
                        <><UserPlus size={12} /> Kết bạn</>
                      )}
                    </button>
                  )}
                  {rel.type === 'sent' && (
                    <span className="text-xs text-gray-500 px-2">Đã gửi</span>
                  )}
                  {rel.type === 'received' && (
                    <button onClick={() => acceptRequest(rel.id, p.user_id)} className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white text-xs rounded-full">
                      <UserCheck size={12} /> Chấp nhận
                    </button>
                  )}
                  {rel.type === 'friend' && (
                    <span className="text-xs text-green-500 px-2">Bạn bè ✓</span>
                  )}
                </div>
              );
            })
          )
        )}
      </div>
    </div>
  );
}
