import React, { useState, useEffect, useRef, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import { ThemeContext } from '../components/ThemeContext';
import "../styles/Threads.css";

const Threads = () => {
    const [threads, setThreads] = useState([]);
    const [filteredThreads, setFilteredThreads] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const { isDarkMode } = useContext(ThemeContext);
    const [myThreads, setMyThreads] = useState([]);
    const [subscribedThreads, setSubscribedThreads] = useState([]);
    const [trendingThreads, setTrendingThreads] = useState([]);
    const [activeSection, setActiveSection] = useState('all');
    const [username, setUsername] = useState('');
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [sidebarWidth, setSidebarWidth] = useState(null);
    const [isResizing, setIsResizing] = useState(false);
    
    const searchInputRef = useRef(null);
    const sidebarRef = useRef(null);
    const resizeHandleRef = useRef(null);
    const navigate = useNavigate();
    
    // Check if user is logged in
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                console.log('Checking login status...');
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: 'include'
                });
                
                if (response.status === 200) {
                    const data = await response.json();
                    console.log('Login check successful, user data:', data);
                    
                    if (data && data.username) {
                        setIsLoggedIn(true);
                        setUsername(data.username || '');
                    } else {
                        console.warn('Received 200 status but invalid user data:', data);
                        setIsLoggedIn(false);
                        setUsername('');
                    }
                } else {
                    console.log('User not logged in, status:', response.status);
                    setIsLoggedIn(false);
                    // Clear any stale user data
                    setUsername('');
                    localStorage.removeItem('username');
                }
            } catch (err) {
                console.error('Error checking login status:', err);
                setIsLoggedIn(false);
                setUsername('');
            }
        };

        checkLoginStatus();
        
        // Check for sidebar collapsed state in localStorage
        const savedSidebarState = localStorage.getItem('sidebarCollapsed') === 'true';
        setIsSidebarCollapsed(savedSidebarState);

        // Get saved sidebar width from localStorage
        const savedWidth = localStorage.getItem('sidebarWidth');
        if (savedWidth) {
            setSidebarWidth(parseInt(savedWidth));
        }
    }, []);

    // Handle sidebar resizing
    useEffect(() => {
        const handleMouseMove = (e) => {
            if (isResizing) {
                const newWidth = e.clientX;
                // Set minimum width to 200px and maximum width to 500px
                if (newWidth >= 200 && newWidth <= 500) {
                    setSidebarWidth(newWidth);
                    localStorage.setItem('sidebarWidth', newWidth);
                }
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'ew-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'default';
        };
    }, [isResizing]);

    // Fetch thread categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/threads/categories`);
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await response.json();
                console.log('Categories fetched in Threads.jsx:', data);
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load thread categories');
            }
        };

        fetchCategories();
    }, []);

    // Fetch all threads
    useEffect(() => {
        const fetchThreads = async () => {
            setIsLoading(true);
            try {
                // Fetch threads with parent_thread_id as null (only parent threads)
                let url = `${apiUrl}/api/threads?parent_thread_id=null`;
                
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Failed to fetch threads');
                }
                
                const data = await response.json();
                setThreads(data);
                setFilteredThreads(data);
                
                // Get trending threads by sorting by views and comments
                const trending = [...data].sort((a, b) => {
                    const aScore = (a.view_count || 0) + (a.comment_count || 0) * 3;
                    const bScore = (b.view_count || 0) + (b.comment_count || 0) * 3;
                    return bScore - aScore;
                }).slice(0, 5);
                
                setTrendingThreads(trending);
                
                if (isLoggedIn) {
                    // Filter threads created by the current user
                    const userThreads = data.filter(thread => thread.username === username);
                    setMyThreads(userThreads);
                    
                    // In a real app, we would fetch subscribed threads from API
                    // For now, let's just set an empty array
                    setSubscribedThreads([]);
                }
                
                setError(null);
            } catch (err) {
                console.error('Error fetching threads:', err);
                setError('Failed to load threads');
            } finally {
                setIsLoading(false);
            }
        };

        fetchThreads();
    }, [isLoggedIn, username]);

    // Filter threads based on search query and selected categories
    useEffect(() => {
        if (threads.length) {
            let filtered = [...threads];
            
            // Filter by selected categories
            if (selectedCategories.length > 0) {
                filtered = filtered.filter(thread => 
                    selectedCategories.includes(thread.category_id)
                );
            }
            
            setFilteredThreads(filtered);
            
            // Handle search
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                const results = threads.filter(thread => 
                    thread.title.toLowerCase().includes(query) || 
                    thread.content.toLowerCase().includes(query) ||
                    (thread.username && thread.username.toLowerCase().includes(query))
                ).slice(0, 5);
                
                setSearchResults(results);
            } else {
                setSearchResults([]);
            }
        }
    }, [threads, selectedCategories, searchQuery]);
    
    const handleSearchFocus = () => {
        setShowSearchDropdown(true);
    };
    
    const handleSearchBlur = () => {
        // Delay hiding the dropdown to allow clicks on the results
        setTimeout(() => {
            setShowSearchDropdown(false);
        }, 200);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
        localStorage.setItem('sidebarCollapsed', !isSidebarCollapsed);
    };
    
    const toggleCategoryFilter = (categoryId) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryId)) {
                return prev.filter(id => id !== categoryId);
            } else {
                return [...prev, categoryId];
            }
        });
    };
    
    const handleSectionChange = (section) => {
        setActiveSection(section);
    };
    
    const handleSearchResultClick = (threadId) => {
        navigate(`/threads/${threadId}`);
        setShowSearchDropdown(false);
        setSearchQuery('');
    };
    
    const toggleSubscription = (threadId) => {
        // In a real app, this would call an API to subscribe/unsubscribe
        const isSubscribed = subscribedThreads.some(t => t.thread_id === threadId);
        
        if (isSubscribed) {
            setSubscribedThreads(prev => prev.filter(t => t.thread_id !== threadId));
        } else {
            const thread = threads.find(t => t.thread_id === threadId);
            if (thread) {
                setSubscribedThreads(prev => [...prev, thread]);
            }
        }
    };
    
    const isThreadSubscribed = (threadId) => {
        return subscribedThreads.some(t => t.thread_id === threadId);
    };
    
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Get user initials for avatar placeholder
    const getUserInitials = (name) => {
        if (!name) return '?';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <div className={`threads-container ${isDarkMode ? 'dark-mode' : ''}`}>
            {/* Sidebar */}
            <div 
                ref={sidebarRef}
                className={`threads-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isDarkMode ? 'dark-mode' : ''}`}
                style={sidebarWidth && !isSidebarCollapsed ? { width: `${sidebarWidth}px` } : {}}
            >
                <div className="sidebar-header">
                    <div className="sidebar-title-container">
                        <Link to="/books" className="back-to-books" title="Back to Books">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M19 12H5"></path>
                                <path d="M12 19l-7-7 7-7"></path>
                            </svg>
                        </Link>
                        <div className="project-logo">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                {/* Book Club Icon - Books with people discussing */}
                                <g strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    {/* Group of books */}
                                    <path d="M4 19.5c0-2.5 2-2.5 3-2.5 1.5 0 2 0.5 2 0.5v-10s-0.5-0.5-2-0.5c-1 0-3 0-3 2.5" />
                                    <path d="M9 7.5v10" />
                                    <path d="M9 7.5c0 0 0.5-0.5 2-0.5 1.5 0 2 0.5 2 0.5v10s-0.5-0.5-2-0.5c-1.5 0-2 0.5-2 0.5" />
                                    <path d="M13 7.5v10" />
                                    <path d="M13 7.5c0 0 0.5-0.5 2-0.5 1.5 0 2 0.5 2 0.5v10s-0.5-0.5-2-0.5c-1.5 0-2 0.5-2 0.5" />
                                    
                                    {/* Small group of people discussing (simplified) */}
                                    <circle cx="6" cy="4" r="1.5" strokeWidth="1.2" />  {/* Person 1 head */}
                                    <circle cx="12" cy="3" r="1.5" strokeWidth="1.2" /> {/* Person 2 head */}
                                    <circle cx="18" cy="4" r="1.5" strokeWidth="1.2" /> {/* Person 3 head */}
                                    
                                    {/* Discussion indicators */}
                                    <path d="M7.5 3c1 0 2 0.5 3 0" strokeWidth="1" /> {/* Discussion line */}
                                    <path d="M14 2.5c1 0 2.5 0.5 2.5 1" strokeWidth="1" /> {/* Discussion line */}
                                </g>
                            </svg>
                            {!isSidebarCollapsed && <h2 className="sidebar-title">Book Club</h2>}
                        </div>
                    </div>
                    <div className="sidebar-controls">
                        <button
                            className="toggle-sidebar"
                            onClick={toggleSidebar}
                            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                {isSidebarCollapsed ? (
                                    <>
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="9" y1="3" x2="9" y2="21"></line>
                                    </>
                                ) : (
                                    <>
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <line x1="15" y1="3" x2="15" y2="21"></line>
                                    </>
                                )}
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div className="sidebar-scrollable-content">
                    {/* Search Box */}
                    <div className="sidebar-search">
                        <div className="sidebar-search-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <input 
                            type="text"
                            className="sidebar-search-input"
                            placeholder="Search threads..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            onFocus={handleSearchFocus}
                            onBlur={handleSearchBlur}
                            ref={searchInputRef}
                        />
                        
                        {/* Search Dropdown */}
                        {showSearchDropdown && (
                            <div className="search-dropdown show">
                                <div className="search-dropdown-header">
                                    {searchResults.length > 0 ? 'Search Results' : 'Trending Threads'}
                                </div>
                                <div className="search-results">
                                    {searchResults.length > 0 ? (
                                        searchResults.map(thread => (
                                            <div 
                                                key={thread.thread_id} 
                                                className="search-result-item"
                                                onClick={() => handleSearchResultClick(thread.thread_id)}
                                            >
                                                <div className="search-result-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                    </svg>
                                                </div>
                                                <div className="search-result-content">
                                                    <div className="search-result-title">{thread.title}</div>
                                                    <div className="search-result-subtitle">by {thread.username}</div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        trendingThreads.map(thread => (
                                            <div 
                                                key={thread.thread_id} 
                                                className="search-result-item"
                                                onClick={() => handleSearchResultClick(thread.thread_id)}
                                            >
                                                <div className="search-result-icon">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                                    </svg>
                                                </div>
                                                <div className="search-result-content">
                                                    <div className="search-result-title">{thread.title}</div>
                                                    <div className="search-result-subtitle">by {thread.username}</div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Thread Sections */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <div className="sidebar-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                                </svg>
                                Browse
                            </div>
                        </div>
                        <div className="sidebar-items">
                            <div 
                                className={`sidebar-item ${activeSection === 'all' ? 'active' : ''}`}
                                onClick={() => handleSectionChange('all')}
                            >
                                <div className="sidebar-item-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                                        <polyline points="2 17 12 22 22 17"></polyline>
                                        <polyline points="2 12 12 17 22 12"></polyline>
                                    </svg>
                                </div>
                                <div className="sidebar-item-text">All Threads</div>
                            </div>
                            <div 
                                className={`sidebar-item ${activeSection === 'trending' ? 'active' : ''}`}
                                onClick={() => handleSectionChange('trending')}
                            >
                                <div className="sidebar-item-icon">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                                        <polyline points="17 6 23 6 23 12"></polyline>
                                    </svg>
                                </div>
                                <div className="sidebar-item-text">Trending</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* My Threads Section */}
                    {isLoggedIn && (
                        <div className="sidebar-section">
                            <div className="sidebar-section-header">
                                <div className="sidebar-section-title">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                                        <circle cx="12" cy="7" r="4"></circle>
                                    </svg>
                                    My Threads
                                </div>
                            </div>
                            <div className="sidebar-items">
                                <div 
                                    className={`sidebar-item ${activeSection === 'my-threads' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('my-threads')}
                                >
                                    <div className="sidebar-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                        </svg>
                                    </div>
                                    <div className="sidebar-item-text">Created by Me</div>
                                    {myThreads.length > 0 && (
                                        <span className="sidebar-item-badge">{myThreads.length}</span>
                                    )}
                                </div>
                                <div 
                                    className={`sidebar-item ${activeSection === 'subscribed' ? 'active' : ''}`}
                                    onClick={() => handleSectionChange('subscribed')}
                                >
                                    <div className="sidebar-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                        </svg>
                                    </div>
                                    <div className="sidebar-item-text">Subscribed</div>
                                    {subscribedThreads.length > 0 && (
                                        <span className="sidebar-item-badge">{subscribedThreads.length}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Categories Section */}
                    <div className="sidebar-section">
                        <div className="sidebar-section-header">
                            <div className="sidebar-section-title">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="8" y1="6" x2="21" y2="6"></line>
                                    <line x1="8" y1="12" x2="21" y2="12"></line>
                                    <line x1="8" y1="18" x2="21" y2="18"></line>
                                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                                </svg>
                                Categories
                            </div>
                        </div>
                        <div className="sidebar-items">
                            {categories.map(category => (
                                <div 
                                    key={category.category_id} 
                                    className={`sidebar-item ${selectedCategories.includes(category.category_id) ? 'active' : ''}`}
                                    onClick={() => toggleCategoryFilter(category.category_id)}
                                >
                                    <div className="sidebar-item-icon">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                                            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                                        </svg>
                                    </div>
                                    <div className="sidebar-item-text">{category.name}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Create Thread Button - Fixed at bottom */}
                {isLoggedIn && (
                    <div className="sidebar-create-thread">
                        <button onClick={() => {
                            console.log('Create Thread button clicked in sidebar, navigating to create-thread page');
                            navigate('/create-thread');
                        }} className="create-thread-btn">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                            <span>Create New Thread</span>
                        </button>
                    </div>
                )}
                
                {/* Resize Handle */}
                {!isSidebarCollapsed && (
                    <div 
                        className="sidebar-resize-handle"
                        ref={resizeHandleRef}
                        onMouseDown={() => setIsResizing(true)}
                    ></div>
                )}
            </div>
            
            {/* Main Content */}
            <div className="threads-content">
                <div className="threads-header">
                    <h1>
                        {activeSection === 'all' && 'All Threads'}
                        {activeSection === 'trending' && 'Trending Threads'}
                        {activeSection === 'my-threads' && 'My Threads'}
                        {activeSection === 'subscribed' && 'Subscribed Threads'}
                    </h1>
                    <p className="threads-subheader">
                        {activeSection === 'all' && 'Join the conversation about your favorite books'}
                        {activeSection === 'trending' && 'Popular discussions happening right now'}
                        {activeSection === 'my-threads' && 'Threads you have created'}
                        {activeSection === 'subscribed' && 'Threads you are following'}
                    </p>
                </div>

                {error && (
                    <div className="error-message">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                        {error}
                    </div>
                )}

                {isLoading ? (
                    <div className="loading-spinner">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="12" y1="2" x2="12" y2="6"></line>
                            <line x1="12" y1="18" x2="12" y2="22"></line>
                            <line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
                            <line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
                            <line x1="2" y1="12" x2="6" y2="12"></line>
                            <line x1="18" y1="12" x2="22" y2="12"></line>
                            <line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
                            <line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
                        </svg>
                    </div>
                ) : filteredThreads.length === 0 ? (
                    <div className="no-threads">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="8" y1="12" x2="16" y2="12"></line>
                        </svg>
                        <p>No threads found in this section. {isLoggedIn && activeSection === 'all' && "Be the first to create one!"}</p>
                        {isLoggedIn && (
                            <button 
                                onClick={() => navigate('/create-thread')} 
                                className="create-thread-btn"
                                style={{ maxWidth: '200px' }}
                            >
                                Create Thread
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="threads-list">
                        {filteredThreads.map(thread => (
                            <div key={thread.thread_id} className="thread-card">
                                <div className="thread-card-header">
                                    <h2 className="thread-title">
                                        <Link to={`/threads/${thread.thread_id}`}>
                                            {thread.title}
                                        </Link>
                                    </h2>
                                    <div className="thread-actions">
                                        {isLoggedIn && thread.username === username && (
                                            <Link to={`/threads/${thread.thread_id}/edit`} className="thread-action-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                                </svg>
                                            </Link>
                                        )}
                                        {thread.is_pinned && (
                                            <div className="thread-action-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M12 2L12 16"></path>
                                                    <path d="M7 7H17"></path>
                                                    <path d="M17 22H7"></path>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="thread-meta">
                                    <div className="thread-author">
                                        <div className="thread-author-avatar">
                                            {getUserInitials(thread.username)}
                                        </div>
                                        <Link to={`/user/${thread.username}`} className="thread-author-name">
                                            {thread.username}
                                        </Link>
                                    </div>
                                    <div className="thread-date">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                                            <line x1="16" y1="2" x2="16" y2="6"></line>
                                            <line x1="8" y1="2" x2="8" y2="6"></line>
                                            <line x1="3" y1="10" x2="21" y2="10"></line>
                                        </svg>
                                        {formatDate(thread.created_at)}
                                    </div>
                                    {thread.category_name && (
                                        <div className="thread-category">
                                            {thread.category_name}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="thread-preview">
                                    {thread.content.length > 180
                                        ? `${thread.content.substring(0, 180)}...` 
                                        : thread.content}
                                </div>
                                
                                <div className="thread-footer">
                                    <div className="thread-stats">
                                        <div className="thread-stat">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                            {thread.view_count || 0} views
                                        </div>
                                        <div className="thread-stat">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                                            </svg>
                                            {thread.comment_count || 0} comments
                                        </div>
                                        <div className="vote-buttons">
                                            <button className="vote-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="18 15 12 9 6 15"></polyline>
                                                </svg>
                                            </button>
                                            <span className="vote-count">0</span>
                                            <button className="vote-btn">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="6 9 12 15 18 9"></polyline>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="thread-actions">
                                        {isLoggedIn && (
                                            <>
                                                <button 
                                                    className={`thread-subscribe ${isThreadSubscribed(thread.thread_id) ? 'subscribed' : ''}`}
                                                    onClick={() => toggleSubscription(thread.thread_id)}
                                                >
                                                    {isThreadSubscribed(thread.thread_id) ? (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                                            </svg>
                                                            Subscribed
                                                        </>
                                                    ) : (
                                                        <>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                                                            </svg>
                                                            Subscribe
                                                        </>
                                                    )}
                                                </button>
                                                
                                                <button 
                                                    className="reply-btn"
                                                    onClick={() => navigate(`/threads/${thread.thread_id}/reply`)}
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                                    </svg>
                                                    Reply
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Threads;