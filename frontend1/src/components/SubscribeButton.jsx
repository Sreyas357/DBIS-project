import React, { useState } from 'react';
import '../css/subscribe-button.css';

const SubscribeButton = ({ threadId, initialIsSubscribed }) => {
  const [isSubscribed, setIsSubscribed] = useState(initialIsSubscribed);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSubscription = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:4000/api/threads/${threadId}/subscribe`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setIsSubscribed(data.subscribed);
      } else {
        const error = await response.json();
        if (response.status === 401) {
          alert('Please log in to subscribe');
        } else {
          console.error('Error toggling subscription:', error);
        }
      }
    } catch (error) {
      console.error('Error toggling subscription:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      className={`subscribe-button ${isSubscribed ? 'subscribed' : ''}`}
      onClick={toggleSubscription}
      disabled={isLoading}
    >
      {isLoading ? 'Loading...' : isSubscribed ? 'Unsubscribe' : 'Subscribe'}
    </button>
  );
};

export default SubscribeButton;
