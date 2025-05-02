import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import GroupList from '../components/GroupList';
import { ThemeContext } from '../components/ThemeContext';
import '../css/group.css';

const Groups = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [userMemberships, setUserMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [joinRequests, setJoinRequests] = useState([]);

  useEffect(() => {
    fetchUserGroups();
    fetchUserJoinRequests();
  }, []);

  const fetchUserJoinRequests = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('http://localhost:4000/api/groups/my-join-requests', {
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      
      if (!response.ok) {
        console.error('Failed to fetch join requests:', response.status);
        // Don't throw an error, just set empty join requests
        setJoinRequests([]);
        return;
      }
      
      const data = await response.json();
      setJoinRequests(data);
    } catch (err) {
      console.error('Error fetching join requests:', err);
      // Set empty join requests on error to prevent UI issues
      setJoinRequests([]);
    }
  };

  const fetchUserGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/user/groups', {
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        setGroups([]);
        setUserMemberships([]);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Failed to fetch user groups');
      }
      
      const data = await response.json();
      setGroups(data);
      setUserMemberships(data);
      setIsSearching(false);
    } catch (err) {
      console.error('Error fetching user groups:', err);
      setError('Failed to load your groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllGroups = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:4000/api/groups', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch groups');
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error fetching all groups:', err);
      setError('Failed to load groups. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async (groupId, isCurrentlyMember) => {
    try {
      // Redirect to login if not authenticated
      if (!isAuthenticated) {
        navigate('/login');
        return;
      }
      
      const endpoint = isCurrentlyMember 
        ? `http://localhost:4000/api/groups/${groupId}/leave`
        : `http://localhost:4000/api/groups/${groupId}/join`;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Operation failed');
      }
      
      // Update local state after successful join/leave
      if (isCurrentlyMember) {
        setUserMemberships(prevMemberships => 
          prevMemberships.filter(membership => membership.group_id !== groupId)
        );
        
        // If we're viewing the user's groups, also remove from displayed groups
        if (!isSearching) {
          setGroups(prevGroups => 
            prevGroups.filter(group => group.group_id !== groupId)
          );
        }
      } else {
        // After joining a group, refresh the user's groups
        if (isSearching) {
          // If we're in search view, just update the membership data
          const groupResponse = await fetch(`http://localhost:4000/api/groups/${groupId}`, {
            credentials: 'include',
          });
          
          if (groupResponse.ok) {
            const groupData = await groupResponse.json();
            setUserMemberships(prev => [...prev, groupData.group]);
          }
        } else {
          // If viewing user groups, refresh to show the newly joined group
          fetchUserGroups();
        }
      }
    } catch (err) {
      console.error(`Error ${isCurrentlyMember ? 'leaving' : 'joining'} group:`, err);
      setError(err.message);
      throw err;
    }
  };

  const handleRequestJoin = async (groupId) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`http://localhost:4000/api/groups/${groupId}/request-join`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: 'I would like to join your group' }),
      });
      
      if (response.status === 401) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to request join');
      }
      
      // Add or update this group's request in the joinRequests state
      const data = await response.json();
      
      // Remove any existing requests for this group (in case of re-requesting)
      const filteredRequests = joinRequests.filter(req => req.group_id !== groupId);
      
      // Add the new/updated request
      setJoinRequests([...filteredRequests, data.request]);
      
      return data;
    } catch (err) {
      console.error('Error requesting to join group:', err);
      setError(err.message);
      throw err;
    }
  };

  const handleCreateGroup = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate('/groups/create');
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      // Return to view of user's groups if search is cleared
      fetchUserGroups();
      return;
    }
    
    setLoading(true);
    setIsSearching(true);
    
    try {
      const response = await fetch(`http://localhost:4000/api/groups/search?q=${encodeURIComponent(searchQuery)}`, {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data = await response.json();
      setGroups(data);
    } catch (err) {
      console.error('Error searching groups:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleViewAllGroups = () => {
    setLoading(true);
    setIsSearching(true);
    fetchAllGroups();
  };

  const handleViewMyGroups = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchUserGroups();
  };

  const handleLogin = () => {
    navigate('/login');
  };

  // Check if a group has a pending join request
  const hasPendingRequest = (groupId) => {
    return joinRequests.some(
      request => request.group_id === groupId && request.status === 'pending'
    );
  };

  return (
    <div className={`groups-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      
      <div className="container">
        <div className="groups-header">
          <h1>Groups</h1>
          <div className="groups-actions">
            <button 
              className="create-group-btn"
              onClick={handleCreateGroup}
            >
              Create New Group
            </button>
          </div>
        </div>
        
        <div className="view-toggle">
          <button 
            className={`view-toggle-btn ${!isSearching ? 'active' : ''}`}
            onClick={handleViewMyGroups}
          >
            My Groups
          </button>
          <button 
            className={`view-toggle-btn ${isSearching ? 'active' : ''}`}
            onClick={handleViewAllGroups}
          >
            All Groups
          </button>
        </div>
        
        <div className="search-container">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search groups..."
              className="search-input"
            />
            <button type="submit" className="search-btn">Search</button>
          </form>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        {!isAuthenticated && !isSearching && (
          <div className="auth-message">
            <p>You need to be logged in to view your groups</p>
            <button className="login-btn" onClick={handleLogin}>Log in</button>
          </div>
        )}
        
        <GroupList 
          groups={groups}
          loading={loading}
          userMemberships={userMemberships}
          onJoinLeave={handleJoinLeave}
          onRequestJoin={handleRequestJoin}
          pendingRequests={joinRequests}
        />
      </div>
    </div>
  );
};

export default Groups; 