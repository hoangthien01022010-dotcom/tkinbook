import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Download, Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import JSZip from 'jszip';

const ENTITIES = [
  { name: 'UserProfile', label: 'Hồ sơ người dùng' },
  { name: 'Conversation', label: 'Cuộc trò chuyện' },
  { name: 'Message', label: 'Tin nhắn' },
  { name: 'Notification', label: 'Thông báo' },
  { name: 'Friendship', label: 'Kết bạn' },
  { name: 'Report', label: 'Báo cáo' },
  { name: 'CallRoom', label: 'Phòng gọi' },
  { name: 'AISettings', label: 'Cài đặt AI' },
];

export default function Backup() {
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState({});
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const downloadAll = async () => {
    setDownloading(true);
    setError('');
    setDone(false);
    setProgress({});

    const zip = new JSZip();
    const backupTime = new Date().toISOString();
    const manifest = { backup_time: backupTime, entities: {} };

    for (const ent of ENTITIES) {
      setProgress(p => ({ ...p, [ent.name]: 'loading' }));
      try {
        const records = await base44.entities[ent.name].list('-created_date', 5000);
        const data = records.map(({ id, created_date, updated_date, created_by_id, ...rest }) => ({
          id, created_date, updated_date, ...rest
        }));
        zip.file(`${ent.name}.json`, JSON.stringify(data, null, 2));
        manifest.entities[ent.name] = data.length;
        setProgress(p => ({ ...p, [ent.name]: data.length }));
      } catch (e) {
        setProgress(p => ({ ...p, [ent.name]: 'error' }));
        manifest.entities[ent.name] = `Lỗi: ${e?.message || 'không xác định'}`;
      }
    }

    zip.file('manifest.json', JSON.stringify(manifest, null, 2));

    try {
      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kinbook-backup-${backupTime.split('T')[0]}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } catch (e) {
      setError(`Không thể tạo file ZIP: ${e?.message || 'lỗi không xác định'}`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-900 border-b dark:border-gray-700">
          <Link to="/" className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
            <ArrowLeft size={20} className="dark:text-gray-300" />
          </Link>
          <Database size={22} className="text-blue-500" />
          <div>
            <h1 className="font-bold text-lg dark:text-white">Tải dữ liệu backup</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tải toàn bộ dữ liệu web dưới dạng ZIP</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border dark:border-gray-700">
            <h2 className="font-semibold dark:text-white mb-2">Sao lưu dữ liệu</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Bấm nút bên dưới để tải xuống tất cả dữ liệu của ứng dụng (hồ sơ người dùng, tin nhắn, cuộc trò chuyện, v.v.) dưới dạng file ZIP. Mỗi entity sẽ được lưu thành file JSON riêng biệt.
            </p>

            <button
              onClick={downloadAll}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {downloading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang tạo file ZIP...
                </>
              ) : (
                <>
                  <Download size={18} />
                  Tải ZIP toàn bộ dữ liệu
                </>
              )}
            </button>

            {error && (
              <div className="mt-3 flex items-center gap-2 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            {done && (
              <div className="mt-3 flex items-center gap-2 text-sm text-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <CheckCircle2 size={16} />
                Đã tải file ZIP thành công!
              </div>
            )}
          </div>

          {/* Progress */}
          {downloading && (
            <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border dark:border-gray-700">
              <p className="text-sm font-medium dark:text-white mb-3">Tiến độ tải dữ liệu</p>
              <div className="space-y-2">
                {ENTITIES.map(ent => {
                  const status = progress[ent.name];
                  return (
                    <div key={ent.name} className="flex items-center justify-between text-sm">
                      <span className="dark:text-gray-300">{ent.label}</span>
                      <span className="flex items-center gap-1.5">
                        {status === 'loading' && <Loader2 size={14} className="animate-spin text-blue-500" />}
                        {status === 'error' && <AlertCircle size={14} className="text-red-500" />}
                        {typeof status === 'number' && <CheckCircle2 size={14} className="text-green-500" />}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {status === 'loading' ? 'Đang tải...' : status === 'error' ? 'Lỗi' : typeof status === 'number' ? `${status} bản ghi` : 'Đang chờ...'}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
