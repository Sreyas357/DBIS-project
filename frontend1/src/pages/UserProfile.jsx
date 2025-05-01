import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; // Import useNavigate for redirection
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/user-profile.css';

const UserProfile = () => {
    const { username } = useParams();
    const navigate = useNavigate(); // Initialize navigate function
    const [userData, setUserData] = useState({
        user: null,
        ratedBooks: [],
        loading: true,
        error: null
    });

    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const response = await fetch(`${apiUrl}/user/${username}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!response.ok) {
                    throw new Error('User not found');
                }

                const data = await response.json();

                setUserData({
                    user: data.user,
                    ratedBooks: data.ratedBooks || [],
                    loading: false,
                    error: null
                });

                setIsFollowing(data.isFollowing || false);

            } catch (error) {
                setUserData({
                    user: null,
                    ratedBooks: [],
                    loading: false,
                    error: error.message
                });
            }
        };

        fetchUserData();
    }, [username]);

    const handleFollow = async () => {
        try {
            const response = await fetch(`${apiUrl}/user/follow/${username}`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.ok) {
                const data = await response.json();
                setIsFollowing(data.message === 'Followed successfully');
            } else {
                const error = await response.json();
                console.error('Follow error:', error.message || error.error);
            }
        } catch (err) {
            console.error('Error in follow/unfollow:', err);
        }
    };

    // Navigate to the message page and pass user info as state
    const handleMessage = () => {
        if (user && user.user_id) {
            navigate('/messages', { state: { selectedUser: { user_id: user.user_id, username: user.username } } });
        }
    };

    const { user, ratedBooks, loading, error } = userData;

    if (loading) return <div className="loading-spinner">Loading...</div>;
    if (error) return <div className="error-message">{error}</div>;
    if (!user) return <div className="not-found">User not found</div>;

    // Check if it's the logged-in user's own profile
    const isOwnProfile = user.user_id === 123; // Replace 123 with the current user's ID

    return (
        <>
            <Navbar />
            <div className="user-profile-container">
                <div className="user-profile-header">
                    <h1>{user.username}'s Profile</h1>
                    <div className="user-info">
                        <div className="info-item">
                            <span className="label">Username:</span>
                            <span className="value">{user.username}</span>
                        </div>
                        <div className="info-item">
                            <span className="label">Total Rated Books:</span>
                            <span className="value">{ratedBooks.length}</span>
                        </div>
                    </div>

                    {/* 👤 Follow Button */}
                    <div className="follow-button-wrapper">
                        <button
                            className={isFollowing ? 'following-btn' : 'follow-btn'}
                            onClick={handleFollow}
                        >
                            {isFollowing ? 'Following' : 'Follow'}
                        </button>
                    </div>

                    {/* 💬 Message Button - only show if not the logged-in user */}
                    {!isOwnProfile && (
                        <div className="message-button-wrapper">
                            <button className="message-btn" onClick={handleMessage}>
                                Message
                            </button>
                        </div>
                    )}
                </div>

                <div className="rated-books-section">
                    <h2>Rated Books</h2>
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
                                        <span>Rating: </span>
                                        <StarRating rating={book.rating} interactive={false} />
                                        <span className="rating-value">({book.rating}/5)</span>
                                    </div>
                                    {book.comment && (
                                        <div className="book-comment">
                                            <span>Comment: </span>
                                            <p>"{book.comment}"</p>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="no-books">This user hasn't rated any books yet.</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default UserProfile;
