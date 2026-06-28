import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { MessageCircle, Users, Video, Shield, Download, LogIn, Bot, Smartphone, Zap, Lock } from 'lucide-react';

export default function Welcome() {
  const features = [
    { icon: MessageCircle, title: 'Nhắn tin thời gian thực', desc: 'Gửi tin nhắn, ảnh, video, tệp tin tức thì với bạn bè' },
    { icon: Video, title: 'Phòng gọi riêng', desc: 'Tạo phòng gọi video/audio, mời bạn bè vào phòng' },
    { icon: Users, title: 'Nhóm chat', desc: 'Tạo nhóm, thêm/xóa thành viên, quản lý dễ dàng' },
    { icon: Bot, title: 'Trợ lý AI Kin', desc: 'Hỏi đáp, hướng dẫn sử dụng, báo cáo vi phạm' },
    { icon: Shield, title: 'An toàn & riêng tư', desc: 'Bảo vệ dữ liệu, kiểm duyệt nội dung vi phạm' },
    { icon: Lock, title: 'Dark Mode', desc: 'Giao diện sáng/tối, bảo vệ mắt ban đêm' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/80 dark:bg-gray-900/80 border-b dark:border-gray-800">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle size={20} className="text-white" />
            </div>
            <span className="font-bold text-lg dark:text-white">Kin Book</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" className="text-sm">Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button className="text-sm">Đăng ký</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium mb-6">
          <Zap size={12} /> Mạng xã hội nhắn tin thế hệ mới
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight dark:text-white mb-4">
          Kết nối mọi khoảnh khắc<br />
          <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">với Kin Book</span>
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Nền tảng nhắn tin thời gian thực, riêng tư và thân thiện. Nhắn tin, gọi video, tạo nhóm — tất cả trong một.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/register">
            <Button size="lg" className="h-12 px-8 text-base font-medium gap-2">
              <LogIn size={18} /> Bắt đầu ngay
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="h-12 px-8 text-base font-medium gap-2">
            <Download size={18} /> Tải ứng dụng
          </Button>
        </div>
        <p className="text-xs text-gray-400 mt-3">Miễn phí • Không quảng cáo • Riêng tư</p>
      </section>

      {/* Preview mockup */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl border dark:border-gray-800 bg-gradient-to-br from-blue-500 to-purple-600 p-1">
          <div className="rounded-xl bg-white dark:bg-gray-900 p-2">
            <div className="grid grid-cols-3 gap-1 h-64 md:h-80">
              {/* Sidebar mock */}
              <div className="hidden md:flex flex-col gap-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-400" />
                    <div className="flex-1">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded w-1/2 mt-1" />
                    </div>
                  </div>
                ))}
              </div>
              {/* Chat mock */}
              <div className="col-span-3 md:col-span-2 flex flex-col justify-end gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="self-start max-w-[70%] bg-white dark:bg-gray-700 rounded-2xl px-3 py-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-20" />
                </div>
                <div className="self-end max-w-[70%] bg-blue-500 rounded-2xl px-3 py-2">
                  <div className="h-2 bg-blue-200 rounded w-24" />
                </div>
                <div className="self-start max-w-[60%] bg-white dark:bg-gray-700 rounded-2xl px-3 py-2">
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center dark:text-white mb-3">Tính năng nổi bật</h2>
        <p className="text-center text-gray-500 dark:text-gray-400 mb-12">Mọi thứ bạn cần để kết nối</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-4">
                  <Icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-lg dark:text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Download CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl p-8 md:p-12 text-center text-white">
          <Smartphone size={48} className="mx-auto mb-4 opacity-80" />
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Tải Kin Book ngay hôm nay</h2>
          <p className="opacity-90 mb-6 max-w-md mx-auto">Sử dụng trên mọi thiết bị — điện thoại, máy tính bảng, máy tính</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 12.5c0-3 2.5-4.5 2.5-4.5s-1.3-1.9-3.3-2c-1.4-.1-2.7.8-3.4.8c-.7 0-1.7-.8-3-.8c-1.5 0-3 1-3.9 2.5c-1.7 3-.4 7.5 1.2 10c.8 1.2 1.7 2.6 3 2.5c1.2 0 1.6-.8 3-.8c1.4 0 1.8.8 3 .8c1.3 0 2.1-1.2 3-2.4c.6-.9 1.1-1.9 1.4-3c-1.7-.7-3-2.5-3-4.1zM15 4.5c.7-.8 1.1-1.9 1-3c-1 0-2.1.7-2.8 1.5c-.6.7-1.2 1.8-1 2.8c1.1.1 2.1-.5 2.8-1.3z"/></svg>
              <div className="text-left">
                <p className="text-[10px] opacity-70">Tải về từ</p>
                <p className="text-sm font-semibold">App Store</p>
              </div>
            </button>
            <button className="flex items-center gap-3 bg-white text-gray-900 px-6 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M3.18 20.83V3.17a.5.5 0 0 1 .78-.42l13.7 8.83a.5.5 0 0 1 0 .84l-13.7 8.83a.5.5 0 0 1-.78-.42zM20.5 2.5a.5.5 0 0 0-.78.42v18.16a.5.5 0 0 0 .78.42l1-.65a.5.5 0 0 0 .22-.42V3.57a.5.5 0 0 0-.22-.42z"/></svg>
              <div className="text-left">
                <p className="text-[10px] opacity-70">Tải về từ</p>
                <p className="text-sm font-semibold">Google Play</p>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <MessageCircle size={16} className="text-white" />
            </div>
            <span className="font-bold dark:text-white">Kin Book</span>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">© 2026 Kin Book. Kết nối mọi khoảnh khắc.</p>
        </div>
      </footer>
    </div>
  );
}
