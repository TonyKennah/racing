import React from 'react';

const NotificationItem = ({ notification, onAccept, onReject, onDismiss }) => {
  return (
    <div className="nr-notification-item">
      <div className="nr-notification-content">
        <span className="nr-icon">🚫</span>
        <span className="nr-message">
          <strong>{notification.name}</strong> is now a non-runner in the {notification.race}
        </span>
      </div>
      <div className="nr-notification-actions">
        <button 
          className="nr-action-btn nr-accept-btn" 
          onClick={() => onAccept(notification.id)}
          title="Confirm this horse is a non-runner"
        >
          ✅ Accept
        </button>
        <button 
          className="nr-action-btn nr-reject-btn" 
          onClick={() => onReject(notification.id)}
          title="Reject - keep this horse active"
        >
          ❌ Reject
        </button>
        <button 
          className="nr-close-btn" 
          onClick={() => onDismiss(notification.id)}
          title="Dismiss without deciding"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const NonRunnerNotifications = ({ notifications, onAccept, onReject, onDismiss, onClearAll }) => {
  if (!notifications.length) return null;

  return (
    <div className="nr-notifications-container">
      {/* 1. Individual horse notifications render first */}
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onAccept={onAccept}
          onReject={onReject}
          onDismiss={onDismiss}
        />
      ))}

      {/* 2. Clear All block renders last, pinning it to the bottom of the stack */}
      {notifications.length > 1 && (
        <div className="nr-notification-item nr-clear-all-item">
          <div className="nr-notification-content">
            <span className="nr-message">You have {notifications.length} new updates</span>
          </div>
          <button className="nr-clear-all-btn" onClick={onClearAll}>
            Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default NonRunnerNotifications;
