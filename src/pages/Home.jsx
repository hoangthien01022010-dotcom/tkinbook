              profiles={profiles}
              onBack={() => setMobileView('list')}
              onShowInfo={() => setShowConvInfo(true)}
            />
          ) : (
            <div className="flex-1 hidden md:flex items-center justify-center text-gray-500 dark:text-gray-400">
              Chọn một cuộc trò chuyện để bắt đầu
            </div>
          )}
        </div>
      </div>

      {showNewChat && (
        <NewChatModal
          onClose={() => setShowNewChat(false)}
          onSelect={startChatWith}
          currentUserId={user.id}
        />
      )}
      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          currentUserId={user.id}
          onCreated={selectConversation}
        />
      )}
      {showConvInfo && selectedConv && (
        <ConversationInfo
          conversation={selectedConv}
          onClose={() => setShowConvInfo(false)}
        />
      )}
    </div>
  );
      }
