import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bug, Sparkles, X, ChevronDown, ChevronRight } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AICodeAnalyzer({ filePath, code }) {
  const [open, setOpen] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const analyze = async () => {
    if (!code) return;
    setAnalyzing(true);
    setError('');
    setResult(null);
    setOpen(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Bạn là chuyên gia review code React/JavaScript cho dự án Vite + React + Tailwind CSS.

File: ${filePath}

Nội dung code:
\`\`\`
${code}
\`\`\`

Hãy phân tích và tìm:
1. **Lỗi syntax / runtime** — lỗi cú pháp, biến chưa khai báo, import thiếu, logic sai
2. **Lỗi React** — hooks dùng sai, dependency thiếu, state update sai, memory leak
3. **Lỗi logic / dữ liệu** — null check thiếu, async/await sai, race condition
4. **Vấn đề UI/UX** — className Tailwind sai, responsive thiếu, dark mode thiếu

Trả lời bằng tiếng Việt theo định dạng markdown:
- Mỗi lỗi: **vị trí** (số dòng nếu được) → mô tả ngắn → cách sửa (đoạn code mẫu nếu cần)
- Nếu không có lỗi nghiêm trọng, nói "✅ Code ổn, không phát hiện lỗi nghiêm trọng" rồi đưa ra vài gợi ý cải thiện nhỏ.
- Ngắn gọn, đi thẳng vào vấn đề.`,
      });
      setResult(typeof response === 'string' ? response : (response?.response || response?.text || JSON.stringify(response)));
    } catch (e) {
      setError(e?.message || 'Không thể phân tích lúc này');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <>
      <button
        onClick={analyze}
        disabled={!code || analyzing}
        className="flex items-center gap-1 px-2.5 py-1 rounded text-xs bg-purple-500 text-white disabled:opacity-40 hover:bg-purple-600"
        title="AI phân tích lỗi code"
      >
        <Bug size={12} /> {analyzing ? 'Đang phân tích...' : 'AI tìm lỗi'}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-gray-900 w-full md:max-w-2xl md:rounded-xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b dark:border-gray-700 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-t-xl">
              <div className="flex items-center gap-2">
                <Sparkles size={16} />
                <span className="font-semibold text-sm">AI Code Review</span>
              </div>
              <button onClick={() => setOpen(false)} className="p-1 hover:bg-white/20 rounded-full">
                <X size={18} />
              </button>
            </div>

            {/* File path */}
            <div className="px-4 py-2 border-b dark:border-gray-700 text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
              {filePath}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {analyzing ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI đang đọc và phân tích code...</p>
                </div>
              ) : error ? (
                <div className="text-sm text-red-500 py-4 text-center">⚠️ {error}</div>
              ) : result ? (
                <ReactMarkdown className="text-sm prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-2 [&>li]:my-0.5 [&>h3]:mt-3 [&>h3]:mb-1 [&>h4]:mt-2 [&>h4]:mb-1 [&>pre]:my-2">
                  {result}
                </ReactMarkdown>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">Bấm "AI tìm lỗi" để bắt đầu phân tích</p>
              )}
            </div>

            {/* Footer */}
            {result && !analyzing && (
              <div className="px-4 py-2 border-t dark:border-gray-700 flex justify-end">
                <button
                  onClick={analyze}
                  className="text-xs text-purple-500 hover:underline flex items-center gap-1"
                >
                  <Sparkles size={12} /> Phân tích lại
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
