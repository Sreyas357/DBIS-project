import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/books.css";
import StarRating from '../components/StarRating';

const Books = () => {
    const navigate = useNavigate();

    const [books, setBooks] = useState([]);
    const [genres, setGenres] = useState([]);
    const [bookGenres, setBookGenres] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchedBooks, setSearchedBooks] = useState([]);
    const [sortOption, setSortOption] = useState("default");
    const [userReviews, setUserReviews] = useState({});

    const fetchBooksData = async () => {
        try {
            const res = await fetch(`${apiUrl}/books-data`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (res.status !== 200) throw new Error("Failed to fetch books data");

            const data = await res.json();
            setBooks(data.books);
            setFilteredBooks(data.books); // Initial state
            setSearchedBooks(data.books); // Initial search
            setGenres(data.genres);
            setBookGenres(data.bookGenres);
        } catch (error) {
            console.error("Error fetching books:", error);
        }
    };

    const fetchUserReviews = useCallback(async () => {
        try {
            const res = await fetch(`${apiUrl}/user/reviews`, {
                method: "GET",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const reviews = await res.json();
                const reviewsObj = reviews.reduce((acc, review) => {
                    acc[review.book_id] = {
                        rating: review.rating,
                        comment: review.comment
                    };
                    return acc;
                }, {});
                setUserReviews(reviewsObj);
            }
        } catch (error) {
            console.error("Error fetching user reviews:", error);
        }
    }, []);

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetch(`${apiUrl}/isLoggedIn`, {
                    method: "GET",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                });

                if (res.status !== 200) {
                    navigate("/login");
                } else {
                    fetchBooksData();
                    fetchUserReviews();
                }
            } catch (error) {
                console.error("Login status check failed:", error);
                navigate("/login");
            }
        };

        checkStatus();
    }, [navigate]);

    const handleGenreClick = (genre) => {
        if (genre === null) {
            setSelectedGenres([]);
            return;
        }

        setSelectedGenres(prev => {
            if (prev.includes(genre)) {
                return prev.filter(g => g !== genre);
            } else {
                return [...prev, genre];
            }
        });
    };

    useEffect(() => {
        if (selectedGenres.length > 0) {
            const genreIds = genres
                .filter(g => selectedGenres.includes(g.name))
                .map(g => g.id);

            const filteredBookIds = bookGenres
                .filter(bg => genreIds.includes(bg.genre_id))
                .map(bg => bg.book_id);

            const bookGenreCounts = filteredBookIds.reduce((acc, bookId) => {
                acc[bookId] = (acc[bookId] || 0) + 1;
                return acc;
            }, {});

            const fullyMatchedBooks = books.filter(book =>
                bookGenreCounts[book.id] === selectedGenres.length
            );

            setFilteredBooks(fullyMatchedBooks);
        } else {
            setFilteredBooks(books);
        }
    }, [selectedGenres, genres, bookGenres, books]);

    const sortBooks = useCallback((booksToSort) => {
        switch (sortOption) {
            case "title-asc":
                return [...booksToSort].sort((a, b) => a.title.localeCompare(b.title));
            case "title-desc":
                return [...booksToSort].sort((a, b) => b.title.localeCompare(a.title));
            case "rating":
                return [...booksToSort].sort((a, b) => b.avg_rating - a.avg_rating);
            case "reviews":
                return [...booksToSort].sort((a, b) => b.num_reviews - a.num_reviews);
            default:
                return [...booksToSort].sort((a, b) => a.id - b.id);
        }
    }, [sortOption]);

    const updateSearchResults = useCallback(() => {
        const baseBooks = sortBooks(filteredBooks);

        if (searchQuery.trim() === "") {
            setSearchedBooks(baseBooks);
        } else {
            const query = searchQuery.toLowerCase();
            const results = baseBooks.filter(book =>
                book.title.toLowerCase().includes(query) ||
                book.author.toLowerCase().includes(query)
            );
            setSearchedBooks(results);
        }
    }, [filteredBooks, searchQuery, sortBooks]);

    useEffect(() => {
        updateSearchResults();
    }, [filteredBooks, searchQuery, sortBooks, updateSearchResults]);

    const handleSearch = () => {
        updateSearchResults();
    };

    const handleRateBook = async (bookId, newRating) => {
        try {
            const res = await fetch(`${apiUrl}/rate-book`, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ book_id: bookId, rating: newRating }),
            });

            if (!res.ok) throw new Error("Failed to rate book");

            const result = await res.json();

            setBooks(prevBooks =>
                prevBooks.map(book =>
                    book.id === bookId
                        ? {
                            ...book,
                            avg_rating: Number(parseFloat(result.avg_rating).toFixed(2)),
                            num_ratings: result.num_ratings
                        }
                        : book
                )
            );

            setUserReviews(prev => ({
                ...prev,
                [bookId]: newRating > 0
                    ? { rating: newRating, comment: null }
                    : undefined
            }));
        } catch (error) {
            console.error("Rating error:", error);
            alert("Failed to rate book");
        }
    };

    return (
        <>
            <Navbar />
            <div className="books-page">
                <div className="sidebar">
                    <h3>Genres</h3>
                    <ul>
                        <li
                            key="all"
                            onClick={() => handleGenreClick(null)}
                            className={selectedGenres.length === 0 ? "active" : ""}
                        >
                            All Books
                        </li>
                        {genres.map((genre) => (
                            <li
                                key={genre.id}
                                onClick={() => handleGenreClick(genre.name)}
                                className={selectedGenres.includes(genre.name) ? "active" : ""}
                            >
                                {genre.name}
                                {selectedGenres.includes(genre.name) && (
                                    <span className="selected-indicator">✓</span>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="books-container">
                    <div className="controls-container">
                        <div className="search-container">
                            <input
                                type="text"
                                placeholder="Search by title or author..."
                                className="search-bar"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button className="search-button" onClick={handleSearch}>Search</button>
                            <button className="clear-button" onClick={() => {
                                setSearchQuery("");
                                handleSearch();
                            }}>Clear</button>
                        </div>

                        <div className="sort-container">
                            <label htmlFor="sort-select">Sort by:</label>
                            <select
                                id="sort-select"
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                            >
                                <option value="default">Default</option>
                                <option value="title-asc">Title (A-Z)</option>
                                <option value="title-desc">Title (Z-A)</option>
                                <option value="rating">Rating</option>
                                <option value="reviews">Number of Reviews</option>
                            </select>
                        </div>
                    </div>

                    {searchedBooks.length > 0 ? (
                        <div className="books-grid">
                            {searchedBooks.map((book) => (
                                <div key={book.id} className="book-card">
                                    <Link to={`/books/${book.id}`} className="book-title-link">
                                        <div className="book-image-placeholder">{book.title}</div>
                                    </Link>
                                    <div className="book-info">
                                        <p className="author">{book.author}</p>
                                        <div className="rating-container">
                                            <div className="avg-rating">
                                                <span className="rating-text">
                                                    Average: {book.avg_rating} ({book.num_ratings} ratings)
                                                </span>
                                            </div>
                                            <div className="user-rating">
                                                <span>Your rating: </span>
                                                <StarRating
                                                    rating={userReviews[book.id]?.rating ?? 0}
                                                    interactive={true}
                                                    onRate={(newRating) => handleRateBook(book.id, newRating)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="no-books-message">No books found matching your criteria.</p>
                    )}
                </div>
            </div>
        </>
    );
};

export default Books;
