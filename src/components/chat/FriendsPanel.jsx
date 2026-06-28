const sendRequest = async (userId) => {
  if (sendingTo) return;

  const existing = friendships.find(f =>
    (f.requester_id === currentUserId && f.receiver_id === userId) ||
    (f.receiver_id === currentUserId && f.requester_id === userId)
  );
  if (existing) return;

  setSendingTo(userId);
  try {
    const otherProfile = profileMap[userId] || {};

    // tạo friendship trước, có default để tránh null
    const newFriendship = await base44.entities.Friendship.create({
      requester_id: currentUserId,
      requester_name: profile?.display_name || 'User',
      requester_avatar: profile?.avatar_url || '',
      receiver_id: userId,
      receiver_name: otherProfile?.display_name || 'User',
      receiver_avatar: otherProfile?.avatar_url || '',
      status: 'pending'
    });

    // Notification tách riêng, fail cũng kệ
    try {
      await base44.entities.Notification.create({
        user_id: userId,
        type: 'friend_request',
        title: 'Lời mời kết bạn',
        body: `${profile?.display_name || 'Ai đó'} đã gửi lời mời kết bạn`,
        from_user_name: profile?.display_name || '',
        from_user_avatar: profile?.avatar_url || ''
      });
    } catch (nErr) {
      console.warn('Notification fail, bỏ qua:', nErr);
    }

    // update UI ngay, khỏi chờ subscribe
    setFriendships(prev => [...prev, newFriendship]);

  } catch (e) {
    console.error('Friendship create error:', e);
    alert('Gửi kết bạn lỗi: ' + (e.message || e));
  } finally {
    setSendingTo(null);
  }
};
