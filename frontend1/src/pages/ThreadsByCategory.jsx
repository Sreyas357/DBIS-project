import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ThreadList from '../components/ThreadList';
import ThreadCategoriesList from '../components/ThreadCategoriesList';
import SearchBar from '../components/SearchBar';
import '../css/threads.css';

const ThreadsByCategory = () => {
  const { categoryId } = useParams();
  const [threads, setThreads] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryName, setCategoryName] = useState('');
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
        let url;
        
        if (searchQuery) {
          url = `http://localhost:4000/api/threads/search?q=${encodeURIComponent(searchQuery)}&category=${categoryId}&sort=${filter}`;
        } else {
          url = `http://localhost:4000/api/threads/category/${categoryId}?sort=${filter}`;
        }
        
        const response = await fetch(url);
        
        if (response.ok) {
          const data = await response.json();
          setThreads(data);
          if (data.length > 0) {
            setCategoryName(data[0].category_name);
          }
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
    navigate(`/threads/category/${categoryId}${newSearch}`, { replace: true });
    
  }, [categoryId, filter, searchQuery, navigate]);
  
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await fetch('http://localhost:4000/api/thread-categories');
        
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
          
          // Set category name if not already set from threads
          if (!categoryName && data.length > 0) {
            const category = data.find(cat => cat.category_id.toString() === categoryId);
            if (category) {
              setCategoryName(category.name);
            }
          }
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
  }, [categoryId, categoryName]);

  const handleSearch = (query) => {
    setSearchQuery(query);
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  const handleSortChange = (e) => {
    setFilter(e.target.value);
  };

  return (
    <div>
      <Navbar />
      <div className="threads-container">
        <div className="threads-sidebar">
          <ThreadCategoriesList 
            categories={categories} 
            loading={categoriesLoading} 
            selectedCategoryId={categoryId}
          />
        </div>
        <div className="threads-main">
          <div className="thread-category-header">
            <h2>{categoryName || 'Category Threads'}</h2>
          </div>
          
          <div className="search-and-filter-row">
            <SearchBar 
              onSearch={handleSearch}
              categoryId={categoryId}
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
              <select 
                value={filter} 
                onChange={handleSortChange}
                className="thread-sort-select"
              >
                <option value="trending">Trending</option>
                <option value="newest">Newest</option>
                <option value="most-commented">Most Commented</option>
                <option value="most-viewed">Most Views</option>
              </select>
            </div>
            <button 
              className="create-thread-button"
              onClick={() => navigate(`/threads/create?category=${categoryId}`)}
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

export default ThreadsByCategory;
