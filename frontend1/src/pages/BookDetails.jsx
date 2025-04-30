import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import StarRating from '../components/StarRating';
import '../css/book-details.css';
import { FaBook, FaArrowLeft } from 'react-icons/fa';

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

            setUserReview(prev => ({
                ...prev,
                rating: newRating,
                book_id: id
            }));

        } catch (error) {
            console.error("Rating error:", error);
            alert("Failed to save rating. Please try again.");
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

    const { book, genres, loading, error } = bookData;

    // Handle image load errors
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = '/default-book-cover.jpg'; // Default image path
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

                                <div className="user-comment">
                                    <span>Your comment:</span>
                                    <div className="comment-text">
                                        {userReview?.comment || "No comments yet"}
                                    </div>
                                </div>
                            </div>
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
