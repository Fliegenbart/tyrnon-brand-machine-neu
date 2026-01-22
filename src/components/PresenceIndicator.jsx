import React, { useState } from 'react';

export default function PresenceIndicator({ onlineUsers, currentUser }) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Filter out current user for "others" display
  const otherUsers = onlineUsers.filter(u => u.user_id !== currentUser.id);
  const totalOnline = onlineUsers.length;

  if (totalOnline === 0) return null;

  return (
    <div className="presence-indicator">
      <div
        className="presence-summary"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="presence-avatars">
          {onlineUsers.slice(0, 4).map((user, i) => (
            <div
              key={user.user_id}
              className={`presence-avatar ${user.user_id === currentUser.id ? 'is-you' : ''}`}
              style={{
                backgroundColor: user.user_color,
                zIndex: 4 - i
              }}
              title={user.user_name + (user.user_id === currentUser.id ? ' (Du)' : '')}
            >
              {user.user_name.charAt(0)}
            </div>
          ))}
          {totalOnline > 4 && (
            <div className="presence-avatar presence-more">
              +{totalOnline - 4}
            </div>
          )}
        </div>
        <span className="presence-count">
          {totalOnline} {totalOnline === 1 ? 'Person' : 'Personen'} online
        </span>
        <span className={`presence-expand ${isExpanded ? 'expanded' : ''}`}>
          {isExpanded ? '▲' : '▼'}
        </span>
      </div>

      {isExpanded && (
        <div className="presence-dropdown">
          <div className="presence-list">
            {onlineUsers.map(user => (
              <div key={user.user_id} className="presence-user">
                <div
                  className="presence-user-avatar"
                  style={{ backgroundColor: user.user_color }}
                >
                  {user.user_name.charAt(0)}
                </div>
                <div className="presence-user-info">
                  <span className="presence-user-name">
                    {user.user_name}
                    {user.user_id === currentUser.id && (
                      <span className="presence-you-badge">(Du)</span>
                    )}
                  </span>
                  {user.active_asset && (
                    <span className="presence-user-activity">
                      arbeitet an: {user.active_asset}
                    </span>
                  )}
                </div>
                <div className={`presence-status ${user.active_asset ? 'active' : 'idle'}`}>
                  {user.active_asset ? 'Aktiv' : 'Online'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
