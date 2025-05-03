import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/search-bar.css';
// You can import Font Awesome
// import { FaSearch } from 'react-icons/fa';

const SearchBar = ({ onSearch, categoryId, filter, onFilterChange }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchSearchResults();
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 300);
    
    // Reset highlighted index when query changes
    setHighlightedIndex(-1);
    
    return () => clearTimeout(searchTimeout);
  }, [query]);
  
  const fetchSearchResults = async () => {
    setIsLoading(true);
    try {
      // Ensure we're using the correct endpoint
      let url = `http://localhost:4000/api/threads/search?q=${encodeURIComponent(query)}`;
      
      if (categoryId && categoryId !== 'all' && categoryId !== 'subscribed') {
        url += `&category=${categoryId}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setResults(data);
        setShowDropdown(data.length > 0);
      } else {
        console.error('Search request failed');
        setResults([]);
      }
    } catch (error) {
      console.error('Error searching threads:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (query.trim()) {
      setShowDropdown(false);
      onSearch(query);
    }
  };
  
  const handleResultClick = (threadId) => {
    setShowDropdown(false);
    navigate(`/threads/${threadId}`);
  };
  
  const handleKeyDown = (e) => {
    if (!showDropdown) return;
    
    // Arrow up
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev <= 0 ? results.length - 1 : prev - 1
      );
    }
    // Arrow down
    else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => 
        prev >= results.length - 1 ? 0 : prev + 1
      );
    }
    // Enter
    else if (e.key === 'Enter' && highlightedIndex >= 0) {
      e.preventDefault();
      const selected = results[highlightedIndex];
      if (selected) {
        handleResultClick(selected.thread_id);
      } else {
        handleSearch();
      }
    }
    // Escape
    else if (e.key === 'Escape') {
      setShowDropdown(false);
    }
  };
  
  const handleFilterChange = (e) => {
    if (onFilterChange) {
      onFilterChange(e.target.value);
    }
  };
  
  return (
    <div className="search-bar-container" ref={searchRef}>
      <div className="search-filter-container">
        <form onSubmit={handleSearch} className="search-form">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => {
              if (query.trim().length >= 2 && results.length > 0) {
                setShowDropdown(true);
              }
            }}
            className="search-input"
            autoComplete="off"
          />
          <button type="submit" className="search-button">
            <span className="fa fa-search"></span>
          </button>
        </form>
        
        {onFilterChange && (
          <div className="filter-container">
            <select 
              className="filter-dropdown"
              value={filter || 'trending'}
              onChange={handleFilterChange}
              style={{ flex: '0 0 160px' }}
            >
              <option value="trending">Trending</option>
              <option value="newest">Newest</option>
              <option value="most-commented">Most Commented</option>
              <option value="most-viewed">Most Views</option>
            </select>
          </div>
        )}
      </div>
      
      {showDropdown && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-loading">Loading...</div>
          ) : results.length > 0 ? (
            <ul className="search-results-list">
              {results.slice(0, 7).map((result, index) => (
                <li 
                  key={result.thread_id} 
                  onClick={() => handleResultClick(result.thread_id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`search-result-item ${index === highlightedIndex ? 'highlighted' : ''}`}
                >
                  <div className="search-result-title">
                    {result.title}
                  </div>
                  <div className="search-result-meta">
                    <span>by {result.username}</span>
                    {result.book_title && (
                      <span className="search-result-book">📚 {result.book_title}</span>
                    )}
                  </div>
                </li>
              ))}
              {results.length > 7 && (
                <li 
                  className={`search-more ${highlightedIndex === 7 ? 'highlighted' : ''}`} 
                  onClick={handleSearch}
                  onMouseEnter={() => setHighlightedIndex(7)}
                >
                  See all {results.length} results
                </li>
              )}
            </ul>
          ) : query.length >= 2 ? (
            <div className="search-no-results">No results found</div>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
