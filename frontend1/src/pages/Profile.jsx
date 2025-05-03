import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/profile.css';
import { FaBook, FaTrash, FaPlus, FaHeart, FaUser, FaTags } from 'react-icons/fa';

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

    // Wishlist states
    const [wishlists, setWishlists] = useState([]);
    const [selectedWishlist, setSelectedWishlist] = useState(null);
    const [wishlistBooks, setWishlistBooks] = useState([]);
    const [newWishlistName, setNewWishlistName] = useState('');
    const [creatingWishlist, setCreatingWishlist] = useState(false);
    const [loadingWishlist, setLoadingWishlist] = useState(false);
    
    // Following state
    const [following, setFollowing] = useState([]);
    const [loadingFollowing, setLoadingFollowing] = useState(false);

    // Genre states
    const [showGenreEditor, setShowGenreEditor] = useState(false);
    const [genreError, setGenreError] = useState('');
    const [loadingGenres, setLoadingGenres] = useState(false);
    const [allGenres, setAllGenres] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [userGenres, setUserGenres] = useState([]);
    const [savingGenres, setSavingGenres] = useState(false);

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

                // Fetch wishlists after successfully loading profile
                fetchWishlists();
                // Fetch following data
                fetchFollowing();
                // Fetch genres data
                fetchGenres();
                fetchUserGenres();

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

    // Fetch users that the current user is following
    const fetchFollowing = async () => {
        setLoadingFollowing(true);
        try {
            const response = await fetch(`${apiUrl}/api/user/following`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setFollowing(data || []);
            } else {
                console.error('Failed to fetch following data');
                setFollowing([]);
            }
        } catch (error) {
            console.error('Error fetching following:', error);
            setFollowing([]);
        } finally {
            setLoadingFollowing(false);
        }
    };

    // // Unfollow a user
    // const handleUnfollow = async (userId) => {
    //     try {
    //         const username = following.find(f => f.user_id === userId)?.username;
    //         if (!username) return;
            
    //         const response = await fetch(`${apiUrl}/user/follow/${username}`, {
    //             method: 'POST',
    //             credentials: 'include'
    //         });
            
    //         if (response.ok) {
    //             // Remove the unfollowed user from the following list
    //             setFollowing(prev => prev.filter(f => f.user_id !== userId));
    //         } else {
    //             console.error('Failed to unfollow user');
    //         }
    //     } catch (error) {
    //         console.error('Error unfollowing user:', error);
    //     }
    // };



const fetchGenres = async () => {
        try {
            const response = await fetch(`${apiUrl}/books-data`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setAllGenres(data.genres || []);
            } else {
                console.error('Failed to fetch genres');
            }
        } catch (error) {
            console.error('Error fetching genres:', error);
        }
    };

    // Fetch user's selected genres
    const fetchUserGenres = async () => {
        setLoadingGenres(true);
        try {
            const response = await fetch(`${apiUrl}/api/user/genres`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setUserGenres(data);
                setSelectedGenres(data.map(genre => genre.id));
            } else {
                console.error('Failed to fetch user genres');
            }
        } catch (error) {
            console.error('Error fetching user genres:', error);
        } finally {
            setLoadingGenres(false);
        }
    };







    // Fetch user's wishlists
    const fetchWishlists = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/wishlists`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setWishlists(data);
            } else {
                console.error('Failed to fetch wishlists');
            }
        } catch (error) {
            console.error('Error fetching wishlists:', error);
        }
    };

    // Fetch books in a wishlist
    const fetchWishlistBooks = async (wishlistId) => {
        setLoadingWishlist(true);
        try {
            const response = await fetch(`${apiUrl}/api/wishlists/${wishlistId}/books`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setWishlistBooks(data);
                setSelectedWishlist(wishlists.find(w => w.wishlist_id === parseInt(wishlistId)));
            } else {
                console.error('Failed to fetch wishlist books');
                setWishlistBooks([]);
            }
        } catch (error) {
            console.error('Error fetching wishlist books:', error);
            setWishlistBooks([]);
        } finally {
            setLoadingWishlist(false);
        }
    };

    // Create a new wishlist
    const createWishlist = async (e) => {
        e.preventDefault();
        if (!newWishlistName.trim()) return;

        try {
            const response = await fetch(`${apiUrl}/api/wishlists`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: newWishlistName.trim()
                })
            });

            if (response.ok) {
                const newWishlist = await response.json();
                setWishlists(prev => [newWishlist, ...prev]);
                setNewWishlistName('');
                setCreatingWishlist(false);
            } else {
                console.error('Failed to create wishlist');
            }
        } catch (error) {
            console.error('Error creating wishlist:', error);
        }
    };

    // Delete a wishlist
    const deleteWishlist = async (wishlistId) => {
        if (!window.confirm('Are you sure you want to delete this wishlist?')) return;

        try {
            const response = await fetch(`${apiUrl}/api/wishlists/${wishlistId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setWishlists(prev => prev.filter(w => w.wishlist_id !== wishlistId));
                if (selectedWishlist && selectedWishlist.wishlist_id === wishlistId) {
                    setSelectedWishlist(null);
                    setWishlistBooks([]);
                }
            } else {
                console.error('Failed to delete wishlist');
            }
        } catch (error) {
            console.error('Error deleting wishlist:', error);
        }
    };

    // Remove a book from wishlist
    const removeBookFromWishlist = async (bookId) => {
        if (!selectedWishlist) return;
        
        try {
            const response = await fetch(`${apiUrl}/api/wishlists/${selectedWishlist.wishlist_id}/books/${bookId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                setWishlistBooks(prev => prev.filter(book => book.id !== parseInt(bookId)));
                
                // Update book count in wishlists
                setWishlists(prev => prev.map(w => 
                    w.wishlist_id === selectedWishlist.wishlist_id 
                        ? {...w, book_count: parseInt(w.book_count) - 1} 
                        : w
                ));
            } else {
                console.error('Failed to remove book from wishlist');
            }
        } catch (error) {
            console.error('Error removing book from wishlist:', error);
        }
    };

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

    // Handle genre selection/deselection
    const handleToggleGenre = (genreId) => {
        setSelectedGenres(prev => {
            if (prev.includes(genreId)) {
                return prev.filter(id => id !== genreId);
            } else {
                return [...prev, genreId];
            }
        });
    };

    // Save selected genres to the server
    const handleSaveGenres = async () => {
        setGenreError('');
        
        if (selectedGenres.length < 3) {
            setGenreError('Please select at least 3 genres.');
            return;
        }

        setSavingGenres(true);
        try {
            const response = await fetch(`${apiUrl}/api/user/genres`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ genres: selectedGenres })
            });

            if (response.ok) {
                // Update the user genres list after saving
                await fetchUserGenres();
                setShowGenreEditor(false);
            } else {
                const errorData = await response.json();
                setGenreError(errorData.message || 'Failed to save genres.');
            }
        } catch (error) {
            console.error('Error saving genres:', error);
            setGenreError('An error occurred while saving your genre preferences.');
        } finally {
            setSavingGenres(false);
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

                    {/* Wishlists Section */}
                    <div className="wishlists-section">
                        <div className="wishlists-header">
                            <h2>Your Wishlists</h2>
                            {/* <button 
                                className="add-wishlist-button"
                                onClick={() => setCreatingWishlist(true)}
                                disabled={creatingWishlist}
                            >
                                <FaPlus /> New Wishlist
                            </button> */}
                        </div>

                        {creatingWishlist && (
                            <div className="create-wishlist-form">
                                <form onSubmit={createWishlist}>
                                    <input
                                        type="text"
                                        placeholder="Wishlist name"
                                        value={newWishlistName}
                                        onChange={(e) => setNewWishlistName(e.target.value)}
                                        required
                                    />
                                    <div className="form-actions">
                                        <button type="submit" disabled={!newWishlistName.trim()}>
                                            Create
                                        </button>
                                        <button type="button" onClick={() => {
                                            setCreatingWishlist(false);
                                            setNewWishlistName('');
                                        }}>
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        <div className="wishlists-container">
                            <div className="wishlists-list">
                                {wishlists.length > 0 ? (
                                    wishlists.map(wishlist => (
                                        <div 
                                            key={wishlist.wishlist_id} 
                                            className={`wishlist-item ${selectedWishlist && selectedWishlist.wishlist_id === wishlist.wishlist_id ? 'selected' : ''}`}
                                        >
                                            <div 
                                                className="wishlist-name"
                                                onClick={() => fetchWishlistBooks(wishlist.wishlist_id)}
                                            >
                                                <FaHeart className="wishlist-icon" />
                                                <span>{wishlist.name}</span>
                                                <span className="book-count">({wishlist.book_count} books)</span>
                                            </div>
                                            <button 
                                                className="delete-wishlist-btn"
                                                onClick={() => deleteWishlist(wishlist.wishlist_id)}
                                                title="Delete wishlist"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-wishlists">You don't have any wishlists yet.</p>
                                )}
                            </div>

                            <div className="wishlist-books-container">
                                {selectedWishlist ? (
                                    <>
                                        <h3>{selectedWishlist.name} ({wishlistBooks.length} books)</h3>
                                        {loadingWishlist ? (
                                            <div className="loading-indicator">Loading books...</div>
                                        ) : wishlistBooks.length > 0 ? (
                                            <div className="wishlist-books-grid">
                                                {wishlistBooks.map(book => (
                                                    <div key={book.id} className="wishlist-book-card">
                                                        <div className="book-cover-container">
                                                            {book.coverurl ? (
                                                                <img 
                                                                    src={book.coverurl} 
                                                                    alt={book.title}
                                                                    className="book-cover" 
                                                                    onClick={() => navigate(`/books/${book.id}`)}
                                                                />
                                                            ) : (
                                                                <div 
                                                                    className="book-cover-placeholder"
                                                                    onClick={() => navigate(`/books/${book.id}`)}
                                                                >
                                                                    <FaBook />
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="book-info">
                                                            <div className="book-details">
                                                                <h4 
                                                                    className="book-title"
                                                                    onClick={() => navigate(`/books/${book.id}`)}
                                                                >
                                                                    {book.title}
                                                                </h4>
                                                                <p className="book-author">by {book.author}</p>
                                                                {book.description && (
                                                                    <p className="book-description">
                                                                        {book.description.length > 150 
                                                                            ? book.description.substring(0, 150) + '...' 
                                                                            : book.description}
                                                                    </p>
                                                                )}
                                                            </div>
                                                            <div className="book-actions">
                                                                <button 
                                                                    className="remove-book-btn" 
                                                                    onClick={() => removeBookFromWishlist(book.id)}
                                                                    title="Remove from wishlist"
                                                                >
                                                                    <FaTrash /> Remove
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="no-books">No books in this wishlist.</p>
                                        )}
                                    </>
                                ) : (
                                    <div className="select-wishlist-message">
                                        <FaHeart className="large-heart-icon" />
                                        <p>Select a wishlist to view books</p>
                                    </div>
                                )}
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

                    {/* Quick Links */}
                    <div className="profile-section">
                        <h3>Quick Links</h3>
                        <div className="quick-links">
                            <Link to="/dashboard" className="quick-link">
                                <FaBook /> Dashboard
                            </Link>
                            <Link to="/messages" className="quick-link">
                                <FaUser /> Messages
                            </Link>
                            <button 
                                className="quick-link" 
                                onClick={() => setCreatingWishlist(true)}
                            >
                                <FaPlus /> Create New Wishlist
                            </button>
                            <button 
                                className="quick-link" 
                                onClick={() => setShowGenreEditor(!showGenreEditor)}
                            >
                                <FaTags /> Manage Interested Genres
                            </button>
                        </div>

                        {/* Genre Editor */}
                        {showGenreEditor && (
                            <div className="genre-editor">
                                <h3>Update Your Genre Interests</h3>
                                <p>Please select at least 3 genres that you're interested in.</p>
                                
                                {genreError && <div className="error-message">{genreError}</div>}
                                
                                <div className="genres-container">
                                    {loadingGenres ? (
                                        <div className="loading-spinner">Loading genres...</div>
                                    ) : (
                                        <div className="genre-grid">
                                            {allGenres.map(genre => (
                                                <div 
                                                    key={genre.id} 
                                                    className={`genre-item ${selectedGenres.includes(genre.id) ? 'selected' : ''}`}
                                                    onClick={() => handleToggleGenre(genre.id)}
                                                >
                                                    {genre.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="genre-actions">
                                    <button 
                                        onClick={handleSaveGenres} 
                                        disabled={savingGenres}
                                        className="primary-button"
                                    >
                                        {savingGenres ? 'Saving...' : 'Save Genres'}
                                    </button>
                                    <button 
                                        onClick={() => {
                                            setShowGenreEditor(false);
                                            // Reset selected genres to user's current genres
                                            setSelectedGenres(userGenres.map(genre => genre.id));
                                        }}
                                        className="secondary-button"
                                        disabled={savingGenres}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Wishlist Stats */}
                    {wishlists.length > 0 && (
                        <div className="wishlist-stats-section">
                            <h3>Your Wishlist Stats</h3>
                            <div className="stats-container">
                                <div className="stat-item">
                                    <span className="stat-value">{wishlists.length}</span>
                                    <span className="stat-label">Wishlists</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-value">
                                        {wishlists.reduce((total, wishlist) => 
                                            total + parseInt(wishlist.book_count || 0), 0)}
                                    </span>
                                    <span className="stat-label">Saved Books</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Reading Activity Section */}
                    <div className="reading-activity-section">
                        <h3>Reading Activity</h3>
                        <div className="activity-summary">
                            <p>
                                <strong>{ratedBooks.length}</strong> books rated
                            </p>
                            <p>
                                <strong>{ratedBooks.filter(book => book.comment).length}</strong> reviews written
                            </p>
                        </div>
                    </div>

                    {/* Following Section - Updated */}
                    <div className="following-section">
                        <h3>Following</h3>
                        <div className="following-list">
                            {loadingFollowing ? (
                                <div className="loading-indicator">Loading...</div>
                            ) : following.length > 0 ? (
                                <ul className="following-users-list">
                                    {following.map(user => (
                                        <li key={user.user_id} className="following-user-item">
                                            <Link 
                                                to={`/user/${user.username}`} 
                                                className="following-username-link"
                                            >
                                                <FaUser className="user-icon" />
                                                <span>{user.username}</span>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="empty-following">
                                    <p>You aren't following anyone yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
