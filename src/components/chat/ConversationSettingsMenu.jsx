import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { MoreVertical, Info, BellOff, Bell, Flag, Trash2, X } from 'lucide-react';

export default function ConversationSettingsMenu({ conversation, currentUserId, profile, onViewInfo, onDeleted }) {
  const [open, setOpen] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [muted, setMuted] = useState(conversation.muted || false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    setMuted(conversation.muted || false);
  }, [conversation.id, conversation.muted]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMute = async () => {
    const newVal = !muted;
    setMuted(newVal);
    await base44.entities.Conversation.update(conversation.id, { muted: newVal });
    setOpen(false);
  };

  const submitReport = async () => {
    if (!reportReason) return;
    setSubmitting(true);
    try {
      const isGroup = conversation.type === 'group';
      const otherIdx = conversation.participant_ids?.findIndex(id => id !== currentUserId);
      const otherId = isGroup ? '' : conversation.participant_ids?.[otherIdx];
      const otherName = isGroup ? conversation.name : conversation.participant_names?.[otherIdx];

      await base44.entities.Report.create({
        reporter_id: currentUserId,
        reporter_name: profile?.display_name,
        reported_user_id: otherId || '',
        reported_user_name: otherName || '',
        reason: reportReason,
        details: reportDetails,
        status: 'pending',
        action_taken: 'none'
      });

      const admins = await base44.entities.User.list();
      for (const admin of (admins || []).filter(u => u.role === 'admin' && u.id !== currentUserId)) {
        await base44.entities.Notification.create({
          user_id: admin.id,
          type: 'system',
          title: 'Báo cáo mới',
          body: `${profile?.display_name} đã báo cáo ${otherName || 'người dùng'} vì: ${reportReason}`,
          from_user_name: profile?.display_name
        });
      }
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
    setShowReport(false);
    setReportReason('');
    setReportDetails('');
    setOpen(false);
  };

  const deleteConversation = async () => {
    if (!confirm('Xóa đoạn chat này? Toàn bộ tin nhắn sẽ bị xóa vĩnh viễn.')) return;
    setOpen(false);
    try {
      await base44.entities.Message.deleteMany({ conversation_id: conversation.id });
      await base44.entities.Conversation.delete(conversation.id);
    } catch (e) {
      console.error(e);
    }
    if (onDeleted) onDeleted();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
      >
        <MoreVertical size={18} className="text-blue-500" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 py-1 min-w-[200px] overflow-hidden">
          <button
            onClick={() => { onViewInfo(); setOpen(false); }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            <Info size={16} className="text-blue-500" /> Xem thông tin
          </button>
          <button
            onClick={toggleMute}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
          >
            {muted ? <BellOff size={16} className="text-gray-500" /> : <Bell size={16} className="text-blue-500" />}
            {muted ? 'Bật thông báo' : 'Tắt thông báo'}
          </button>
          {conversation.type === 'direct' && (
            <button
              onClick={() => { setShowReport(true); setOpen(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white transition-colors"
            >
              <Flag size={16} className="text-orange-500" /> Báo cáo
            </button>
          )}
          <div className="my-1 border-t dark:border-gray-700" />
          <button
            onClick={deleteConversation}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 transition-colors"
          >
            <Trash2 size={16} /> Xóa đoạn chat
          </button>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg dark:text-white">Báo cáo người dùng</h3>
              <button onClick={() => setShowReport(false)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                <X size={20} className="dark:text-gray-300" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">Lý do báo cáo</label>
                <select
                  value={reportReason}
                  onChange={e => setReportReason(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border dark:border-gray-600 rounded-lg text-sm outline-none"
                >
                  <option value="">Chọn lý do...</option>
                  <option value="Spam">Tin nhắn rác (Spam)</option>
                  <option value="Harassment">Quấy rối, bắt nạt</option>
                  <option value="Hate speech">Phát ngôn thù địch</option>
                  <option value="Inappropriate content">Nội dung không phù hợp</option>
                  <option value="Scam">Lừa đảo</option>
                  <option value="Other">Khác</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium dark:text-gray-300 mb-1.5 block">Chi tiết (không bắt buộc)</label>
                <textarea
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  placeholder="Mô tả chi tiết vấn đề..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-700 dark:text-white border dark:border-gray-600 rounded-lg text-sm outline-none resize-none"
                />
              </div>
              <button
                onClick={submitReport}
                disabled={!reportReason || submitting}
                className="w-full py-2.5 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
              >
                {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
