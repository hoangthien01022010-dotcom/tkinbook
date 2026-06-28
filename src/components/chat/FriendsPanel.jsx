import { useEffect, useState, useMemo } from 'react';
import { base44 } from '@/lib/base44';

export default function FriendsPanel() {
  const [profile, setProfile] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [profiles, setProfiles] = useState([]);
  const [friendships, setFriendships] = useState([]);
  const [sendingTo, setSendingTo] = useState(null);
  const [errMsg, setErrMsg] = useState('');

  useEffect(() => {
    (async () => {
      try {
        // 1. Lấy user đang đăng nhập - thử nhiều cách cho chắc
        let me = null;
        try { me = await base44.auth.me(); } catch {}
        const authId = me?.id || me?.user_id || me?.email || null;

        // 2. Lấy profile
        const myProfiles = await base44.entities.UserProfile.filter(
          authId? { user_id: authId } : {}
        );
        const myProfile = myProfiles[0] || null;
        setProfile(myProfile);

        const uid = myProfile?.user_id || authId;
        setCurrentUserId(uid);

        if (!uid) {
          setErrMsg('Chưa đăng nhập / không lấy được user_id');
          return;
        }

        // 3. Load danh sách
        const [allProfiles, allFriendships] = await Promise.all([
          base44.entities.UserProfile.list(),
          base44.entities.Friendship.list()
        ]);
        setProfiles(allProfiles || []);
        setFriendships(allFriendships || []);
      } catch (e) {
        setErrMsg('Load lỗi: ' + (e.message || JSON.stringify(e)));
      }
    })();
  }, []);

  const profileMap = useMemo(() =>
    Object.fromEntries(profiles.map(p => [p.user_id, p])), [profiles]
  );

  const sendRequest = async (userId) => {
    if (sendingTo ||!currentUserId) return;
    setSendingTo(userId);
    setErrMsg(`Gửi ${currentUserId} -> ${userId}...`);
    try {
      const other = profileMap[userId] || {};
      const payload = {
        requester_id: String(currentUserId),
        requester_name: profile?.display_name || 'User',
        requester_avatar: profile?.avatar_url || '',
        receiver_id: String(userId),
        receiver_name: other.display_name || 'User',
        receiver_avatar: other.avatar_url || '',
        status: 'pending',
      };
      // base44 hay bắt created_by
      try { payload.created_by = String(currentUserId); } catch {}

      const newFriendship = await base44.entities.Friendship.create(payload);
      setErrMsg('OK đã gửi!');
      setFriendships(prev => [...prev, newFriendship]);
    } catch (e) {
      const msg = e?.message || e?.error || JSON.stringify(e);
      setErrMsg('Lỗi kết bạn: ' + msg);
      console.error(e);
    } finally {
      setSendingTo(null);
    }
  };

  const myFriendIds = useMemo(() => {
    if (!currentUserId) return new Set();
    const s = new Set();
    friendships.forEach(f => {
      if (f.requester_id === currentUserId) s.add(f.receiver_id);
      if (f.receiver_id === currentUserId) s.add(f.requester_id);
    });
    return s;
  }, [friendships, currentUserId]);

  const suggestions = profiles.filter(p =>
    p.user_id && p.user_id!== currentUserId &&!myFriendIds.has(p.user_id)
  );

  return (
    <div style={{padding:16}}>
      <h2>Bạn bè</h2>
      {errMsg && <p style={{color:'red', fontSize:13, whiteSpace:'pre-wrap'}}>{errMsg}</p>}
      {!currentUserId && <p>Đang tải profile...</p>}
      <p style={{fontSize:12, opacity:0.6}}>uid: {currentUserId || 'null'}</p>

      {suggestions.map(u => (
        <div key={u.user_id} style={{display:'flex', justifyContent:'space-between', padding:'8px 0'}}>
          <span>{u.display_name}</span>
          <button
            onClick={() => sendRequest(u.user_id)}
            disabled={sendingTo === u.user_id ||!currentUserId}
          >
            {sendingTo === u.user_id? 'Đang gửi...' : 'Kết bạn'}
          </button>
        </div>
      ))}
      {suggestions.length === 0 && currentUserId && <p>Hết gợi ý.</p>}
    </div>
  );
}
