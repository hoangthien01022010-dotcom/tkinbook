import React from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, Brain, Swords, BarChart3 } from 'lucide-react';

export default function AISettingsTab({ aiSettings, setAiSettings }) {
  if (!aiSettings) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const modes = [
    { key: 'fast_enabled', label: 'Nhanh', icon: Zap, color: 'text-amber-500', desc: 'Trả lời ngắn gọn, đi thẳng vấn đề' },
    { key: 'deep_enabled', label: 'Phân tích', icon: Brain, color: 'text-blue-500', desc: 'Chi tiết, so sánh nhiều góc nhìn' },
    { key: 'direct_enabled', label: 'Thẳng', icon: Swords, color: 'text-red-500', desc: 'Trực tiếp, chỉ ra sai lầm' }
  ];

  const sliders = [
    { field: 'fast_max_words', label: 'Độ dài phản hồi (Nhanh)', unit: 'từ', min: 30, max: 300, step: 10 },
    { field: 'analysis_depth', label: 'Mức độ phân tích', unit: '/5', min: 1, max: 5, step: 1 },
    { field: 'daily_message_limit', label: 'Giới hạn tin nhắn/ngày', unit: '', min: 5, max: 200, step: 5 }
  ];

  return (
    <div className="p-4 space-y-3">
      {/* Stats */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
        <h3 className="font-semibold text-sm dark:text-white mb-3 flex items-center gap-2">
          <BarChart3 size={16} className="text-blue-500" /> Thống kê sử dụng
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-blue-500">{aiSettings.total_usage || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tổng lượt sử dụng</p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-purple-500">{aiSettings.daily_message_limit || 50}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Giới hạn/ngày</p>
          </div>
        </div>
      </div>

      {/* Mode toggles */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm space-y-3">
        <h3 className="font-semibold text-sm dark:text-white mb-2">Chế độ AI</h3>
        {modes.map(item => {
          const Icon = item.icon;
          const enabled = aiSettings[item.key];
          return (
            <div key={item.key} className="flex items-center justify-between py-2 border-b dark:border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <Icon size={18} className={item.color} />
                <div>
                  <p className="text-sm font-medium dark:text-white">{item.label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const updated = await base44.entities.AISettings.update(aiSettings.id, { [item.key]: !enabled });
                  setAiSettings(updated);
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${enabled ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Sliders */}
      <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm space-y-4">
        <h3 className="font-semibold text-sm dark:text-white">Cài đặt chi tiết</h3>
        {sliders.map(s => (
          <div key={s.field}>
            <label className="text-sm dark:text-gray-300 flex items-center justify-between mb-1">
              <span>{s.label}</span>
              <span className="font-mono text-blue-500">{aiSettings[s.field]}{s.unit}</span>
            </label>
            <input
              type="range" min={s.min} max={s.max} step={s.step}
              defaultValue={aiSettings[s.field]}
              onChange={async (e) => {
                const updated = await base44.entities.AISettings.update(aiSettings.id, { [s.field]: parseInt(e.target.value) });
                setAiSettings(updated);
              }}
              className="w-full accent-blue-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
