const sendRequest = async (userId) => {
  if (sendingTo) return;
  setSendingTo(userId);
  try {
    alert('currentUserId = ' + currentUserId);
    const otherProfile = profileMap[userId] || {};
    const newFriendship = await base44.entities.Friendship.create({
      requester_id: currentUserId,
      requester_name: profile?.display_name || 'User',
      requester_avatar: profile?.avatar_url || '',
      receiver_id: userId,
      receiver_name: otherProfile?.display_name || 'User',
      receiver_avatar: otherProfile?.avatar_url || '',
      status: 'pending'
    });
    setFriendships(prev => [...prev, newFriendship]);
  } catch (e) {
    alert('Lỗi kết bạn: ' + JSON.stringify(e));
    console.error(e);
  } finally {
    setSendingTo(null);
  }
};
