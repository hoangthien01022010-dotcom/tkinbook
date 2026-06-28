import React, { useState, useEffect, useRef, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import Avatar from '@/components/chat/Avatar';
import { ArrowLeft, Video, Mic, MicOff, VideoOff, PhoneOff, Copy, Check, UserPlus, Users, Phone, X } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';

export default function CallRoom({ onBack }) {
  const { user, profile } = useCurrentUser();
  const [searchParams] = useSearchParams();
  const autoJoinCode = searchParams.get('code');
  const [room, setRoom] = useState(null);
  const [joinCode, setJoinCode] = useState('');
  const [roomName, setRoomName] = useState('');
  const [callType, setCallType] = useState('video');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [friends, setFriends] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [error, setError] = useState('');

  // Call state
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const localVideoRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setLoading(false);
    loadFriends();
    if (autoJoinCode && profile) {
      joinRoom(autoJoinCode);
    }
  }, [user, profile]);

  useEffect(() => {
    if (!room) return;
    const unsub = base44.entities.CallRoom.subscribe((event) => {
      if (event.data?.id === room.id) {
        loadRoom(room.id);
      }
    });
    return () => unsub();
  }, [room?.id]);

  useEffect(() => {
    if (!room) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [room?.id]);

  const loadFriends = async () => {
    if (!user) return;
    try {
      const [allFriends, allProfiles] = await Promise.all([
        base44.entities.Friendship.list('-created_date', 500),
        base44.entities.UserProfile.list('-created_date', 500)
      ]);
      const pMap = {};
      allProfiles.forEach(p => { pMap[p.user_id] = p; });
      setProfiles(pMap);
      const myFriends = allFriends.filter(f =>
        f.status === 'accepted' && (f.requester_id === user.id || f.receiver_id === user.id)
      );
      setFriends(myFriends);
    } catch (e) { console.error(e); }
  };

  const loadRoom = async (roomId) => {
    const rooms = await base44.entities.CallRoom.filter({ id: roomId });
    if (rooms[0]) {
      if (rooms[0].status === 'ended') {
        cleanupStream();
        setRoom(null);
        setError('Phòng gọi đã kết thúc');
      } else {
        setRoom(rooms[0]);
      }
    }
  };

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const createRoom = async () => {
    setError('');
    if (!user || !profile) return;
    const code = generateRoomCode();
    try {
      const newRoom = await base44.entities.CallRoom.create({
        room_code: code,
        host_id: user.id,
        host_name: profile.display_name,
        name: roomName.trim() || `Phòng của ${profile.display_name}`,
        participant_ids: [user.id],
        participant_names: [profile.display_name],
        participant_cameras: { [user.id]: camOn },
        participant_mics: { [user.id]: micOn },
        call_type: callType,
        status: 'active',
        started_at: new Date().toISOString()
      });
      setRoom(newRoom);
      setElapsed(0);
      startLocalStream();
    } catch (e) {
      setError('Không thể tạo phòng. Vui lòng thử lại.');
    }
  };

  const joinRoom = async (code) => {
    const roomCode = (code || joinCode || '').trim().toUpperCase();
    setError('');
    if (!user || !profile || !roomCode) return;
    try {
      const rooms = await base44.entities.CallRoom.filter({ room_code: roomCode, status: 'active' });
      if (rooms.length === 0) {
        setError('Không tìm thấy phòng hoặc phòng đã kết thúc');
        return;
      }
      const r = rooms[0];
      const pIds = r.participant_ids || [];
      if (!pIds.includes(user.id)) {
        pIds.push(user.id);
      }
      const pNames = r.participant_names || [];
      if (!pNames.includes(profile.display_name)) {
        pNames.push(profile.display_name);
      }
      const cams = { ...(r.participant_cameras || {}), [user.id]: camOn };
      const mics = { ...(r.participant_mics || {}), [user.id]: micOn };
      await base44.entities.CallRoom.update(r.id, {
        participant_ids: pIds,
        participant_names: pNames,
        participant_cameras: cams,
        participant_mics: mics
      });
      setRoom({ ...r, participant_ids: pIds, participant_names: pNames, participant_cameras: cams, participant_mics: mics });
      setElapsed(0);
      startLocalStream();
    } catch (e) {
      setError('Không thể tham gia phòng. Vui lòng thử lại.');
    }
  };

  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callType === 'video',
        audio: true
      });
      streamRef.current = stream;
      if (localVideoRef.current && callType === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.error('Không thể truy cập camera/mic:', e);
      setError('Không thể truy cập camera/mic. Vui lòng cấp quyền.');
    }
  };

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const toggleMic = async () => {
    const newVal = !micOn;
    setMicOn(newVal);
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = newVal);
    }
    if (room) {
      const mics = { ...(room.participant_mics || {}), [user.id]: newVal };
      await base44.entities.CallRoom.update(room.id, { participant_mics: mics });
    }
  };

  const toggleCam = async () => {
    const newVal = !camOn;
    setCamOn(newVal);
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = newVal);
    }
    if (room) {
      const cams = { ...(room.participant_cameras || {}), [user.id]: newVal };
      await base44.entities.CallRoom.update(room.id, { participant_cameras: cams });
    }
  };

  const leaveRoom = async () => {
    if (!room || !user) {
      cleanupStream();
      setRoom(null);
      return;
    }
    const pIds = (room.participant_ids || []).filter(id => id !== user.id);
    const pNames = (room.participant_names || []).filter(n => n !== profile?.display_name);
    if (pIds.length === 0) {
      await base44.entities.CallRoom.update(room.id, { status: 'ended' });
    } else {
      const cams = { ...(room.participant_cameras || {}) };
      const mics = { ...(room.participant_mics || {}) };
      delete cams[user.id];
      delete mics[user.id];
      await base44.entities.CallRoom.update(room.id, {
        participant_ids: pIds,
        participant_names: pNames,
        participant_cameras: cams,
        participant_mics: mics
      });
    }
    cleanupStream();
    setRoom(null);
    setElapsed(0);
    setJoinCode('');
    setRoomName('');
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(room.room_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inviteFriend = async (friendId) => {
    if (!room || !profiles[friendId]) return;
    const friendProfile = profiles[friendId];
    await base44.entities.Notification.create({
      user_id: friendId,
      type: 'system',
      title: 'Lời mời phòng gọi',
      body: `${profile?.display_name} mời bạn tham gia phòng gọi "${room.name}". Mã phòng: ${room.room_code}`,
      from_user_name: profile?.display_name,
      from_user_avatar: profile?.avatar_url
    });
  };

  const getFriendId = (f) => f.requester_id === user?.id ? f.receiver_id : f.requester_id;

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // In-room view
  if (room) {
    const participantIds = room.participant_ids || [];
    const participantNames = room.participant_names || [];
    const cams = room.participant_cameras || {};
    const mics = room.participant_mics || {};

    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-gray-900 to-black">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 backdrop-blur-sm bg-black/20">
          <button onClick={() => onBack ? onBack() : window.history.back()} className="p-1.5 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft size={20} className="text-gray-300" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-white truncate">{room.name}</p>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              {formatTime(elapsed)} • {participantIds.length} người tham gia
            </p>
          </div>
          <button onClick={() => setShowInvite(!showInvite)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <UserPlus size={18} className="text-blue-400" />
          </button>
        </div>

        {/* Invite panel */}
        {showInvite && (
          <div className="px-4 py-3 bg-gray-900 border-b border-gray-800">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-300">Mời bạn bè ({friends.length})</p>
              <button onClick={() => setShowInvite(false)} className="text-gray-400"><X size={14} /></button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {friends.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-2">Chưa có bạn bè</p>
              ) : friends.map(f => {
                const fid = getFriendId(f);
                const p = profiles[fid];
                const inRoom = participantIds.includes(fid);
                return (
                  <div key={f.id} className="flex items-center gap-2 py-1">
                    <Avatar src={p?.avatar_url} name={p?.display_name} size={28} isOnline={p?.is_online} />
                    <span className="flex-1 text-sm text-gray-200 truncate">{p?.display_name}</span>
                    {inRoom ? (
                      <span className="text-xs text-green-400">Đang trong phòng</span>
                    ) : (
                      <button onClick={() => inviteFriend(fid)} className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600">
                        Mời
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
              <span>Mã phòng:</span>
              <button onClick={copyRoomCode} className="flex items-center gap-1 px-2 py-1 bg-gray-800 rounded font-mono text-white">
                {room.room_code} {copied ? <Check size={10} className="text-green-400" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
        )}

        {/* Video grid */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className={`grid gap-3 ${participantIds.length <= 1 ? 'grid-cols-1' : participantIds.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-2'}`}>
            {participantIds.map((pid, idx) => {
              const name = participantNames[idx] || 'Người dùng';
              const isMe = pid === user?.id;
              const p = profiles[pid];
              const hasCam = isMe ? camOn : cams[pid];
              const hasMic = isMe ? micOn : mics[pid];
              const tileHeight = participantIds.length <= 2 ? 'h-full max-h-[60vh]' : '';
              return (
                <div key={pid} className={`relative aspect-video ${tileHeight} bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden flex items-center justify-center ring-1 ring-white/5`}>
                  {isMe && callType === 'video' ? (
                    <>
                      <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" style={{ display: camOn ? 'block' : 'none' }} />
                      {!camOn && <Avatar src={p?.avatar_url} name={name} size={72} />}
                    </>
                  ) : hasCam && callType === 'video' ? (
                    <Avatar src={p?.avatar_url} name={name} size={72} />
                  ) : (
                    <Avatar src={p?.avatar_url} name={name} size={72} isOnline={p?.is_online} />
                  )}
                  {/* Name overlay */}
                  <div className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1 bg-black/70 backdrop-blur-sm rounded-lg">
                    {!hasMic && <MicOff size={11} className="text-red-400" />}
                    <span className="text-xs text-white font-medium">{isMe ? 'Bạn' : name}</span>
                  </div>
                  {p?.is_online && !isMe && (
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-green-500 rounded-full ring-2 ring-black/30" />
                  )}
                </div>
              );
            })}
          </div>
          {participantIds.length === 1 && (
            <div className="text-center mt-8">
              <div className="inline-flex flex-col items-center gap-3 px-6 py-5 bg-white/5 backdrop-blur-sm rounded-2xl">
                <p className="text-gray-400 text-sm">Đang đợi người khác tham gia...</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Mã phòng:</span>
                  <button onClick={copyRoomCode} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg font-mono text-white transition-colors">
                    {room.room_code} {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call controls */}
        <div className="flex items-center justify-center gap-3 py-5 bg-black/40 backdrop-blur-sm border-t border-white/10">
          <button onClick={toggleMic} className={`p-3.5 rounded-full transition-all ${micOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'}`}>
            {micOn ? <Mic size={20} className="text-white" /> : <MicOff size={20} className="text-white" />}
          </button>
          {callType === 'video' && (
            <button onClick={toggleCam} className={`p-3.5 rounded-full transition-all ${camOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'}`}>
              {camOn ? <Video size={20} className="text-white" /> : <VideoOff size={20} className="text-white" />}
            </button>
          )}
          <button onClick={copyRoomCode} className="p-3.5 rounded-full bg-white/10 hover:bg-white/20 transition-all">
            {copied ? <Check size={20} className="text-green-400" /> : <Copy size={20} className="text-white" />}
          </button>
          <button onClick={leaveRoom} className="p-3.5 rounded-full bg-red-500 hover:bg-red-600 transition-all shadow-lg shadow-red-500/30">
            <PhoneOff size={20} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Lobby view
  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-950 dark:to-black">
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-800">
        <button onClick={() => onBack ? onBack() : window.history.back()} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft size={20} className="dark:text-gray-300" />
        </button>
        <Video size={20} className="text-blue-500" />
        <h2 className="font-bold text-lg dark:text-white">Phòng gọi</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          {/* Create room */}
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 shadow-sm border dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-3">
              <Video size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-base dark:text-white mb-1">Tạo phòng gọi</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Tạo phòng mới và mời bạn bè tham gia</p>
            <input
              value={roomName}
              onChange={e => setRoomName(e.target.value)}
              placeholder="Tên phòng (không bắt buộc)"
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 dark:text-white border dark:border-gray-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-3"
            />
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setCallType('video')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${callType === 'video' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                <Video size={16} /> Video
              </button>
              <button
                onClick={() => setCallType('audio')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${callType === 'audio' ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' : 'bg-gray-100 dark:bg-gray-700 dark:text-gray-300'}`}
              >
                <Phone size={16} /> Âm thanh
              </button>
            </div>
            <button onClick={createRoom} className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20">
              Tạo phòng gọi
            </button>
          </div>

          {/* Join room */}
          <div className="bg-white dark:bg-gray-800/80 backdrop-blur rounded-2xl p-5 shadow-sm border dark:border-gray-700">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center mb-3">
              <Users size={24} className="text-white" />
            </div>
            <h3 className="font-bold text-base dark:text-white mb-1">Tham gia phòng</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Nhập mã phòng để tham gia cuộc gọi</p>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="VD: ABC123"
              maxLength={6}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700/50 dark:text-white border dark:border-gray-600 rounded-xl text-lg outline-none focus:ring-2 focus:ring-green-500 font-mono uppercase text-center tracking-widest mb-4"
            />
            <button onClick={() => joinRoom()} disabled={!joinCode.trim()} className="w-full py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg shadow-green-500/20">
              Tham gia ngay
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500 space-y-1 pt-2">
          <p>💡 Tạo phòng và chia sẻ mã cho bạn bè để gọi video/audio</p>
          <p>📷 Cấp quyền camera và mic để sử dụng đầy đủ</p>
        </div>
      </div>
    </div>
  );
}
