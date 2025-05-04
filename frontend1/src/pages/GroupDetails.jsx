import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ThemeContext } from '../components/ThemeContext';
import '../css/group.css';

const GroupDetails = () => {
  const { groupId } = useParams();
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const [group, setGroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isUserMember, setIsUserMember] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    fetchGroupDetails();
  }, [groupId]);

  const fetchGroupDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:4000/api/groups/${groupId}`, {
        credentials: 'include',
      });
      
      if (response.status === 404) {
        setError('Group not found');
        return;
      }
      
      if (response.status === 403) {
        setError('This group requires an invitation to join');
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch group details');
      }
      
      const data = await response.json();
      setGroup(data.group);
      setMembers(data.members);
      setIsUserMember(data.group.is_member);
      setIsUserAdmin(data.group.is_admin);
      
      // If user is a member, fetch group messages
      if (data.group.is_member) {
        fetchGroupMessages();
      }
    } catch (err) {
      console.error('Error fetching group details:', err);
      setError('Failed to load group details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroupMessages = async () => {
    try {
      const response = await fetch(`http://localhost:4000/api/groups/${groupId}/messages`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch group messages');
      }
      
      const data = await response.json();
      setMessages(data);
    } catch (err) {
      console.error('Error fetching group messages:', err);
    }
  };

  const handleJoinLeave = async () => {
    try {
      const endpoint = isUserMember 
        ? `http://localhost:4000/api/groups/${groupId}/leave`
        : `http://localhost:4000/api/groups/${groupId}/join`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }
      
      // Update UI after successful join/leave
      if (isUserMember) {
        setIsUserMember(false);
        setIsUserAdmin(false);
      } else {
        // Refresh group details after joining
        fetchGroupDetails();
      }
    } catch (err) {
      console.error(`Error ${isUserMember ? 'leaving' : 'joining'} group:`, err);
      setError(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isUserMember) return;
    
    try {
      setMessageLoading(true);
      const response = await fetch(`http://localhost:4000/api/groups/${groupId}/messages`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: newMessage }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      // Clear input and refresh messages
      setNewMessage('');
      fetchGroupMessages();
    } catch (err) {
      console.error('Error sending message:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setMessageLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`group-details-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <Navbar />
        <div className="container">
          <p>Loading group details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`group-details-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <Navbar />
        <div className="container">
          <div className="error-message">{error}</div>
          <button 
            className="back-button"
            onClick={() => navigate('/groups')}
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className={`group-details-page ${isDarkMode ? 'dark-mode' : ''}`}>
        <Navbar />
        <div className="container">
          <p>Group not found</p>
          <button 
            className="back-button"
            onClick={() => navigate('/groups')}
          >
            Back to Groups
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`group-details-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      
      <div className="container">
        <div className="group-details-header">
          <h1>{group.name}</h1>
          
          {!group.invite_only && !isUserMember && (
            <button 
              className="join-group-btn"
              onClick={handleJoinLeave}
            >
              Join Group
            </button>
          )}
          
          {isUserMember && !isUserAdmin && (
            <button 
              className="leave-group-btn"
              onClick={handleJoinLeave}
            >
              Leave Group
            </button>
          )}
          
          {isUserAdmin && (
            <button 
              className="delete-group-btn"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
                  fetch(`http://localhost:4000/api/groups/${groupId}/delete`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                  })
                  .then(response => {
                    if (response.ok) {
                      navigate('/groups');
                    } else {
                      throw new Error('Failed to delete group');
                    }
                  })
                  .catch(err => {
                    console.error('Error deleting group:', err);
                    alert('Failed to delete group. Please try again.');
                  });
                }
              }}
            >
              Delete Group
            </button>
          )}
        </div>
        
        <div className="group-details-info">
          <p className="group-bio">{group.bio || "No description available"}</p>
          <div className="group-meta">
            <span>Created by: <Link to={`/user/${group.owner_username}`}>{group.owner_username}</Link></span>
            <span>Members: {group.member_count}</span>
            <span>Type: {group.invite_only ? '🔒 Invite only' : '🔓 Open to join'}</span>
          </div>
        </div>
        
        <div className="group-content">
          <div className="group-members-section">
            <h2>Members ({members.length})</h2>
            <div className="members-list">
              {members.map(member => (
                <div key={member.user_id} className="member-item">
                  <Link to={`/user/${member.username}`}>{member.username}</Link>
                  {member.is_admin && <span className="admin-badge">Admin</span>}
                </div>
              ))}
            </div>
          </div>
          
          {isUserMember && (
            <div className="group-messages-section">
              <h2>Group Messages</h2>
              
              <div className="messages-list">
                {messages.length === 0 ? (
                  <p className="no-messages">No messages yet. Be the first to say something!</p>
                ) : (
                  messages.map(msg => (
                    <div key={msg.message_id} className="message-item">
                      <div className="message-header">
                        <Link to={`/user/${msg.username}`}>{msg.username}</Link>
                        <span className="message-time">
                          {new Date(msg.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="message-content">{msg.message}</p>
                    </div>
                  ))
                )}
              </div>
              
              <form className="message-form" onSubmit={handleSendMessage}>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="message-input"
                  rows={3}
                />
                <button 
                  type="submit" 
                  className="send-message-btn"
                  disabled={messageLoading || !newMessage.trim()}
                >
                  {messageLoading ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupDetails; 