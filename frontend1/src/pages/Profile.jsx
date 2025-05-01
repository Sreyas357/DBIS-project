import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/profile.css';

const Profile = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        user: null,
        ratedBooks: [],
        loading: true,
        error: null
    });

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

            } catch (error) {
                setUserData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
                console.error("Profile error:", error);
            }
        };

        fetchProfileData();
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
                                        {book.comment && (
                                            <div className="book-comment">
                                                <span>Your Comment: </span>
                                                <p>"{book.comment}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-books">You haven't rated any books yet.</div>
                        )}
                    </div>
                </div>

                {/* Right Side - Search Box */}
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
                </div>
            </div>
        </>
    );
};

export default Profile;
