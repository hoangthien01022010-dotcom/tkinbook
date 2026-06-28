import React from 'react';

export default function Avatar({ src, name, size = 40, isOnline, className = '' }) {
  const initials = (name || '?').charAt(0).toUpperCase();
  const colors = ['#6366f1','#8b5cf6','#ec4899','#f43f5e','#f97316','#14b8a6','#06b6d4','#3b82f6'];
  const colorIdx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {src ? (
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <div 
          className="w-full h-full rounded-full flex items-center justify-center text-white font-semibold"
          style={{ backgroundColor: colors[colorIdx], fontSize: size * 0.4 }}
        >
          {initials}
        </div>
      )}
      {typeof isOnline === 'boolean' && (
        <span 
          className={`absolute bottom-0 right-0 rounded-full border-2 border-white dark:border-gray-800 ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}
          style={{ width: size * 0.28, height: size * 0.28 }}
        />
      )}
    </div>
  );
}
