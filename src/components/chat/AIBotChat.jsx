import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { ArrowLeft, Send, Bot, AlertTriangle, Zap, Brain, Swords, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { withAIQueue } from '@/lib/aiQueue';

const MODE_CONFIG = {
  fast: {
    label: 'Nhanh',
    icon: Zap,
    color: 'amber',
    prompt: `Bạn đang ở chế độ NHANH. Trả lời ngắn gọn, đi thẳng vào vấn đề. Mặc định dưới {maxWords} từ. Không giải thích dài dòng trừ khi người dùng yêu cầu. Trả lời tự nhiên như người thật.`
  },
  deep: {
    label: 'Phân tích',
    icon: Brain,
    color: 'blue',
    prompt: `Bạn đang ở chế độ PHÂN TÍCH. Trả lời chi tiết, phân tích ưu điểm và nhược điểm, so sánh nhiều góc nhìn. Tự chia nội dung thành các mục rõ ràng với tiêu đề (dùng markdown). Nhớ ngữ cảnh hội thoại và đưa ra phân tích sâu sắc ở mức độ {depth}/5. Trả lời tự nhiên, không lặp lại.`
  },
  direct: {
    label: 'Thẳng',
    icon: Swords,
    color: 'red',
    prompt: `Bạn đang ở chế độ THẲNG. Nói trực tiếp, chỉ ra sai lầm rõ ràng. Không dùng văn mẫu hoặc vòng vo. Được phép phản biện quyết định của người dùng nếu thấy rủi ro. Tuyệt đối không xúc phạm, không công kích cá nhân. Trả lời thẳng thắn nhưng tôn trọng.`
  }
};

const getContextPrompt = (mode, maxWords, depth) => {
  const config = MODE_CONFIG[mode];
  return config.prompt.replace('{maxWords}', maxWords).replace('{depth}', depth);
};

const WELCOME_MSG = { role: 'bot', content: 'Xin chào! Tôi là **ViBai** 🤖\n\nTôi có 3 chế độ trả lời:\n\n⚡ **Nhanh** — Trả lời ngắn gọn, đi thẳng vấn đề\n🧠 **Phân tích** — Chi tiết, so sánh nhiều góc nhìn\n⚔️ **Thẳng** — Trực tiếp, chỉ ra sai lầm\n\nChọn chế độ và hỏi tôi bất cứ điều gì!' };

export default function AIBotChat({ currentUserId, profile, onClose }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(`vibai_chat_${currentUserId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clean: remove streaming flag, drop empty bot messages
        return parsed.filter(m => m.content && m.content.trim()).map(m => ({ role: m.role, content: m.content }));
      }
    } catch (e) { /* ignore */ }
    return [WELCOME_MSG];
  });
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [mode, setMode] = useState(() => localStorage.getItem('kin_ai_mode') || 'fast');
  const [aiSettings, setAiSettings] = useState(null);
  const [showReport, setShowReport] = useState(false);
  const [reportUser, setReportUser] = useState('');
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [dailyCount, setDailyCount] = useState(0);
  const [limitReached, setLimitReached] = useState(false);
  const bottomRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    try {
      localStorage.setItem(`vibai_chat_${currentUserId}`, JSON.stringify(messages));
    } catch (e) { /* ignore */ }
  }, [messages, currentUserId]);

  useEffect(() => {
    loadAISettings();
    loadDailyCount();
  }, []);

  const loadAISettings = async () => {
    try {
      const settings = await base44.entities.AISettings.list();
      if (settings.length > 0) {
        setAiSettings(settings[0]);
      } else {
        const created = await base44.entities.AISettings.create({
          fast_enabled: true,
          deep_enabled: true,
          direct_enabled: true,
          fast_max_words: 100,
          analysis_depth: 3,
          daily_message_limit: 50,
          total_usage: 0
        });
        setAiSettings(created);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const loadDailyCount = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUserId });
      if (profiles.length > 0) {
        const p = profiles[0];
        if (p.ai_daily_date === today) {
          setDailyCount(p.ai_daily_count || 0);
        } else {
          await base44.entities.UserProfile.update(p.id, { ai_daily_count: 0, ai_daily_date: today });
          setDailyCount(0);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const incrementUsage = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const profiles = await base44.entities.UserProfile.filter({ user_id: currentUserId });
      if (profiles.length > 0) {
        const p = profiles[0];
        const newCount = (p.ai_daily_date === today ? (p.ai_daily_count || 0) : 0) + 1;
        await base44.entities.UserProfile.update(p.id, { 
          ai_daily_count: newCount, 
          ai_daily_date: today 
        });
        setDailyCount(newCount);

        if (aiSettings) {
          await base44.entities.AISettings.update(aiSettings.id, {
            total_usage: (aiSettings.total_usage || 0) + 1
          });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const changeMode = (newMode) => {
    if (!aiSettings) return;
    const modeKey = newMode + '_enabled';
    if (!aiSettings[modeKey]) return;
    setMode(newMode);
    localStorage.setItem('kin_ai_mode', newMode);
  };

  const buildContextMessages = () => {
    const recent = messages.slice(-12);
    let context = '';
    for (const msg of recent) {
      if (msg.role === 'user') {
        context += `\nNgười dùng: ${msg.content}`;
      } else if (msg.role === 'bot' && !msg.content.includes('Xin chào!')) {
        context += `\nViBai: ${msg.content}`;
      }
    }
    return context;
  };

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    
    const limit = aiSettings?.daily_message_limit || 50;
    if (dailyCount >= limit) {
      setLimitReached(true);
      setTimeout(() => setLimitReached(false), 3000);
      return;
    }

    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setText('');
    setSending(true);
    setThinking(true);

    try {
      const contextPrompt = buildContextMessages();
      const modePrompt = getContextPrompt(
        mode, 
        aiSettings?.fast_max_words || 100, 
        aiSettings?.analysis_depth || 3
      );

      const response = await withAIQueue(() => base44.integrations.Core.InvokeLLM({
        prompt: `Bạn là ViBai, trợ lý AI thông minh của ứng dụng "Kin Book" — mạng xã hội nhắn tin.

${modePrompt}

Thông tin về ứng dụng Kin Book:
- Nhắn tin với bạn bè (tin nhắn, ảnh, video, tệp)
- Kết bạn (tìm kiếm, gửi/nhận lời mời)
- Nhóm chat (tạo nhóm, thêm/xóa thành viên)
- Phòng gọi (tạo phòng gọi video/audio, mời bạn bè)
- Cài đặt hồ sơ (ảnh đại diện, tên, giới thiệu)
- Chế độ sáng/tối
- Báo cáo vi phạm

Ngữ cảnh hội thoại trước đó:${contextPrompt}

Tin nhắn mới từ người dùng: ${userMsg}

Trả lời bằng tiếng Việt, tự nhiên và hữu ích:`,
      }));

      setThinking(false);

      let fullResponse = '';
      if (typeof response === 'string') {
        fullResponse = response;
      } else if (response && typeof response === 'object') {
        fullResponse = response.response || response.text || response.output || response.result || response.content || '';
      }
      if (!fullResponse) fullResponse = 'Xin lỗi, tôi không hiểu. Hãy hỏi lại.';

      setMessages(prev => [...prev, { role: 'bot', content: fullResponse }]);
      setSending(false);

      incrementUsage().catch(() => {});
    } catch (e) {
      setThinking(false);
      setMessages(prev => [...prev, { role: 'bot', content: `⚠️ Có lỗi xảy ra: ${e?.message || 'Không xác định'}. Vui lòng thử lại.` }]);
      setSending(false);
    }
  };

  useEffect(() => {
    return () => { if (typingTimer.current) clearInterval(typingTimer.current); };
  }, []);

  const submitReport = async () => {
    if (!reportUser.trim() || !reportReason.trim()) return;
    setSending(true);
    try {
      const profiles = await base44.entities.UserProfile.list('-created_date', 500);
      const target = profiles.find(p => p.display_name?.toLowerCase().includes(reportUser.toLowerCase()));
      
      await base44.entities.Report.create({
        reporter_id: currentUserId,
        reporter_name: profile?.display_name,
        reported_user_id: target?.user_id || 'unknown',
        reported_user_name: reportUser,
        reason: reportReason,
        details: reportDetails,
        status: 'pending'
      });

      setMessages(prev => [...prev, { 
        role: 'bot', 
        content: `✅ Báo cáo đã được gửi!\n\n**Người bị báo cáo:** ${reportUser}\n**Lý do:** ${reportReason}\n\nQuản trị viên sẽ xem xét sớm.` 
      }]);
      setShowReport(false);
      setReportUser('');
      setReportReason('');
      setReportDetails('');
    } catch (e) {
      setMessages(prev => [...prev, { role: 'bot', content: 'Có lỗi khi gửi báo cáo.' }]);
    } finally {
      setSending(false);
    }
  };

  const colorClasses = {
    amber: { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500', light: 'bg-amber-50 dark:bg-amber-900/20' },
    blue: { bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500', light: 'bg-blue-50 dark:bg-blue-900/20' },
    red: { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500', light: 'bg-red-50 dark:bg-red-900/20' }
  };

  const dailyLimit = aiSettings?.daily_message_limit || 50;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-blue-500 to-purple-500 text-white">
        <button onClick={onClose} className="md:hidden p-1 hover:bg-white/20 rounded-full">
          <ArrowLeft size={20} />
        </button>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <Bot size={22} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm flex items-center gap-1.5">
            ViBai
            <Sparkles size={12} className="opacity-80" />
          </p>
          <p className="text-xs opacity-80">
            {dailyCount}/{dailyLimit} tin nhắn hôm nay
          </p>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-1.5 p-2.5 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {Object.entries(MODE_CONFIG).map(([key, config]) => {
          const Icon = config.icon;
          const isEnabled = aiSettings ? aiSettings[key + '_enabled'] : true;
          const isActive = mode === key;
          const colors = colorClasses[config.color];
          return (
            <button
              key={key}
              onClick={() => changeMode(key)}
              disabled={!isEnabled}
              className={`flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs font-medium transition-all ${
                isActive 
                  ? `${colors.bg} text-white shadow-md` 
                  : isEnabled
                    ? 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-300 dark:text-gray-600 cursor-not-allowed'
              }`}
            >
              <Icon size={16} />
              {config.label}
            </button>
          );
        })}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'bot' && (
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2 mt-1 shrink-0">
                <Bot size={14} className="text-white" />
              </div>
            )}
            <div className={`max-w-[75%] rounded-2xl px-3 py-2 ${
              msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800'
            }`}>
              {msg.role === 'user' ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <div className="text-sm">
                  {msg.content ? (
                    <ReactMarkdown className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1">
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    <span className="text-gray-400 italic">(không có nội dung)</span>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex justify-start">
            <div className="w-7 h-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center mr-2 shrink-0">
              <Bot size={14} className="text-white" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-400">AI đang suy nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        {limitReached && (
          <div className="text-center py-2">
            <span className="text-xs text-red-500 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-full">
              Đã đạt giới hạn {dailyLimit} tin nhắn AI hôm nay
            </span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Report form */}
      {showReport && (
        <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-t dark:border-gray-700">
          <h4 className="text-sm font-semibold mb-2 dark:text-white flex items-center gap-1"><AlertTriangle size={14} className="text-yellow-500" /> Báo cáo vi phạm</h4>
          <input value={reportUser} onChange={e => setReportUser(e.target.value)} placeholder="Tên người vi phạm" className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none" />
          <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none">
            <option value="">-- Chọn lý do --</option>
            <option value="Quấy rối">Quấy rối</option>
            <option value="Spam">Spam</option>
            <option value="Nội dung không phù hợp">Nội dung không phù hợp</option>
            <option value="Mạo danh">Mạo danh</option>
            <option value="Lý do khác">Lý do khác</option>
          </select>
          <textarea value={reportDetails} onChange={e => setReportDetails(e.target.value)} placeholder="Chi tiết (không bắt buộc)" className="w-full px-3 py-1.5 bg-white dark:bg-gray-800 dark:text-white border dark:border-gray-600 rounded text-sm mb-2 outline-none resize-none" rows={2} />
          <div className="flex gap-2">
            <button onClick={submitReport} disabled={!reportUser || !reportReason || sending} className="px-4 py-1.5 bg-red-500 text-white rounded text-sm disabled:opacity-50">Gửi báo cáo</button>
            <button onClick={() => setShowReport(false)} className="px-4 py-1.5 bg-gray-200 dark:bg-gray-700 dark:text-white rounded text-sm">Hủy</button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-2 border-t dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button onClick={() => setShowReport(!showReport)} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-full shrink-0" title="Báo cáo vi phạm">
            <AlertTriangle size={18} className="text-yellow-500" />
          </button>
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Hỏi ViBai (chế độ ${MODE_CONFIG[mode]?.label})...`}
            className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-full text-sm outline-none"
          />
          <button onClick={sendMessage} disabled={!text.trim() || sending} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full disabled:opacity-40">
            <Send size={18} className={text.trim() ? 'text-blue-500' : 'text-gray-400'} />
          </button>
        </div>
      </div>
    </div>
  );
}
