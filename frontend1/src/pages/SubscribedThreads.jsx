import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ThreadList from '../components/ThreadList';
import ThreadCategoriesList from '../components/ThreadCategoriesList';
import '../css/threads.css';

const SubscribedThreads = () => {
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchSubscribedThreads = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:4000/api/user/subscribed-threads', {
          credentials: 'include'
        });
        
        if (response.status === 401) {
          // User not logged in, redirect to login
          navigate('/login', { state: { from: '/threads/subscribed' } });
          return;
        }
        
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
        } else {
          console.error('Failed to fetch subscribed threads');
        }
      } catch (error) {
        console.error('Error fetching subscribed threads:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSubscribedThreads();
  }, [navigate]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('http://localhost:4000/api/thread-categories');
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch thread categories');
        }
      } catch (error) {
        console.error('Error fetching thread categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    
    fetchCategories();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="threads-container">
        <div className="threads-sidebar">
          <ThreadCategoriesList 
            categories={categories} 
            loading={categoriesLoading} 
            selectedCategoryId="subscribed"
          />
        </div>
        <div className="threads-main">
          <div className="thread-category-header">
            <h2>My Subscribed Threads</h2>
          </div>
          <div className="thread-actions-bar">
            <button 
              className="create-thread-button"
              onClick={() => navigate('/threads/create')}
            >
              Create Thread
            </button>
          </div>
          {threads.length === 0 && !loading ? (
            <div className="no-subscriptions">
              <p>You haven't subscribed to any threads yet.</p>
              <p>Subscribe to threads to keep track of discussions you're interested in.</p>
              <button 
                onClick={() => navigate('/threads')}
                className="browse-threads-btn"
              >
                Browse Threads
              </button>
            </div>
          ) : (
            <ThreadList threads={threads} loading={loading} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscribedThreads;
