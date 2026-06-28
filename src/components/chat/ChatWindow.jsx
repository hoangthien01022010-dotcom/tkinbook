import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import { Send, Image, Paperclip, ArrowLeft, Phone, Video } from 'lucide-react';
import ConversationSettingsMenu from './ConversationSettingsMenu';
import { withAIQueue } from '@/lib/aiQueue';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');

export default function ChatWindow({ conversation, currentUserId, profile, profiles, onBack, onOpenInfo, onDeleteConversation }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);
  const bottomRef = useRef(null);
  const fileRef = useRef(null);
  const imageRef = useRef(null);

  const generateRoomCode = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const startCall = async (callType) => {
    if (calling) return;
    setCalling(true);
    try {
      const code = generateRoomCode();
      const participantIds = conversation.participant_ids || [];
      const participantNames = conversation.participant_names || [];
      const room = await base44.entities.CallRoom.create({
        room_code: code,
        host_id: currentUserId,
        host_name: profile?.display_name,
        name: conversation.type === 'group'
          ? (conversation.name || 'Nhóm gọi')
          : `Gọi với ${profile?.display_name}`,
        participant_ids: [currentUserId],
        participant_names: [profile?.display_name],
        participant_cameras: { [currentUserId]: callType === 'video' },
        participant_mics: { [currentUserId]: true },
        call_type: callType,
        status: 'active',
        started_at: new Date().toISOString()
      });
      // Notify other participants
      const others = participantIds.filter(id => id !== currentUserId);
      for (const oid of others) {
        const otherProfile = profiles?.[oid];
        await base44.entities.Notification.create({
          user_id: oid,
          type: 'system',
          title: 'Lời mời gọi',
          body: `${profile?.display_name} mời bạn ${callType === 'video' ? 'gọi video' : 'gọi'}. Mã phòng: ${code}`,
          related_id: room.id,
          from_user_name: profile?.display_name,
          from_user_avatar: profile?.avatar_url
        });
      }
      navigate(`/call-room?code=${code}`);
    } catch (e) {
      console.error(e);
    } finally {
      setCalling(false);
    }
  };

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.Message.filter(
        { conversation_id: conversation.id },
        'created_date',
        500
      );
      setMessages(msgs.filter(m => !m.deleted_by?.includes(currentUserId)));
      // Mark as read
      const unread = msgs.filter(m => m.sender_id !== currentUserId && !m.read_by?.includes(currentUserId));
      for (const msg of unread) {
        await base44.entities.Message.update(msg.id, {
          read_by: [...(msg.read_by || []), currentUserId]
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadMessages();
    const unsub = base44.entities.Message.subscribe((event) => {
      if (event.data?.conversation_id === conversation.id) {
        loadMessages();
      }
    });
    return () => unsub();
  }, [conversation.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const computeOnline = (profile) => {
    if (!profile) return false;
    if (profile.is_online === false && !profile.last_active) return false;
    if (profile.last_active) {
      const diff = Date.now() - new Date(profile.last_active).getTime();
      return diff < 2 * 60 * 1000;
    }
    return profile.is_online || false;
  };

  const getOtherProfile = () => {
    if (conversation.type === 'group') {
      return { display_name: conversation.name || 'Nhóm chat', avatar_url: conversation.avatar_url, is_online: null, last_active: null };
    }
    const otherId = conversation.participant_ids?.find(id => id !== currentUserId);
    const p = profiles?.[otherId] || { display_name: 'Người dùng', avatar_url: '', is_online: false, last_active: null };
    return { ...p, is_online: computeOnline(p) };
  };

  const other = getOtherProfile();

  const sendMessage = async (content, type = 'text', fileUrl = '', fileName = '') => {
    if (!content && !fileUrl) return;
    setSending(true);
    try {
      await base44.entities.Message.create({
        conversation_id: conversation.id,
        sender_id: currentUserId,
        sender_name: profile?.display_name || 'Bạn',
        sender_avatar: profile?.avatar_url || '',
        content: content || fileName || '',
        type,
        file_url: fileUrl,
        file_name: fileName,
        read_by: [currentUserId],
        deleted_by: []
      });
      await base44.entities.Conversation.update(conversation.id, {
        last_message: type === 'text' ? content : (type === 'image' ? '📷 Ảnh' : '📎 Tệp'),
        last_message_time: new Date().toISOString(),
        last_message_sender: currentUserId
      });
      setText('');

      // Bot auto-reply
      if (type === 'text' && conversation.type === 'direct') {
        const otherId = conversation.participant_ids?.find(id => id !== currentUserId);
        const otherProfile = profiles?.[otherId];
        if (otherProfile?.is_bot) {
          triggerBotReply(content, otherProfile);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  const triggerBotReply = async (userMessage, botProfile) => {
    // Delay ngẫu nhiên 2-5 giây giống người thật đang gõ
    const delay = 2000 + Math.random() * 3000;
    setTimeout(async () => {
      try {
        const botPersona = botProfile.bot_persona || botProfile.display_name;
        const response = await withAIQueue(() => base44.integrations.Core.InvokeLLM({
          prompt: `Bạn là "${botProfile.display_name}", một người dùng thật trên mạng xã hội nhắn tin "Kin Book".

Tính cách của bạn: ${botPersona}

Quy tắc trả lời:
- Viết NGẮN GỌN, như tin nhắn chat thật (1-3 câu)
- Đôi khi viết tắt, bỏ dấu, dùng từ lóng, emoji
- KHÔNG trả lời như AI hay robot, KHÔNG dùng markdown
- Trả lời tự nhiên, có thể hỏi lại, đùa, đồng tình, phản biện
- Đôi khi trả lời rất ngắn như "ok", "haha", "thật à?", "hay đấy"
- Giữ phong cách riêng của bạn, không lặp lại
- Trả lời bằng tiếng Việt

Tin nhắn của người khác gửi: "${userMessage}"

Trả lời:`
        }));

        let reply = typeof response === 'string' ? response : (response?.response || response?.text || '');
        if (!reply) reply = 'hmm ok';

        await base44.entities.Message.create({
          conversation_id: conversation.id,
          sender_id: botProfile.user_id,
          sender_name: botProfile.display_name,
          sender_avatar: botProfile.avatar_url || '',
          content: reply,
          type: 'text',
          read_by: [],
          deleted_by: []
        });
        await base44.entities.Conversation.update(conversation.id, {
          last_message: reply,
          last_message_time: new Date().toISOString(),
          last_message_sender: botProfile.user_id
        });
      } catch (e) {
        console.error(e);
      }
    }, delay);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(text.trim());
    }
  };

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    setSending(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const msgType = type === 'image' ? 'image' : (file.type.startsWith('video/') ? 'video' : 'file');
      await sendMessage('', msgType, file_url, file.name);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-white dark:bg-gray-900">
        <button onClick={onBack} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
          <ArrowLeft size={20} className="dark:text-gray-300" />
        </button>
        <Avatar 
          src={other.avatar_url} 
          name={other.display_name} 
          size={40} 
          isOnline={conversation.type === 'direct' ? other.is_online : undefined}
        />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm truncate dark:text-white">{other.display_name}</p>
          {conversation.type === 'direct' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {other.is_online ? 'Đang hoạt động' : other.last_active ? `Hoạt động ${moment(other.last_active).utcOffset(420).fromNow()}` : 'Ngoại tuyến'}
            </p>
          )}
          {conversation.type === 'group' && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {conversation.participant_ids?.length || 0} thành viên
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => startCall('audio')}
            disabled={calling}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full disabled:opacity-40"
            title="Gọi âm thanh"
          >
            <Phone size={18} className="text-blue-500" />
          </button>
          <button
            onClick={() => startCall('video')}
            disabled={calling}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full disabled:opacity-40"
            title="Gọi video"
          >
            <Video size={18} className="text-blue-500" />
          </button>
          <ConversationSettingsMenu
            conversation={conversation}
            currentUserId={currentUserId}
            profile={profile}
            onViewInfo={onOpenInfo}
            onDeleted={onDeleteConversation}
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1 bg-gray-50 dark:bg-gray-950">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <Avatar src={other.avatar_url} name={other.display_name} size={64} className="mx-auto mb-3" />
            <p className="font-semibold dark:text-white">{other.display_name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Bắt đầu cuộc trò chuyện</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isOwn={msg.sender_id === currentUserId}
              showAvatar={i === 0 || messages[i-1]?.sender_id !== msg.sender_id}
              currentUserId={currentUserId}
              participantCount={conversation.participant_ids?.length || 2}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-end gap-2">
          <input
            ref={imageRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => handleFileUpload(e, 'image')}
          />
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={e => handleFileUpload(e, 'file')}
          />
          <button 
            onClick={() => imageRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0"
          >
            <Image size={20} className="text-blue-500" />
          </button>
          <button 
            onClick={() => fileRef.current?.click()}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0"
          >
            <Paperclip size={20} className="text-blue-500" />
          </button>
          <div className="flex-1 relative">
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Aa"
              rows={1}
              className="w-full resize-none px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none focus:ring-2 focus:ring-blue-500 max-h-24"
              style={{ minHeight: 36 }}
            />
          </div>
          <button 
            onClick={() => sendMessage(text.trim())}
            disabled={!text.trim() || sending}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full shrink-0 disabled:opacity-40"
          >
            <Send size={20} className={text.trim() ? 'text-blue-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>
    </div>
  );
}
