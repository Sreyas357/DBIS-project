import React, { useState, useEffect } from 'react';
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

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;

        try {
            const response = await fetch(`${apiUrl}/user/search?username=${searchTerm}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                console.log(data);
                setSearchResults(data.users.slice(0, 4)); // Limit to 4 results
            } else {
                console.error('Search failed');
            }
        } catch (err) {
            console.error('Error during search:', err);
        }
    };

    const handleUsernameClick = (username) => {
        navigate(`/user/${username}`);
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
                                        <div className="book-title">{book.title}</div>
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
                                        <button
                                            className="view-book-btn"
                                            onClick={() => navigate(`/books/${book.book_id}`)}
                                        >
                                            View Book
                                        </button>
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
                    <div className="search-box">
                        <input
                            type="text"
                            placeholder="Search users by username..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <button onClick={handleSearch}>Search</button>
                        {searchResults.length > 0 && (
                            <div className="search-dropdown">
                                {searchResults.map((u) => (
                                    <div
                                        key={u.user_id}
                                        className="search-result-item"
                                        onClick={() => handleUsernameClick(u.username)}
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
