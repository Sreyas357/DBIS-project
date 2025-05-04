import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/books.css";
import StarRating from '../components/StarRating';
import { FaSearch, FaTimes, FaBook } from 'react-icons/fa'; // Import icons

const Books = () => {
    const navigate = useNavigate();
    const searchRef = useRef(null);

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
    
    // New state for search dropdown
    const [dropdownResults, setDropdownResults] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    // New state to separate typing from search results
    const [appliedSearchQuery, setAppliedSearchQuery] = useState("");

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

            const MatchedBooks = books.filter(book =>
                filteredBookIds.includes(book.id)
            );

            setFilteredBooks(MatchedBooks);
        } else {
            setFilteredBooks(books);
        }
    }, [selectedGenres, genres, bookGenres, books]);

    // Function to update dropdown search results
    const updateSearchDropdown = useCallback(() => {
        if (searchQuery.trim() === "") {
            // If search is empty, show top rated books
            const topRatedBooks = [...books]
                .sort((a, b) => b.avg_rating - a.avg_rating)
                .slice(0, 5);
            setDropdownResults(topRatedBooks);
            return;
        }

        const query = searchQuery.toLowerCase();
        let results;

        switch (searchType) {
            case "title":
                results = books.filter(book =>
                    book.title.toLowerCase().includes(query)
                );
                break;
            case "author":
                results = books.filter(book =>
                    book.author.toLowerCase().includes(query)
                );
                break;
            default: // "all"
                results = books.filter(book =>
                    book.title.toLowerCase().includes(query) ||
                    book.author.toLowerCase().includes(query) ||
                    (book.description && book.description.toLowerCase().includes(query))
                );
                break;
        }

        // If no matching results, show top rated books
        if (results.length === 0) {
            results = [...books]
                .sort((a, b) => b.avg_rating - a.avg_rating)
                .slice(0, 5);
        } else {
            // Limit to 5 results for dropdown
            results = results.slice(0, 5);
        }

        setDropdownResults(results);
    }, [books, searchQuery, searchType]);

    // Update dropdown when search query changes
    useEffect(() => {
        updateSearchDropdown();
    }, [searchQuery, updateSearchDropdown]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

        if (appliedSearchQuery.trim() === "") {
            setSearchedBooks(baseBooks);
        } else {
            const query = appliedSearchQuery.toLowerCase();
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
                        (book.description && book.description.toLowerCase().includes(query))
                    );
                    break;
            }
            setSearchedBooks(results);
        }
    }, [filteredBooks, appliedSearchQuery, sortBooks, searchType]);

    useEffect(() => {
        updateSearchResults();
    }, [filteredBooks, appliedSearchQuery, sortOption, searchType, updateSearchResults]);

    const handleSearch = () => {
        setShowDropdown(false);
        // Apply the current search query to the main display
        setAppliedSearchQuery(searchQuery);
    };

    // Navigate to book detail page when selecting from dropdown
    const handleSelectBook = (bookId) => {
        setShowDropdown(false);
        navigate(`/books/${bookId}`);
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

    // Function to handle image load errors
    const handleImageError = (e) => {
        e.target.onerror = null; // Prevent infinite loop
        e.target.src = '/default-book-cover.jpg'; // Default image path
    };

    // Corrected onlineSearch function
    const onlineSearch = async (bookName) => {
        try {
            setIsLoading(true);
            const maxResults = 3;
            const encodedBookName = encodeURIComponent(bookName);

            const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodedBookName}&maxResults=${maxResults}`);

            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            const data = await response.json();

            if (!data.items || data.items.length === 0) {
                alert(`No books found with the name "${bookName}"`);
                setIsLoading(false);
                return;
            }

            // Track successful additions and store new books data
            let addedBooks = 0;
            let attemptedBooks = 0;
            let failedBooks = [];
            const newBooks = [];
            const newGenres = [];
            const newBookGenres = [];
            
            // Process each book
            for (const item of data.items) {
                const volumeInfo = item.volumeInfo;
                
                if (!volumeInfo) continue;
                
                attemptedBooks++;
                
                try {
                    // Ensure property names match what the backend expects
                    const res = await fetch(`${apiUrl}/api/add-book`, {
                        method: "POST",
                        credentials: "include",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            title: volumeInfo.title || "Unknown Title",
                            author: volumeInfo.authors?.[0] || "Unknown",
                            description: volumeInfo.description || "No description available",
                            coverUrl: volumeInfo.imageLinks?.thumbnail || null, // lowercase url
                            publishedYear: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : "Unknown", // lowercase year
                            pageCount: volumeInfo.pageCount || null, // lowercase count
                            publisher: volumeInfo.publisher || "Unknown",
                            previewLink: volumeInfo.previewLink || null, // lowercase link
                            categories: volumeInfo.categories || [],
                            isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
                                  volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null
                        })
                    });

                    if (res.ok) {
                        const responseData = await res.json();
                        
                        // Add the new book to our collection
                        newBooks.push(responseData.book);
                        
                        // Add any new genres
                        if (responseData.newGenres && responseData.newGenres.length > 0) {
                            newGenres.push(...responseData.newGenres);
                        }
                        
                        // Add new book-genre relations
                        if (responseData.newBookGenreRelations && responseData.newBookGenreRelations.length > 0) {
                            newBookGenres.push(...responseData.newBookGenreRelations);
                        }
                        
                        addedBooks++;
                    } else {
                        const errorData = await res.json();
                        failedBooks.push(volumeInfo.title || "Unknown Title");
                        console.error(`Failed to add book "${volumeInfo.title}": ${errorData.error}`);
                    }
                } catch (err) {
                    failedBooks.push(volumeInfo.title || "Unknown Title");
                    console.error(`Error processing book "${volumeInfo.title}":`, err);
                }
            }

            // Update application state with the new data if any books were added
            if (addedBooks > 0) {
                // Update books state
                setBooks(prevBooks => [...prevBooks, ...newBooks]);
                
                // Update genres state
                setGenres(prevGenres => {
                    // Filter out duplicates based on ID
                    const existingIds = new Set(prevGenres.map(g => g.id));
                    const uniqueNewGenres = newGenres.filter(g => !existingIds.has(g.id));
                    return [...prevGenres, ...uniqueNewGenres];
                });
                
                // Update bookGenres state
                setBookGenres(prevRelations => [...prevRelations, ...newBookGenres]);
                
                // Update filtered and searched books based on current filters and search
                const updatedBooks = [...books, ...newBooks];
                
                // Apply current genre filters
                let filtered;
                if (selectedGenres.length > 0) {
                    const genreIds = [...genres, ...newGenres]
                        .filter(g => selectedGenres.includes(g.name))
                        .map(g => g.id);

                    const filteredBookIds = [...bookGenres, ...newBookGenres]
                        .filter(bg => genreIds.includes(bg.genre_id))
                        .map(bg => bg.book_id);

                    filtered = updatedBooks.filter(book =>
                        filteredBookIds.includes(book.id)
                    );
                } else {
                    filtered = updatedBooks;
                }
                
                setFilteredBooks(filtered);
                
                // Apply current search if any
                if (appliedSearchQuery.trim() === "") {
                    setSearchedBooks(sortBooks(filtered));
                } else {
                    const query = appliedSearchQuery.toLowerCase();
                    let results;

                    switch (searchType) {
                        case "title":
                            results = filtered.filter(book =>
                                book.title.toLowerCase().includes(query)
                            );
                            break;
                        case "author":
                            results = filtered.filter(book =>
                                book.author.toLowerCase().includes(query)
                            );
                            break;
                        default: // "all"
                            results = filtered.filter(book =>
                                book.title.toLowerCase().includes(query) ||
                                book.author.toLowerCase().includes(query) ||
                                (book.description && book.description.toLowerCase().includes(query))
                            );
                            break;
                    }
                    setSearchedBooks(sortBooks(results));
                }
                
                // Show appropriate message
                const plural = addedBooks === 1 ? '' : 's';
                if (addedBooks < attemptedBooks) {
                    alert(`Added ${addedBooks} book${plural} to the library. ${attemptedBooks - addedBooks} could not be added.`);
                } else {
                    alert(`Successfully added ${addedBooks} book${plural} to the library.`);
                }
            } else {
                if (failedBooks.length > 0) {
                    alert(`Failed to add any books. Please try again.`);
                } else {
                    alert(`No new books were found to add.`);
                }
            }
            
        } catch (error) {
            console.error("Error searching books online:", error);
            alert("Failed to search for books online. Please try again.");
        } finally {
            setIsLoading(false);
        }
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
                            <div className="search-input-wrapper" ref={searchRef}>
                                <FaSearch className="search-icon" />
                                <input
                                    type="text"
                                    placeholder="Search books..."
                                    className="search-bar"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => setShowDropdown(true)}
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch();
                                            setShowDropdown(false);
                                        }
                                    }}
                                />
                                {searchQuery && (
                                    <FaTimes 
                                        className="clear-search-icon" 
                                        onClick={() => {
                                            setSearchQuery("");
                                            setAppliedSearchQuery("");
                                            setShowDropdown(false);
                                        }}
                                    />
                                )}
                                
                                {/* Search Dropdown */}
                                {showDropdown && (
                                    <div className="search-dropdown">
                                        <div className="dropdown-header">
                                            {searchQuery.trim() === "" ? "Top Rated Books" : "Search Results"}
                                        </div>
                                        {dropdownResults.length > 0 ? (
                                            dropdownResults.map(book => (
                                                <div 
                                                    key={book.id} 
                                                    className="dropdown-item"
                                                    onClick={() => handleSelectBook(book.id)}
                                                >
                                                    <div className="dropdown-item-cover">
                                                        {book.coverurl ? (
                                                            <img 
                                                                src={book.coverurl} 
                                                                alt="" 
                                                                onError={handleImageError}
                                                            />
                                                        ) : (
                                                            <FaBook />
                                                        )}
                                                    </div>
                                                    <div className="dropdown-item-info">
                                                        <div className="dropdown-item-title">{book.title}</div>
                                                        <div className="dropdown-item-author">by {book.author}</div>
                                                        <div className="dropdown-item-rating">
                                                            <StarRating 
                                                                rating={book.avg_rating || 0} 
                                                                interactive={false} 
                                                            />
                                                            <span>{book.avg_rating} ({book.num_ratings})</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="dropdown-no-results">
                                                No matching books found
                                            </div>
                                        )}
                                    </div>
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
                            <div className="no-results-actions">
                                <button 
                                    className="reset-search-button"
                                    onClick={() => {
                                        setSearchQuery("");
                                        setSelectedGenres([]);
                                    }}
                                >
                                    Reset Search
                                </button>
                                <button 
                                    className="online-search-button"
                                    onClick={() => onlineSearch(searchQuery)}
                                >
                                    Search Online
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Books;