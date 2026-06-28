import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from '@/components/chat/Avatar';
import { ArrowLeft, Shield, Users, AlertTriangle, Lock, Unlock, Eye, Ban, MessageSquareWarning, Bot } from 'lucide-react';
import AISettingsTab from '@/components/admin/AISettingsTab';
import { Link } from 'react-router-dom';
import moment from 'moment';

export default function AdminPanel() {
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [reports, setReports] = useState([]);
  const [aiSettings, setAiSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [allUsers, allReports, allAISettings] = await Promise.all([
        base44.entities.UserProfile.list('-created_date', 500),
        base44.entities.Report.list('-created_date', 500),
        base44.entities.AISettings.list()
      ]);
      setUsers(allUsers);
      setReports(allReports);
      if (allAISettings.length > 0) {
        setAiSettings(allAISettings[0]);
      } else {
        const created = await base44.entities.AISettings.create({
          fast_enabled: true, deep_enabled: true, direct_enabled: true,
          fast_max_words: 100, analysis_depth: 3, daily_message_limit: 50, total_usage: 0
        });
        setAiSettings(created);
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const warnUser = async (userId, profileId) => {
    const prof = users.find(u => u.id === profileId);
    const newWarnings = (prof?.warnings || 0) + 1;
    await base44.entities.UserProfile.update(profileId, { warnings: newWarnings });
    await base44.entities.Notification.create({
      user_id: userId, type: 'warning', title: 'Cảnh cáo',
      body: `Bạn đã nhận cảnh cáo lần thứ ${newWarnings} do vi phạm quy tắc cộng đồng.`
    });
    if (newWarnings >= 3) {
      await base44.entities.UserProfile.update(profileId, { chat_disabled: true });
      await base44.entities.Notification.create({
        user_id: userId, type: 'ban', title: 'Tạm khóa nhắn tin',
        body: 'Bạn đã bị tạm khóa chức năng nhắn tin do vi phạm nhiều lần.'
      });
    }
    loadData();
  };

  const banUser = async (profileId, type) => {
    const data = { is_banned: true, ban_type: type };
    if (type === 'temporary') {
      data.ban_until = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }
    await base44.entities.UserProfile.update(profileId, data);
    const prof = users.find(u => u.id === profileId);
    await base44.entities.Notification.create({
      user_id: prof?.user_id, type: 'ban', title: type === 'permanent' ? 'Khóa tài khoản vĩnh viễn' : 'Khóa tài khoản tạm thời',
      body: type === 'permanent' ? 'Tài khoản đã bị khóa vĩnh viễn.' : 'Tài khoản đã bị khóa 7 ngày.'
    });
    loadData();
  };

  const unbanUser = async (profileId) => {
    await base44.entities.UserProfile.update(profileId, { 
      is_banned: false, ban_type: 'none', ban_until: null, chat_disabled: false 
    });
    loadData();
  };

  const resolveReport = async (reportId, action) => {
    const report = reports.find(r => r.id === reportId);
    await base44.entities.Report.update(reportId, { status: 'resolved', action_taken: action });
    
    if (action === 'warning' && report) {
      const prof = users.find(u => u.user_id === report.reported_user_id);
      if (prof) await warnUser(report.reported_user_id, prof.id);
    } else if (action === 'temp_ban' && report) {
      const prof = users.find(u => u.user_id === report.reported_user_id);
      if (prof) await banUser(prof.id, 'temporary');
    } else if (action === 'perm_ban' && report) {
      const prof = users.find(u => u.user_id === report.reported_user_id);
      if (prof) await banUser(prof.id, 'permanent');
    }
    loadData();
    setSelectedReport(null);
  };

  const dismissReport = async (reportId) => {
    await base44.entities.Report.update(reportId, { status: 'dismissed', action_taken: 'none' });
    loadData();
    setSelectedReport(null);
  };

  const pendingReports = reports.filter(r => r.status === 'pending' || r.status === 'reviewing');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
          <Link to="/" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft size={20} className="dark:text-gray-300" />
          </Link>
          <Shield size={24} className="text-red-500" />
          <h1 className="font-bold text-lg dark:text-white">Quản trị viên</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
          <button onClick={() => setTab('users')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'users' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>
            <Users size={16} /> Người dùng ({users.length})
          </button>
          <button onClick={() => setTab('reports')} className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium ${tab === 'reports' ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 dark:text-gray-300'}`}>
            <AlertTriangle size={16} /> Báo cáo ({pendingReports.length})
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : tab === 'users' ? (
          <div className="p-4 space-y-2">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <Avatar src={u.avatar_url} name={u.display_name} size={48} isOnline={u.is_online} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm dark:text-white truncate">{u.display_name}</p>
                    {u.is_banned && <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Bị khóa</span>}
                    {u.chat_disabled && <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded">Khóa chat</span>}
                  </div>
                  <p className="text-xs text-gray-500">{u.is_online ? 'Online' : `Hoạt động ${moment(u.last_active).fromNow()}`}</p>
                  {u.warnings > 0 && <p className="text-xs text-orange-500">⚠️ {u.warnings} cảnh cáo</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  {!u.is_banned ? (
                    <>
                      <button onClick={() => warnUser(u.user_id, u.id)} className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg" title="Cảnh cáo">
                        <MessageSquareWarning size={16} className="text-yellow-500" />
                      </button>
                      <button onClick={() => banUser(u.id, 'temporary')} className="p-2 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg" title="Khóa 7 ngày">
                        <Lock size={16} className="text-orange-500" />
                      </button>
                      <button onClick={() => banUser(u.id, 'permanent')} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg" title="Khóa vĩnh viễn">
                        <Ban size={16} className="text-red-500" />
                      </button>
                    </>
                  ) : (
                    <button onClick={() => unbanUser(u.id)} className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg" title="Mở khóa">
                      <Unlock size={16} className="text-green-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : tab === 'ai' ? (
          <AISettingsTab aiSettings={aiSettings} setAiSettings={setAiSettings} />
        ) : (
          <div className="p-4 space-y-2">
            {reports.length === 0 ? (
              <p className="text-center py-12 text-gray-500 text-sm">Không có báo cáo nào</p>
            ) : reports.map(r => (
              <div key={r.id} className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        r.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                        r.status === 'resolved' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>{
                        r.status === 'pending' ? 'Chờ xử lý' :
                        r.status === 'resolved' ? 'Đã xử lý' : 'Đã bỏ qua'
                      }</span>
                      <span className="text-xs text-gray-400">{moment(r.created_date).fromNow()}</span>
                    </div>
                    <p className="text-sm dark:text-white"><strong>{r.reporter_name}</strong> báo cáo <strong>{r.reported_user_name}</strong></p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Lý do: {r.reason}</p>
                    {r.details && <p className="text-xs text-gray-500 mt-1">{r.details}</p>}
                    {r.action_taken && r.action_taken !== 'none' && (
                      <p className="text-xs text-blue-500 mt-1">Hành động: {
                        r.action_taken === 'warning' ? 'Cảnh cáo' :
                        r.action_taken === 'chat_disabled' ? 'Khóa chat' :
                        r.action_taken === 'temp_ban' ? 'Khóa tạm thời' :
                        r.action_taken === 'perm_ban' ? 'Khóa vĩnh viễn' : r.action_taken
                      }</p>
                    )}
                  </div>
                </div>
                {(r.status === 'pending' || r.status === 'reviewing') && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => resolveReport(r.id, 'warning')} className="px-3 py-1.5 bg-yellow-500 text-white text-xs rounded-lg">Cảnh cáo</button>
                    <button onClick={() => resolveReport(r.id, 'temp_ban')} className="px-3 py-1.5 bg-orange-500 text-white text-xs rounded-lg">Khóa 7 ngày</button>
                    <button onClick={() => resolveReport(r.id, 'perm_ban')} className="px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg">Khóa vĩnh viễn</button>
                    <button onClick={() => dismissReport(r.id)} className="px-3 py-1.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-lg">Bỏ qua</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
