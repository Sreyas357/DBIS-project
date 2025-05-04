import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ThemeContext } from './ThemeContext';

const Group = ({ group, isUserMember, onJoinLeave, onRequestJoin, hasPendingRequest = false }) => {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [requestSent, setRequestSent] = useState(false);

  // Check if the user is an admin of this group using only the group's is_admin property
  const isAdmin = isUserMember && group.is_admin;
  
  // // Debug log
  // useEffect(() => {
  //   console.log(`Group ${group.name} (ID: ${group.group_id}):`);
  //   console.log('User Member:', isUserMember);
  //   console.log('Group is_admin prop:', group.is_admin);
  //   console.log('Is Admin calculated:', isAdmin);
  // }, [group, isUserMember, isAdmin]);

  const handleGroupClick = () => {
    navigate(`/groups/${group.group_id}`);
  };

  const handleJoinLeave = async (e) => {
    e.stopPropagation(); // Prevent navigating to group page
    
    if (loading) return;
    
    setLoading(true);
    try {
      await onJoinLeave(group.group_id, isUserMember);
      // If the user is leaving a group, reset the requestSent state
      // so they can request to join again later
      if (isUserMember) {
        setRequestSent(false);
      }
    } catch (error) {
      console.error("Error joining/leaving group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestJoin = async (e) => {
    e.stopPropagation(); // Prevent navigating to group page
    
    if (loading || hasPendingRequest || requestSent) return;
    
    setLoading(true);
    try {
      await onRequestJoin(group.group_id);
      setRequestSent(true);
    } catch (error) {
      console.error("Error requesting to join group:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async (e) => {
    e.stopPropagation(); // Prevent navigating to group page
    
    if (loading) return;
    
    if (window.confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      setLoading(true);
      try {
        const response = await fetch(`http://localhost:4000/api/groups/${group.group_id}/delete`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to delete group');
        }
        
        // Refresh the page or update the groups list
        window.location.reload();
      } catch (error) {
        console.error("Error deleting group:", error);
        alert('Failed to delete group. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Determine if we should show the "Request Sent" state
  const showRequestSent = hasPendingRequest || requestSent;

  return (
    <div 
      className={`group-card ${isDarkMode ? 'dark-mode' : ''}`} 
      onClick={handleGroupClick}
    >
      <div className="group-info">
        <h3 className="group-name">{group.name}</h3>
        <p className="group-bio">{group.bio || "No description available"}</p>
        
        <div className="group-meta">
          <span className="group-owner">
            Created by <Link 
              to={`/user/${group.owner_username}`}
              onClick={(e) => e.stopPropagation()}
            >
              {group.owner_username}
            </Link>
          </span>
          <span className="group-members">
            {group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
          </span>
          <span className="group-type">
            {group.invite_only ? '🔒 Invite only' : '🔓 Open to join'}
          </span>
        </div>
      </div>
      
      {/* Non-members see Join or Request button */}
      {!isUserMember && !group.invite_only && (
        <button 
          className="group-action-btn join"
          onClick={handleJoinLeave}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Join Group'}
        </button>
      )}

      {!isUserMember && group.invite_only && (
        <button 
          className={`group-action-btn request ${showRequestSent ? 'requested' : ''}`}
          onClick={handleRequestJoin}
          disabled={loading || showRequestSent}
        >
          {loading ? 'Processing...' : 
           showRequestSent ? 'Request Sent' : 'Request to Join'}
        </button>
      )}
      
      {/* Admin users see Delete button */}
      {isUserMember && isAdmin && (
        <button 
          className="group-action-btn delete"
          onClick={handleDeleteGroup}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Delete Group'}
        </button>
      )}
      
      {/* Regular members see Leave button */}
      {isUserMember && !isAdmin && (
        <button 
          className="group-action-btn leave"
          onClick={handleJoinLeave}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Leave Group'}
        </button>
      )}
    </div>
  );
};

export default Group; 