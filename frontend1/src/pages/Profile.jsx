import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/profile.css';
import { FaBook, FaUser, FaLock, FaGlobeAmericas } from 'react-icons/fa';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        user: null,
        ratedBooks: [],
        loading: true,
        error: null
    });
    const [friends, setFriends] = useState({
        list: [],
        loading: true,
        error: null
    });
    const [bookStatuses, setBookStatuses] = useState({});

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const searchRef = useRef(null);
    const debounceTimeout = useRef(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const userResponse = await fetch(`${apiUrl}/user/profile`, {
                    credentials: 'include'
                });

                if (!userResponse.ok) {
                    throw new Error('Failed to fetch profile data');
                }

                const data = await userResponse.json();

                setUserData({
                    user: data.user,
                    ratedBooks: data.ratedBooks || [],
                    loading: false,
                    error: null
                });

                // Fetch book statuses for each rated book
                if (data.ratedBooks && data.ratedBooks.length > 0) {
                    try {
                        const statusResponse = await fetch(`${apiUrl}/user/book-statuses`, {
                            credentials: 'include'
                        });
                        
                        if (statusResponse.ok) {
                            const statusData = await statusResponse.json();
                            const statusMap = {};
                            
                            statusData.forEach(status => {
                                statusMap[status.book_id] = {
                                    status: status.status,
                                    isPrivate: status.is_private
                                };
                            });
                            
                            setBookStatuses(statusMap);
                        }
                    } catch (err) {
                        console.error("Error fetching book statuses:", err);
                    }
                }

            } catch (error) {
                setUserData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
                console.error("Profile error:", error);
            }
        };

        const fetchFriends = async () => {
            try {
                console.log('Fetching friends from API:', `${apiUrl}/user/friends`);
                // First check if user is logged in
                const checkLoginResponse = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: 'include'
                });
                
                if (!checkLoginResponse.ok) {
                    console.error('User not logged in, cannot fetch friends');
                    throw new Error('User not logged in');
                }
                
                // Now fetch friends
                const response = await fetch(`${apiUrl}/user/friends`, {
                    method: 'GET',
                    credentials: 'include',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                console.log('Friends API response status:', response.status);
                
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`Friends API error: ${response.status}, ${errorText}`);
                    throw new Error(`Failed to fetch friends: ${response.status}`);
                }

                const data = await response.json();
                console.log('Friends data received:', data);
                
                if (!data.friends) {
                    console.error('Invalid friends data format:', data);
                    throw new Error('Invalid friends data format');
                }
                
                setFriends({
                    list: data.friends || [],
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error("Failed to fetch friends:", error);
                setFriends({
                    list: [],
                    loading: false,
                    error: error.message
                });
            }
        };

        fetchProfileData();
        fetchFriends();
    }, []);

    // Handle click outside of search box to close dropdown
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Debounced search as user types
    useEffect(() => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        if (searchTerm.trim()) {
            debounceTimeout.current = setTimeout(() => {
                handleSearch();
            }, 300);
        } else {
            setSearchResults([]);
            setShowDropdown(false);
        }

        return () => {
            if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        };
    }, [searchTerm]);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setSearchResults([]);
            setShowDropdown(false);
            return;
        }

        try {
            const response = await fetch(`${apiUrl}/user/search?username=${searchTerm}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setSearchResults(data.users.slice(0, 6)); // Limit to 6 results
                setShowDropdown(data.users.length > 0);
                setSelectedIndex(-1);
            } else {
                console.error('Search failed');
                setShowDropdown(false);
            }
        } catch (err) {
            console.error('Error during search:', err);
            setShowDropdown(false);
        }
    };

    const handleUsernameClick = (username) => {
        navigate(`/user/${username}`);
        setShowDropdown(false);
        setSearchTerm('');
    };

    const handleFriendClick = (username) => {
        navigate(`/user/${username}`);
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'plan_to_read': return 'Plan to Read';
            case 'reading': return 'Currently Reading';
            case 'completed': return 'Completed';
            case 'on_hold': return 'On Hold';
            case 'dropped': return 'Dropped';
            default: return 'Unknown Status';
        }
    };

    const handleKeyDown = (e) => {
        if (!showDropdown || searchResults.length === 0) return;

        // Arrow down
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev < searchResults.length - 1 ? prev + 1 : 0
            );
        }
        // Arrow up
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => 
                prev > 0 ? prev - 1 : searchResults.length - 1
            );
        }
        // Enter
        else if (e.key === 'Enter' && selectedIndex >= 0) {
            e.preventDefault();
            handleUsernameClick(searchResults[selectedIndex].username);
        }
        // Escape
        else if (e.key === 'Escape') {
            setShowDropdown(false);
        }
    };

    const { user, ratedBooks, loading, error } = userData;

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!user) return <div className="not-found">User not found</div>;

    return (
        <>
            <Navbar />
            <div className="profile-container">
                {/* Left Side - Profile Info */}
                <div className="profile-content">
                    {/* 👤 User Profile Info */}
                    <div className="profile-header">
                        <h1>Your Profile</h1>
                        <div className="user-info">
                            <div className="info-item">
                                <span className="label">Name:</span>
                                <span className="value">{user.username}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Email:</span>
                                <span className="value">{user.email}</span>
                            </div>
                            <div className="info-item">
                                <span className="label">Total Rated Books:</span>
                                <span className="value">{ratedBooks.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* 📚 Rated Books Section */}
                    <div className="rated-books-section">
                        <h2>Your Rated Books</h2>
                        {ratedBooks.length > 0 ? (
                            <div className="books-list">
                                {ratedBooks.map(book => (
                                    <div key={book.book_id} className="book-card">
                                        <div className="book-cover">
                                            {book.coverurl ? (
                                                <img 
                                                    src={book.coverurl} 
                                                    alt={book.title}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.style.display = "none";
                                                        const bookIcon = document.createElement('div');
                                                        bookIcon.className = "book-cover-placeholder";
                                                        const icon = document.createElement('span');
                                                        icon.innerHTML = '<svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 448 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><path d="M448 360V24c0-13.3-10.7-24-24-24H96C43 0 0 43 0 96v320c0 53 43 96 96 96h328c13.3 0 24-10.7 24-24v-16c0-7.5-3.5-14.3-8.9-18.7-4.2-15.4-4.2-59.3 0-74.7 5.4-4.3 8.9-11.1 8.9-18.6zM128 134c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm0 64c0-3.3 2.7-6 6-6h212c3.3 0 6 2.7 6 6v20c0 3.3-2.7 6-6 6H134c-3.3 0-6-2.7-6-6v-20zm253.4 250H96c-17.7 0-32-14.3-32-32 0-17.6 14.4-32 32-32h285.4c-1.9 17.1-1.9 46.9 0 64z"></path></svg>';
                                                        bookIcon.appendChild(icon);
                                                        e.target.parentNode.appendChild(bookIcon);
                                                    }}
                                                />
                                            ) : (
                                                <div className="book-cover-placeholder">
                                                    <FaBook />
                                                </div>
                                            )}
                                        </div>
                                        <div className="book-info">
                                            <div 
                                                className="book-title clickable"
                                                onClick={() => navigate(`/books/${book.book_id}`)}
                                            >
                                                {book.title}
                                            </div>
                                            <div className="book-author">by {book.author}</div>
                                            <div className="book-rating">
                                                <span>Your Rating: </span>
                                                <StarRating rating={book.rating} interactive={false} />
                                                <span className="rating-value">({book.rating}/5)</span>
                                            </div>
                                            {bookStatuses[book.book_id] && (
                                                <div className="book-status">
                                                    <div className={`status-badge ${bookStatuses[book.book_id].status}`}>
                                                        {getStatusLabel(bookStatuses[book.book_id].status)}
                                                    </div>
                                                    <div className="privacy-badge">
                                                        {bookStatuses[book.book_id].isPrivate ? (
                                                            <><FaLock size={10} /> Private</>
                                                        ) : (
                                                            <><FaGlobeAmericas size={10} /> Public</>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                            {book.comment && (
                                                <div className="book-comment">
                                                    <span>Your Comment: </span>
                                                    <p>"{book.comment}"</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-books">You haven't rated any books yet.</div>
                        )}
                    </div>
                </div>

                {/* Right Side - Search and Friends */}
                <div className="search-section">
                    <div className="search-box" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="Search users by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onFocus={() => {
                                if (searchResults.length > 0) setShowDropdown(true);
                            }}
                            onKeyDown={handleKeyDown}
                        />
                        <button onClick={handleSearch} aria-label="Search"></button>
                        {showDropdown && searchResults.length > 0 && (
                            <div className="search-dropdown">
                                {searchResults.map((u, index) => (
                                    <div
                                        key={u.user_id}
                                        className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                                        onClick={() => handleUsernameClick(u.username)}
                                        onMouseEnter={() => setSelectedIndex(index)}
                                    >
                                        {u.username}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Friends Section */}
                    <div className="friends-section">
                        <h2>Your Friends</h2>
                        {friends.loading ? (
                            <div className="loading-spinner">Loading friends...</div>
                        ) : friends.error ? (
                            <div className="error-message">{friends.error}</div>
                        ) : friends.list.length > 0 ? (
                            <div className="friends-list">
                                {friends.list.map(friend => (
                                    <div 
                                        key={friend.user_id} 
                                        className="friend-card"
                                        onClick={() => handleFriendClick(friend.username)}
                                    >
                                        <div className="friend-avatar">
                                            <FaUser className="friend-avatar-icon" />
                                        </div>
                                        <div className="friend-name">{friend.username}</div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-friends">You don't have any friends yet. Search for users to connect with!</div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
