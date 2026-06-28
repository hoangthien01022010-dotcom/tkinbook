import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import Avatar from './Avatar';
import { MoreHorizontal, Trash2, RotateCcw, Download, Check, CheckCheck } from 'lucide-react';
import moment from 'moment';

export default function MessageBubble({ message, isOwn, showAvatar, currentUserId, participantCount }) {
  const [showMenu, setShowMenu] = useState(false);
  const [imgPreview, setImgPreview] = useState(false);

  const handleRecall = async () => {
    await base44.entities.Message.update(message.id, { 
      is_recalled: true, 
      recalled_at: new Date().toISOString(),
      content: '' 
    });
    setShowMenu(false);
  };

  const handleDelete = async () => {
    await base44.entities.Message.update(message.id, {
      deleted_by: [...(message.deleted_by || []), currentUserId]
    });
    setShowMenu(false);
  };

  if (message.is_recalled) {
    return (
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1`}>
        <div className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 italic text-sm">
          Tin nhắn đã được thu hồi
        </div>
      </div>
    );
  }

  if (message.type === 'system') {
    return (
      <div className="text-center py-2">
        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </div>
    );
  }

  const isRead = message.read_by?.length > 1 || (participantCount <= 2 && message.read_by?.some(id => id !== message.sender_id));

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group mb-0.5 ${showAvatar ? 'mt-2' : ''}`}>
        {!isOwn && showAvatar && (
          <Avatar src={message.sender_avatar} name={message.sender_name} size={28} className="mr-2 mt-auto" />
        )}
        {!isOwn && !showAvatar && <div className="w-[28px] mr-2" />}
        
        <div className="relative max-w-[70%]">
          {!isOwn && showAvatar && message.sender_name && (
            <p className="text-xs text-gray-500 dark:text-gray-400 ml-3 mb-0.5">{message.sender_name}</p>
          )}
          
          <div className="flex items-center gap-1">
            {isOwn && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-opacity"
              >
                <MoreHorizontal size={14} className="text-gray-400" />
              </button>
            )}
            
            <div className={`
              rounded-2xl overflow-hidden
              ${isOwn 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
              }
              ${message.type === 'image' || message.type === 'video' ? 'p-0.5' : 'px-3 py-2'}
            `}>
              {message.type === 'text' && (
                <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
              )}
              {message.type === 'image' && message.file_url && (
                <img 
                  src={message.file_url} 
                  alt="ảnh" 
                  className="max-w-[250px] rounded-2xl cursor-pointer"
                  onClick={() => setImgPreview(true)}
                />
              )}
              {message.type === 'video' && message.file_url && (
                <video src={message.file_url} controls className="max-w-[250px] rounded-2xl" />
              )}
              {message.type === 'file' && message.file_url && (
                <a 
                  href={message.file_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm underline"
                >
                  <Download size={14} />
                  {message.file_name || 'Tải tệp'}
                </a>
              )}
            </div>

            {!isOwn && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-opacity"
              >
                <MoreHorizontal size={14} className="text-gray-400" />
              </button>
            )}
          </div>

          {/* Time & read status */}
          <div className={`flex items-center gap-1 mt-0.5 ${isOwn ? 'justify-end' : 'justify-start'} px-2`}>
            <span className="text-[10px] text-gray-400">{moment(message.created_date).utcOffset(420).format('HH:mm')}</span>
            {isOwn && (
              isRead 
                ? <CheckCheck size={12} className="text-blue-400" />
                : <Check size={12} className="text-gray-400" />
            )}
          </div>

          {/* Context menu */}
          {showMenu && (
            <div className={`absolute z-50 ${isOwn ? 'right-0' : 'left-0'} top-full mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border dark:border-gray-700 py-1 min-w-[140px]`}>
              {isOwn && (
                <button onClick={handleRecall} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                  <RotateCcw size={14} /> Thu hồi
                </button>
              )}
              <button onClick={handleDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-red-500">
                <Trash2 size={14} /> Xóa phía bạn
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Image preview modal */}
      {imgPreview && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={() => setImgPreview(false)}>
          <img src={message.file_url} alt="preview" className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </>
  );
}
