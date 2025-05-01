import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/book-details.css';
import { FaBook, FaArrowLeft, FaUser, FaClock } from 'react-icons/fa';

const BookDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bookData, setBookData] = useState({
        book: null,
        genres: [],
        loading: true,
        error: null
    });
    const [userReview, setUserReview] = useState(null);
    const [bookReviews, setBookReviews] = useState([]);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isReviewFormVisible, setIsReviewFormVisible] = useState(false);
    
    // Check login status
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: "include"
                });
                setIsLoggedIn(response.ok);
            } catch (error) {
                console.error("Login check error:", error);
                setIsLoggedIn(false);
            }
        };
        
        checkLoginStatus();
    }, []);

    const handleRateBook = async (newRating) => {
        try {
            const response = await fetch(`${apiUrl}/rate-book`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    book_id: id,
                    rating: newRating
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to update rating');
            }

            const result = await response.json();

            setBookData(prev => ({
                ...prev,
                book: {
                    ...prev.book,
                    avg_rating: result.avg_rating,
                    num_ratings: result.num_ratings
                }
            }));

            // Update user review state to reflect new rating
            setUserReview(prev => ({
                ...prev,
                rating: newRating,
                book_id: id
            }));
            
            // If the user has already written a comment, update the rating in their review too
            if (userReview?.comment) {
                try {
                    await fetch(`${apiUrl}/books/${id}/comment`, {
                        method: "POST",
                        credentials: "include",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({
                            comment: userReview.comment,
                            rating: newRating
                        }),
                    });
                    
                    // Refresh all reviews to show the updated rating in the comments section
                    fetchBookReviews();
                } catch (error) {
                    console.error("Error updating comment rating:", error);
                    // We don't want to show an error here since the rating itself was updated successfully
                }
            }

        } catch (error) {
            console.error("Rating error:", error);
            alert("Failed to save rating. Please try again.");
        }
    };
    
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        
        if (!isLoggedIn) {
            alert("Please log in to leave a comment");
            return;
        }
        
        if (!commentText.trim()) {
            alert("Comment cannot be empty");
            return;
        }
        
        // Check if the user has rated the book
        if (!userReview?.rating || userReview.rating === 0) {
            alert("Please rate the book before posting a comment");
            return;
        }
        
        setSubmitting(true);
        
        try {
            const response = await fetch(`${apiUrl}/books/${id}/comment`, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    comment: commentText,
                    rating: userReview?.rating || 0
                }),
            });

            if (!response.ok) throw new Error('Failed to save comment');
            
            // Update user review state
            setUserReview(prev => ({
                ...prev,
                comment: commentText
            }));
            
            // Hide the form after successful submission
            setIsReviewFormVisible(false);
            
            // Clear comment box
            setCommentText('');
            
            // Refresh all reviews
            fetchBookReviews();
            
        } catch (error) {
            console.error("Comment error:", error);
            alert("Failed to save comment. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const fetchBookReviews = async () => {
        try {
            const response = await fetch(`${apiUrl}/books/${id}/reviews`, {
                credentials: "include"
            });
            
            if (!response.ok) throw new Error("Failed to fetch reviews");
            
            const reviews = await response.json();
            setBookReviews(reviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setBookData(prev => ({ ...prev, loading: true, error: null }));
                console.log(`Fetching book with ID: ${id}`); // Debug logging

                const bookResponse = await fetch(`${apiUrl}/books/${id}`);
                if (!bookResponse.ok) {
                    console.error(`Book fetch error: ${bookResponse.status}`);
                    throw new Error('Failed to fetch book');
                }

                const bookData = await bookResponse.json();
                console.log('Book data received:', bookData); // Debug logging

                try {
                    const reviewResponse = await fetch(`${apiUrl}/user/reviews`, {
                        credentials: 'include'
                    });
                    if (reviewResponse.ok) {
                        const reviews = await reviewResponse.json();
                        setUserReview(reviews.find(r => r.book_id == id)); // Use == for type coercion
                    }
                } catch (e) {
                    console.log("No user review found");
                }
                
                // Fetch all reviews for this book
                fetchBookReviews();

                setBookData({
                    book: bookData,
                    genres: bookData.genres || [],
                    loading: false,
                    error: null
                });
            } catch (error) {
                console.error('Error fetching book:', error);
                setBookData(prev => ({
                    ...prev,
                    loading: false,
                    error: error.message
                }));
            }
        };

        if (id) {
            fetchData();
        } else {
            setBookData(prev => ({
                ...prev,
                loading: false,
                error: 'Invalid book ID'
            }));
        }
    }, [id]);

    useEffect(() => {
        // Initialize comment text from user review when it loads
        if (userReview?.comment) {
            setCommentText(userReview.comment);
        }
    }, [userReview]);

    const { book, genres, loading, error } = bookData;

    // Handle image load errors
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = '/default-book-cover.jpg'; // Default image path
    };

    // Format date for reviews
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    };

    // Toggle review form visibility
    const toggleReviewForm = () => {
        setIsReviewFormVisible(!isReviewFormVisible);
    };

    if (loading) return (
        <>
            <Navbar />
            <div className="loading-container">
                <div className="loader"></div>
                <p>Loading book details...</p>
            </div>
        </>
    );
    
    if (error) return (
        <>
            <Navbar />
            <div className="error-container">
                <p>Error: {error}</p>
                <button className="back-button" onClick={() => navigate('/books')}>
                    <FaArrowLeft /> Return to Books
                </button>
            </div>
        </>
    );
    
    if (!book) return (
        <>
            <Navbar />
            <div className="not-found-container">
                <p>Book not found</p>
                <button className="back-button" onClick={() => navigate('/books')}>
                    <FaArrowLeft /> Return to Books
                </button>
            </div>
        </>
    );

    return (
        <>
            <Navbar />
            <div className="book-details-page">
                <div className="book-details-card">
                    <div className="book-details-header">
                        <div className="book-cover-container">
                            {book.coverurl ? (
                                <img 
                                    src={book.coverurl} 
                                    alt={book.title}
                                    className="book-cover-large" 
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="book-cover-placeholder-large">
                                    <FaBook className="book-icon" />
                                </div>
                            )}
                        </div>
                        <div className="book-header-text">
                            <h1>{book.title}</h1>
                            <h2>by {book.author}</h2>
                            <p className="published-year">{book.publishedyear || 'Unknown'}</p>
                        </div>
                    </div>

                    <div className="book-details-content">
                        <div className="book-details-meta">
                            {book.description && (
                                <div className="book-details-description">
                                    <h3>Description</h3>
                                    <p>{book.description}</p>
                                </div>
                            )}

                            <div className="book-genres">
                                <h3>Genres: {genres.join(', ')}</h3>
                            </div>
                        </div>

                        <div className="rating-section">
                            <div className="public-rating">
                                <StarRating rating={Number(book.avg_rating)} interactive={false} />
                                <span>
                                    Average: {book.avg_rating} ({book.num_ratings} ratings)
                                </span>                            
                            </div>

                            <div className="user-review-section">
                                <div className="user-rating">
                                    <span>Your rating:</span>
                                    <StarRating
                                        rating={userReview?.rating || 0}
                                        interactive={true}
                                        onRate={handleRateBook}
                                    />
                                </div>

                                <div className="user-comment-form">
                                    <h3>Your Review</h3>
                                    {isLoggedIn ? (
                                        <>
                                            {!isReviewFormVisible && (
                                                <button 
                                                    className="toggle-review-form-btn"
                                                    onClick={toggleReviewForm}
                                                >
                                                    {userReview?.comment ? "Update Review" : "Write Review"}
                                                </button>
                                            )}
                                            {isReviewFormVisible && (
                                                <form onSubmit={handleCommentSubmit}>
                                                    <textarea
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="Share your thoughts about this book..."
                                                        rows={4}
                                                        disabled={submitting}
                                                    ></textarea>
                                                    <button 
                                                        type="submit" 
                                                        className="comment-submit-btn"
                                                        disabled={submitting || !commentText.trim()}
                                                    >
                                                        {submitting ? "Submitting..." : userReview?.comment ? "Update Review" : "Post Review"}
                                                    </button>
                                                </form>
                                            )}
                                        </>
                                    ) : (
                                        <div className="login-prompt">
                                            Please <a href="/login">log in</a> to leave a review.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Community Reviews Section */}
                        <div className="community-reviews">
                            <h3>Community Reviews</h3>
                            {bookReviews.length > 0 ? (
                                <div className="reviews-list">
                                    {bookReviews.map(review => (
                                        <div key={review.review_id} className="review-item">
                                            <div className="review-header">
                                                <Link 
                                                    to={`/user/${review.username}`} 
                                                    className="reviewer-info reviewer-link"
                                                >
                                                    <FaUser className="user-icon" />
                                                    <span className="reviewer-name">{review.username}</span>
                                                </Link>
                                                <div className="review-meta">
                                                    <div className="review-rating">
                                                        <StarRating rating={Number(review.rating)} interactive={false} />
                                                    </div>
                                                    <div className="review-date">
                                                        <FaClock className="clock-icon" />
                                                        <span>{formatDate(review.updated_at)}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="review-content">
                                                <p>{review.comment}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="no-reviews">No reviews yet. Be the first to review this book!</p>
                            )}
                        </div>

                        <button className="back-button" onClick={() => navigate(-1)}>
                            <FaArrowLeft /> Back to Books
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BookDetails;
