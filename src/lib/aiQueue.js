// Giới hạn số lượng lời gọi AI chạy đồng thời để tránh sập khi đông người
const MAX_CONCURRENT = 3;
const QUEUE_TIMEOUT = 30000; // 30s chờ tối đa

let activeCount = 0;
const queue = [];

function processQueue() {
  while (activeCount < MAX_CONCURRENT && queue.length > 0) {
    const { fn, resolve, reject, timer } = queue.shift();
    clearTimeout(timer);
    activeCount++;
    fn()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeCount--;
        processQueue();
      });
  }
}

/**
 * Chạy một lời gọi AI qua hàng đợi giới hạn.
 * @param {Function} fn - Hàm async trả về Promise
 * @returns {Promise} Kết quả của fn
 */
export function withAIQueue(fn) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      // Xóa khỏi queue nếu timeout
      const idx = queue.findIndex(q => q.fn === fn);
      if (idx !== -1) queue.splice(idx, 1);
      reject(new Error('AI đang quá tải, vui lòng thử lại sau'));
    }, QUEUE_TIMEOUT);

    queue.push({ fn, resolve, reject, timer });
    processQueue();
  });
}

// Cho phép kiểm tra trạng thái (debug)
export function getAIQueueStatus() {
  return { active: activeCount, waiting: queue.length, max: MAX_CONCURRENT };
}
