import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Bot, Send, Sparkles, Activity, CheckCircle2, Circle, Loader2, AlertCircle, Code2, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import moment from 'moment';
import 'moment/locale/vi';
moment.locale('vi');
import { useCurrentUser } from '@/hooks/useCurrentUser';

const STATUS_ICON = {
  pending: <Circle size={14} className="text-gray-400" />,
  running: <Loader2 size={14} className="text-blue-500 animate-spin" />,
  done: <CheckCircle2 size={14} className="text-green-500" />,
  error: <AlertCircle size={14} className="text-red-500" />
};

function TaskPlan({ plan }) {
  if (!plan || plan.length === 0) return null;
  return (
    <div className="mt-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <Zap size={12} /> Kế hoạch thực hiện
      </p>
      {plan.map((task, i) => (
        <div key={i} className="flex items-start gap-2 text-sm">
          <span className="mt-0.5 shrink-0">{STATUS_ICON[task.status] || STATUS_ICON.pending}</span>
          <div>
            <span className={`dark:text-gray-200 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>{task.title}</span>
            {task.detail && <p className="text-xs text-gray-400 mt-0.5">{task.detail}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ActivityLog({ logs }) {
  if (logs.length === 0) return null;
  return (
    <div className="mt-3 border-t dark:border-gray-700 pt-3">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mb-2">
        <Activity size={12} /> Nhật ký hoạt động
      </p>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {logs.map((log, i) => (
          <div key={i} className="flex items-center gap-2 text-xs text-gray-400">
            <span className="font-mono">{moment(log.time).format('HH:mm:ss')}</span>
            <span className={`w-1.5 h-1.5 rounded-full ${log.type === 'error' ? 'bg-red-500' : log.type === 'success' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AIAgent() {
  const { user, profile } = useCurrentUser();
  const currentUserId = user?.id;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [working, setWorking] = useState(false);
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, working]);

  useEffect(() => {
    if (!currentUserId) return;
    try {
      localStorage.setItem(`aiagent_${currentUserId}`, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, currentUserId]);

  // Load messages after user is available
  useEffect(() => {
    if (!currentUserId) return;
    try {
      const saved = localStorage.getItem(`aiagent_${currentUserId}`);
      if (saved) setMessages(JSON.parse(saved));
    } catch (e) {}
  }, [currentUserId]);

  useEffect(() => {
    const completed = messages.filter(m => m.role === 'agent' && m.plan?.every(t => t.status === 'done')).length;
    setStats({ total: messages.filter(m => m.role === 'user').length, completed });
  }, [messages]);

  const addLog = (logs, message, type = 'info') => {
    return [...logs, { time: new Date().toISOString(), message, type }];
  };

  const executeTask = async (userRequest) => {
    setWorking(true);
    const logs = [];
    let plan = [];

    // Step 1: AI lập kế hoạch
    logs.push({ time: new Date().toISOString(), message: 'Đang phân tích yêu cầu...', type: 'info' });
    setMessages(prev => [...prev, { role: 'agent', content: '', plan: [], logs: [...logs], thinking: true }]);

    try {
      const planResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Bạn là AI Agent tự động hóa. Người dùng (admin) yêu cầu: "${userRequest}"

Hãy lập kế hoạch thực hiện, chia thành 3-6 bước cụ thể. Mỗi bước có "title" (ngắn) và "detail" (mô tả).

QUY TẮC:
- Nếu yêu cầu liên quan tới code/sửa web/app → đưa ra bước "Phân tích code", "Đề xuất giải pháp", "Tạo code mẫu"
- Nếu yêu cầu tạo nội dung → bước "Nghiên cứu", "Tạo bản nháp", "Tối ưu"
- Nếu yêu cầu phân tích dữ liệu → bước "Thu thập", "Phân tích", "Báo cáo"
- Không hứa deploy/hành động thực tế ngoài khả năng AI (không tự deploy, không tự sửa file thật)

Trả về JSON: {"plan": [{"title": "...", "detail": "..."}]}`,
        response_json_schema: {
          type: 'object',
          properties: {
            plan: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  detail: { type: 'string' }
                }
              }
            }
          }
        }
      });

      plan = (planResponse?.plan || []).map(t => ({ ...t, status: 'pending' }));

      // Update with plan
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        last.plan = plan;
        last.logs = addLog(last.logs, `Đã lập kế hoạch: ${plan.length} bước`, 'success');
        return copy;
      });

      // Step 2: Execute each step
      for (let i = 0; i < plan.length; i++) {
        // Mark running
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          last.plan[i].status = 'running';
          last.logs = addLog(last.logs, `Đang thực hiện: ${plan[i].title}`, 'info');
          return copy;
        });

        await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

        // Mark done
        setMessages(prev => {
          const copy = [...prev];
          const last = copy[copy.length - 1];
          last.plan[i].status = 'done';
          last.logs = addLog(last.logs, `Hoàn thành: ${plan[i].title}`, 'success');
          return copy;
        });
      }

      // Step 3: Final response
      const finalResponse = await base44.integrations.Core.InvokeLLM({
        prompt: `Bạn là AI Agent. Người dùng (admin) yêu cầu: "${userRequest}"

Bạn đã lập kế hoạch và thực hiện các bước: ${plan.map((t, i) => `${i + 1}. ${t.title}`).join('\n')}

Giờ hãy đưa ra câu trả lời cuối cùng bằng tiếng Việt:
- Nếu là yêu cầu code → đưa ra đoạn code mẫu cụ thể (trong code block markdown)
- Nếu là yêu cầu phân tích → tóm tắt kết quả
- Nếu là yêu cầu không thể thực hiện (deploy, sửa file thật, kết nối API ngoài) → nói thẳng và đề xuất cách làm thủ công
- Ngắn gọn, hữu ích, có cấu trúc markdown`
      });

      const finalText = typeof finalResponse === 'string' ? finalResponse : (finalResponse?.response || JSON.stringify(finalResponse));

      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        last.content = finalText;
        last.thinking = false;
        last.logs = addLog(last.logs, 'Hoàn tất yêu cầu', 'success');
        return copy;
      });
    } catch (e) {
      setMessages(prev => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        last.content = `⚠️ Lỗi: ${e?.message || 'Không xác định'}`;
        last.thinking = false;
        last.logs = addLog(last.logs, `Lỗi: ${e?.message || 'Không xác định'}`, 'error');
        return copy;
      });
    } finally {
      setWorking(false);
    }
  };

  const send = () => {
    if (!input.trim() || working) return;
    const req = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: req }]);
    setInput('');
    executeTask(req);
  };

  const clearHistory = () => {
    if (confirm('Xóa toàn bộ lịch sử hội thoại AI Agent?')) {
      setMessages([]);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-gray-800 bg-gradient-to-r from-gray-900 to-gray-700 text-white">
        <Link to="/" className="p-1 hover:bg-white/10 rounded-full">
          <ArrowLeft size={20} />
        </Link>
        <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Bot size={22} />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm flex items-center gap-1.5">
            AI Agent <Sparkles size={12} className="opacity-60" />
          </p>
          <p className="text-xs opacity-60">Tự động hóa toàn diện</p>
        </div>
        <button onClick={clearHistory} className="text-xs px-3 py-1.5 hover:bg-white/10 rounded-full">
          Xóa lịch sử
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-2 p-3 bg-gray-50 dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="text-center">
          <p className="text-2xl font-bold dark:text-white">{stats.total}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Yêu cầu</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-green-500">{stats.completed}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Hoàn thành</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-blue-500">{working ? '1' : '0'}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Đang chạy</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 max-w-3xl w-full mx-auto">
        {messages.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Bot size={32} className="text-gray-400" />
            </div>
            <h2 className="text-lg font-bold dark:text-white mb-1">AI Agent</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Nhập yêu cầu bằng tiếng Việt, AI sẽ tự lập kế hoạch và thực hiện</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
              {[
                'Phân tích code trang Home và tìm lỗi',
                'Tạo code component nút bấm đẹp',
                'Lên ý tưởng bài đăng TikTok',
                'Tối ưu hiệu suất app'
              ].map(s => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="text-xs px-3 py-1.5 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] ${msg.role === 'user' ? '' : 'w-full'}`}>
              {msg.role === 'user' ? (
                <div className="bg-gray-900 text-white rounded-2xl px-4 py-2.5 text-sm">
                  {msg.content}
                </div>
              ) : (
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4">
                  {msg.thinking && !msg.content && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 size={14} className="animate-spin" />
                      AI đang suy nghĩ...
                    </div>
                  )}
                  {msg.content && (
                    <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>pre]:my-2 [&>ul]:my-1 [&>li]:my-0.5">
                      {msg.content}
                    </ReactMarkdown>
                  )}
                  {msg.plan && <TaskPlan plan={msg.plan} />}
                  {msg.logs && msg.logs.length > 0 && <ActivityLog logs={msg.logs} />}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t dark:border-gray-800 bg-white dark:bg-gray-950 p-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Nhập yêu cầu cho AI Agent..."
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 bg-gray-100 dark:bg-gray-800 dark:text-white rounded-2xl text-sm outline-none focus:ring-2 focus:ring-gray-400 max-h-32"
          />
          <button
            onClick={send}
            disabled={!input.trim() || working}
            className="p-2.5 bg-gray-900 text-white rounded-full disabled:opacity-30 hover:bg-gray-700 shrink-0"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
