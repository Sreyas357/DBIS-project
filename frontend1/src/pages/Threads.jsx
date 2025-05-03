import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ThreadList from '../components/ThreadList';
import ThreadCategoriesList from '../components/ThreadCategoriesList';
import SearchBar from '../components/SearchBar';
import '../css/threads.css';

const Threads = () => {
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [filter, setFilter] = useState('trending'); // trending, newest, most-commented, most-viewed
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Parse query params on initial load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const queryParam = params.get('q');
    const filterParam = params.get('filter');
    
    if (queryParam) setSearchQuery(queryParam);
    if (filterParam) setFilter(filterParam);
  }, [location.search]);
  
  useEffect(() => {
    const fetchThreadsData = async () => {
      try {
        setLoading(true);
        let url = `http://localhost:4000/api/threads/${filter}`;
        
        // Add search query if present
        if (searchQuery) {
          url = `http://localhost:4000/api/threads/search?q=${encodeURIComponent(searchQuery)}&sort=${filter}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
        } else {
          console.error('Failed to fetch threads');
        }
      } catch (error) {
        console.error('Error fetching threads:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchThreadsData();
    
    // Update URL with current search/filter
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (filter !== 'trending') params.set('filter', filter);
    
    const newSearch = params.toString() ? `?${params.toString()}` : '';
    navigate(`/threads${newSearch}`, { replace: true });
    
  }, [filter, searchQuery, navigate]);
  
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

  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleFilterChange = (value) => {
    setFilter(value);
  };

  return (
    <div>
      <Navbar />
      <div className="threads-container">
        <div className="threads-sidebar">
          <ThreadCategoriesList 
            categories={categories} 
            loading={categoriesLoading} 
            selectedCategoryId="all"
          />
        </div>
        <div className="threads-main">
          <div className="search-and-filter-row">
            <SearchBar 
              onSearch={handleSearch}
              categoryId="all"
              filter={filter}
              onFilterChange={handleFilterChange}
            />
          </div>
          
          <div className="thread-actions-bar">
            <div className="thread-sort-container">
              {searchQuery && (
                <div className="search-status">
                  <span>Results for "{searchQuery}"</span>
                  <button className="clear-search-btn" onClick={clearSearch}>✕</button>
                </div>
              )}
            </div>
            <button 
              className="create-thread-button"
              onClick={() => navigate('/threads/create')}
            >
              Create Thread
            </button>
          </div>
          <ThreadList threads={threads} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Threads;
