import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { ArrowLeft, Bell, CheckCheck } from 'lucide-react';
import moment from 'moment';

export default function NotificationsPanel({ currentUserId, onClose }) {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const all = await base44.entities.Notification.filter({ user_id: currentUserId }, '-created_date', 100);
      setNotifs(all);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const unsub = base44.entities.Notification.subscribe(() => load());
    return () => unsub();
  }, []);

  const markRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    load();
  };

  const markAllRead = async () => {
    const unread = notifs.filter(n => !n.is_read);
    for (const n of unread) {
      await base44.entities.Notification.update(n.id, { is_read: true });
    }
    load();
  };

  const typeIcon = {
    message: '💬', friend_request: '👤', friend_accepted: '🤝', 
    group_added: '👥', group_removed: '👥', warning: '⚠️', ban: '🚫', system: '🔔'
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="md:hidden p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft size={20} className="dark:text-gray-300" />
          </button>
          <h2 className="font-bold text-lg dark:text-white">Thông báo</h2>
        </div>
        <button onClick={markAllRead} className="flex items-center gap-1 text-blue-500 text-sm hover:underline">
          <CheckCheck size={14} /> Đọc tất cả
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifs.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Bell size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Chưa có thông báo</p>
          </div>
        ) : (
          notifs.map(n => (
            <button
              key={n.id}
              onClick={() => markRead(n.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${!n.is_read ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
            >
              {n.from_user_avatar ? (
                <Avatar src={n.from_user_avatar} name={n.from_user_name} size={44} />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xl shrink-0">
                  {typeIcon[n.type] || '🔔'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm dark:text-white">
                  <span className="font-semibold">{n.title}</span>
                </p>
                {n.body && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{n.body}</p>}
                <p className="text-xs text-gray-400 mt-1">{moment(n.created_date).fromNow()}</p>
              </div>
              {!n.is_read && <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-2 shrink-0" />}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
