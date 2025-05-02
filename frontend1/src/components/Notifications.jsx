import React, { useState, useEffect } from 'react';
import '../css/notifications.css';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:4000/api/notifications', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      setNotifications(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAcceptRequest = async (notificationId, requestId) => {
    try {
      // Mark notification as read
      await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Accept the join request
      const response = await fetch(`http://localhost:4000/api/groups/join-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'accepted' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to accept request');
      }
      
      // Refresh notifications
      fetchNotifications();
    } catch (err) {
      console.error('Error accepting request:', err);
      setError(err.message);
    }
  };
  
  const handleRejectRequest = async (notificationId, requestId) => {
    try {
      // Mark notification as read
      await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Reject the join request
      const response = await fetch(`http://localhost:4000/api/groups/join-requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status: 'rejected' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject request');
      }
      
      // Refresh notifications
      fetchNotifications();
    } catch (err) {
      console.error('Error rejecting request:', err);
      setError(err.message);
    }
  };
  
  const markAsRead = async (notificationId) => {
    try {
      await fetch(`http://localhost:4000/api/notifications/${notificationId}/read`, {
        method: 'POST',
        credentials: 'include',
      });
      
      // Update local state to mark as read
      setNotifications(notifications.map(notif => 
        notif.notification_id === notificationId 
          ? { ...notif, is_read: true } 
          : notif
      ));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };
  
  if (isLoading) return <div className="notifications-loading">Loading notifications...</div>;
  if (error) return <div className="notifications-error">Error: {error}</div>;
  
  return (
    <div className="notifications-container">
      <h2>Notifications</h2>
      {notifications.length === 0 && (
        <div className="no-notifications">You have no notifications</div>
      )}
      <ul className="notifications-list">
        {notifications.map(notification => (
          <li 
            key={notification.notification_id} 
            className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
          >
            <div className="notification-content">
              <p>{notification.content}</p>
              <small className="notification-date">{formatDate(notification.created_at)}</small>
            </div>
            
            {notification.type === 'join_request' && !notification.is_read && (
              <div className="notification-actions">
                <button 
                  className="accept-btn"
                  onClick={() => handleAcceptRequest(notification.notification_id, notification.related_id)}
                >
                  Accept
                </button>
                <button 
                  className="reject-btn"
                  onClick={() => handleRejectRequest(notification.notification_id, notification.related_id)}
                >
                  Reject
                </button>
              </div>
            )}
            
            {!notification.is_read && notification.type !== 'join_request' && (
              <button 
                className="mark-read-btn"
                onClick={() => markAsRead(notification.notification_id)}
              >
                Mark as read
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications; 