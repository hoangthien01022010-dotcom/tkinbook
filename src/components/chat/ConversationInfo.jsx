import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { X, UserPlus, UserMinus, Edit3, Camera, AlertTriangle, Shield } from 'lucide-react';

export default function ConversationInfo({ conversation, currentUserId, profile, profiles, onClose, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState(conversation.name || '');
  const [showAddMember, setShowAddMember] = useState(false);
  const [friends, setFriends] = useState([]);
  const [saving, setSaving] = useState(false);

  const isGroup = conversation.type === 'group';
  const isAdmin = conversation.admin_id === currentUserId;

  useEffect(() => {
    if (showAddMember) {
      base44.entities.Friendship.filter({ status: 'accepted' }).then(all => {
        setFriends(all.filter(f => 
          (f.requester_id === currentUserId || f.receiver_id === currentUserId) &&
          !conversation.participant_ids?.includes(f.requester_id === currentUserId ? f.receiver_id : f.requester_id)
        ));
      });
    }
  }, [showAddMember]);

  const updateGroupName = async () => {
    setSaving(true);
    await base44.entities.Conversation.update(conversation.id, { name: newName });
    await base44.entities.Message.create({
      conversation_id: conversation.id, sender_id: currentUserId, sender_name: 'Hệ thống',
      content: `${profile?.display_name} đã đổi tên nhóm thành "${newName}"`,
      type: 'system', read_by: [], deleted_by: []
    });
    setEditing(false);
    setSaving(false);
    onUpdated();
  };

  const updateGroupAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await base44.entities.Conversation.update(conversation.id, { avatar_url: file_url });
    onUpdated();
  };

  const addMember = async (userId) => {
    const p = profiles[userId];
    const newIds = [...(conversation.participant_ids || []), userId];
    const newNames = [...(conversation.participant_names || []), p?.display_name || 'Người dùng'];
    await base44.entities.Conversation.update(conversation.id, { 
      participant_ids: newIds, participant_names: newNames 
    });
    await base44.entities.Message.create({
      conversation_id: conversation.id, sender_id: currentUserId, sender_name: 'Hệ thống',
      content: `${profile?.display_name} đã thêm ${p?.display_name} vào nhóm`,
      type: 'system', read_by: [], deleted_by: []
    });
    await base44.entities.Notification.create({
      user_id: userId, type: 'group_added', title: 'Được thêm vào nhóm',
      body: `${profile?.display_name} đã thêm bạn vào nhóm "${conversation.name}"`,
      related_id: conversation.id, from_user_name: profile?.display_name
    });
    setShowAddMember(false);
    onUpdated();
  };

  const removeMember = async (userId) => {
    const p = profiles[userId];
    const newIds = conversation.participant_ids?.filter(id => id !== userId) || [];
    const newNames = conversation.participant_names?.filter((_, i) => conversation.participant_ids?.[i] !== userId) || [];
    await base44.entities.Conversation.update(conversation.id, { participant_ids: newIds, participant_names: newNames });
    await base44.entities.Message.create({
      conversation_id: conversation.id, sender_id: currentUserId, sender_name: 'Hệ thống',
      content: `${profile?.display_name} đã xóa ${p?.display_name} khỏi nhóm`,
      type: 'system', read_by: [], deleted_by: []
    });
    onUpdated();
  };

  const otherProfile = () => {
    if (!isGroup) {
      const oid = conversation.participant_ids?.find(id => id !== currentUserId);
      return profiles[oid];
    }
    return null;
  };

  const op = otherProfile();

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={onClose}>
      <div className="bg-white dark:bg-gray-900 w-full max-w-sm h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h2 className="font-bold dark:text-white">{isGroup ? 'Thông tin nhóm' : 'Thông tin'}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <X size={20} className="dark:text-gray-300" />
          </button>
        </div>

        <div className="p-6 text-center">
          <div className="relative inline-block">
            <Avatar 
              src={isGroup ? conversation.avatar_url : op?.avatar_url} 
              name={isGroup ? conversation.name : op?.display_name} 
              size={80} 
            />
            {isGroup && isAdmin && (
              <label className="absolute bottom-0 right-0 p-1 bg-gray-200 dark:bg-gray-700 rounded-full cursor-pointer">
                <Camera size={14} />
                <input type="file" accept="image/*" className="hidden" onChange={updateGroupAvatar} />
              </label>
            )}
          </div>
          
          {isGroup ? (
            <div className="mt-3">
              {editing ? (
                <div className="flex items-center gap-2 justify-center">
                  <input value={newName} onChange={e => setNewName(e.target.value)} className="px-3 py-1 border dark:border-gray-600 dark:bg-gray-800 dark:text-white rounded text-sm" />
                  <button onClick={updateGroupName} disabled={saving} className="text-blue-500 text-sm font-medium">Lưu</button>
                  <button onClick={() => setEditing(false)} className="text-gray-500 text-sm">Hủy</button>
                </div>
              ) : (
                <div className="flex items-center gap-2 justify-center">
                  <h3 className="font-bold text-lg dark:text-white">{conversation.name}</h3>
                  {isAdmin && (
                    <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded">
                      <Edit3 size={14} className="text-gray-400" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="mt-3">
              <h3 className="font-bold text-lg dark:text-white">{op?.display_name}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {op?.is_online ? 'Đang hoạt động' : 'Ngoại tuyến'}
              </p>
            </div>
          )}
        </div>

        {isGroup && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-sm dark:text-white">Thành viên ({conversation.participant_ids?.length})</h4>
              {isAdmin && (
                <button onClick={() => setShowAddMember(!showAddMember)} className="flex items-center gap-1 text-blue-500 text-sm">
                  <UserPlus size={14} /> Thêm
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="mb-3 bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                {friends.length === 0 ? (
                  <p className="text-sm text-gray-500 py-2 text-center">Không có bạn bè để thêm</p>
                ) : friends.map(f => {
                  const fid = f.requester_id === currentUserId ? f.receiver_id : f.requester_id;
                  const p = profiles[fid];
                  return (
                    <button key={f.id} onClick={() => addMember(fid)} className="w-full flex items-center gap-2 px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      <Avatar src={p?.avatar_url} name={p?.display_name} size={32} />
                      <span className="text-sm dark:text-white">{p?.display_name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {conversation.participant_ids?.map(uid => {
              const p = profiles[uid];
              const isAdminMember = uid === conversation.admin_id;
              return (
                <div key={uid} className="flex items-center gap-3 py-2">
                  <Avatar src={p?.avatar_url} name={p?.display_name} size={36} isOnline={p?.is_online} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate dark:text-white">{p?.display_name || 'Người dùng'}</p>
                    {isAdminMember && <p className="text-xs text-blue-500">Trưởng nhóm</p>}
                  </div>
                  {isAdmin && !isAdminMember && (
                    <button onClick={() => removeMember(uid)} className="p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded text-red-500">
                      <UserMinus size={16} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
