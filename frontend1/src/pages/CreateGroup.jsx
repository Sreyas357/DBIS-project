import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ThemeContext } from '../components/ThemeContext';
import '../css/group.css';

const CreateGroup = () => {
  const { isDarkMode } = useContext(ThemeContext);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    invite_only: false
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.name.trim()) {
      setError('Group name is required');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:4000/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create group');
      }
      
      const newGroup = await response.json();
      // Redirect to the newly created group
      navigate(`/groups/${newGroup.group_id}`);
    } catch (err) {
      console.error('Error creating group:', err);
      setError(err.message || 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`create-group-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      
      <div className="container">
        <div className="page-header">
          <h1>Create New Group</h1>
        </div>
        
        <div className="form-container">
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit} className="create-group-form">
            <div className="form-group">
              <label htmlFor="name">Group Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="form-control"
                placeholder="Enter a name for your group"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Description</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                className="form-control"
                placeholder="Describe what your group is about"
                rows={4}
              />
            </div>
            
            <div className="form-group checkbox-group">
              <div className="checkbox-item">
                <input
                  type="checkbox"
                  id="invite_only"
                  name="invite_only"
                  checked={formData.invite_only}
                  onChange={handleChange}
                />
                <label htmlFor="invite_only">
                  Invitation Only (members can only join if invited)
                </label>
              </div>
            </div>
            
            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={() => navigate('/groups')}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : 'Create Group'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGroup; 