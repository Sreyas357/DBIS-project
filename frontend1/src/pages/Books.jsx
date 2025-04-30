import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/books.css";
import StarRating from '../components/StarRating';
import { FaSearch, FaTimes, FaBook } from 'react-icons/fa'; // Import icons

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
    const [isLoading, setIsLoading] = useState(true);
    const [searchType, setSearchType] = useState("all"); // all, title, author

    const fetchBooksData = async () => {
        try {
            setIsLoading(true);
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
            setIsLoading(false);
        } catch (error) {
            console.error("Error fetching books:", error);
            setIsLoading(false);
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
    }, [navigate, fetchUserReviews]);

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

            // const bookGenreCounts = filteredBookIds.reduce((acc, bookId) => {
            //     acc[bookId] = (acc[bookId] || 0) + 1;
            //     return acc;
            // }, {});

            const MatchedBooks = books.filter(book =>
                // bookGenreCounts[book.id] === selectedGenres.length
                filteredBookIds.includes(book.id)
            );

            setFilteredBooks(MatchedBooks);
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
            case "recent":
                return [...booksToSort].sort((a, b) => parseInt(b.publishedyear) - parseInt(a.publishedyear));
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
            let results;

            switch (searchType) {
                case "title":
                    results = baseBooks.filter(book =>
                        book.title.toLowerCase().includes(query)
                    );
                    break;
                case "author":
                    results = baseBooks.filter(book =>
                        book.author.toLowerCase().includes(query)
                    );
                    break;
                default: // "all"
                    results = baseBooks.filter(book =>
                        book.title.toLowerCase().includes(query) ||
                        book.author.toLowerCase().includes(query) ||
                        (book.description && book.description.toLowerCase().includes(query)) // if books.description exists then search for that query
                    );
                    break;
            }
            setSearchedBooks(results);
        }
    }, [filteredBooks, searchQuery, sortBooks, searchType]);

    useEffect(() => {
        updateSearchResults();
    }, [filteredBooks, searchQuery, sortOption, searchType, updateSearchResults]);

    const handleSearch = () => { //
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
                    ? { rating: newRating, comment: null } // comment
                    : undefined
            }));
        } catch (error) {
            console.error("Rating error:", error);
            alert("Failed to rate book");
        }
    };

    // Function to handle image load errors
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = '/default-book-cover.jpg'; // Default image path
    };

    return (
        <>
            <Navbar />
            <div className="books-page">
                <div className="sidebar">
                    <h3>Genres</h3>
                    <ul className="genre-list">
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
                            <div className="search-input-wrapper">
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search books..."
                                    className="search-bar"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                />
                                {searchQuery && (
                                    <FaTimes 
                                        className="clear-search-icon" 
                                        onClick={() => {
                                            setSearchQuery("");
                                            handleSearch();
                                        }}
                                    />
                                )}
                            </div>
                            <div className="search-options">
                                <select
                                    className="search-type-select"
                                    value={searchType}
                                    onChange={(e) => setSearchType(e.target.value)}
                                >
                                    <option value="all">All Fields</option>
                                    <option value="title">Title Only</option>
                                    <option value="author">Author Only</option>
                                </select>
                                <button className="search-button" onClick={handleSearch}>Search</button>
                            </div>
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
                                <option value="rating">Highest Rating</option>
                                <option value="reviews">Most Reviews</option>
                                <option value="recent">Most Recent</option>
                            </select>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="loading-container">
                            <div className="loader"></div>
                            <p>Loading books...</p>
                        </div>
                    ) : searchedBooks.length > 0 ? (
                        <div className="books-grid">
                            {searchedBooks.map((book) => (
                                <div key={book.id} className="book-card">
                                    <Link 
                                        to={`/books/${book.id}`} 
                                        className="book-cover-link"
                                        onClick={(e) => {
                                            // Prevent the default if the click was on a child element that has its own handler
                                            if (e.target !== e.currentTarget && e.target.tagName !== 'IMG') {
                                                e.stopPropagation();
                                            }
                                        }}
                                    >
                                        {book.coverurl ? (
                                            <img 
                                                src={book.coverurl} 
                                                alt={book.title}
                                                className="book-cover" 
                                                onError={handleImageError}
                                            />
                                        ) : (
                                            <div className="book-cover-placeholder">
                                                <FaBook className="book-icon" />
                                                <span>{book.title}</span>
                                            </div>
                                        )}
                                    </Link>
                                    <div className="book-info">
                                        <Link 
                                            to={`/books/${book.id}`} 
                                            className="book-title-link"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <h3 className="book-title">{book.title}</h3>
                                        </Link>
                                        <p className="author">by {book.author}</p>
                                        <p className="published-year">{book.publishedyear || 'Unknown'}</p>
                                        <div className="rating-container">
                                            <div className="avg-rating">
                                                <StarRating
                                                    rating={book.avg_rating || 0}
                                                    interactive={false}
                                                />
                                                <span className="rating-text">
                                                    {book.avg_rating} ({book.num_ratings})
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
                        <div className="no-results">
                            <FaBook className="no-results-icon" />
                            <p className="no-books-message">No books found matching your criteria.</p>
                            <button 
                                className="reset-search-button"
                                onClick={() => {
                                    setSearchQuery("");
                                    setSelectedGenres([]);
                                }}
                            >
                                Reset Search
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Books;