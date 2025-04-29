import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import { ThemeContext } from '../components/ThemeContext';
import "../css/threads.css";

const CreateThread = () => {
    const { threadId: parentThreadId } = useParams();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [bookId, setBookId] = useState('');
    const [customBook, setCustomBook] = useState('');
    const [customAuthor, setCustomAuthor] = useState('');
    const [useCustomBook, setUseCustomBook] = useState(false);
    const [categories, setCategories] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingParent, setLoadingParent] = useState(false);
    const [parentThread, setParentThread] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { isDarkMode } = useContext(ThemeContext);

    // Check login status and redirect if not logged in
    useEffect(() => {
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: 'include'
                });
                
                if (response.status === 200) {
                    // User is logged in, continue
                } else {
                    // Not logged in, redirect to login page
                    navigate('/login');
                }
            } catch (err) {
                console.error('Error checking login status:', err);
                navigate('/login');
            }
        };

        checkLoginStatus();
    }, [navigate]);

    // Fetch parent thread if this is a reply thread
    useEffect(() => {
        if (parentThreadId) {
            const fetchParentThread = async () => {
                setLoadingParent(true);
                try {
                    const response = await fetch(`${apiUrl}/api/threads/${parentThreadId}`);
                    if (!response.ok) {
                        throw new Error('Failed to fetch parent thread');
                    }
                    const data = await response.json();
                    setParentThread(data);
                    // Inherit category and book if applicable
                    if (data.category_id) setCategoryId(data.category_id);
                    if (data.book_id) setBookId(data.book_id);
                } catch (err) {
                    console.error('Error fetching parent thread:', err);
                    setError('Failed to load parent thread');
                } finally {
                    setLoadingParent(false);
                }
            };
            fetchParentThread();
        }
    }, [parentThreadId]);

    useEffect(() => {
        // Fetch thread categories
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/threads/categories`);
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await response.json();
                console.log('Categories fetched:', data);
                setCategories(data);
            } catch (err) {
                console.error('Error fetching categories:', err);
                setError('Failed to load thread categories');
            }
        };

        // Fetch books for dropdown
        const fetchBooks = async () => {
            try {
                const response = await fetch(`${apiUrl}/books-data`);
                if (!response.ok) {
                    throw new Error('Failed to fetch books');
                }
                const data = await response.json();
                console.log('Books fetched:', data.books);
                setBooks(data.books);
            } catch (err) {
                console.error('Error fetching books:', err);
                setError('Failed to load books');
            }
        };

        fetchCategories();
        fetchBooks();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted with:');
        console.log('- Title:', title);
        console.log('- Content:', content);
        console.log('- Category ID:', categoryId);
        console.log('- Book ID:', bookId);
        console.log('- Use Custom Book:', useCustomBook);
        console.log('- Custom Book:', customBook);
        console.log('- Custom Author:', customAuthor);
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        
        setIsLoading(true);
        setError(null);
        
        try {
            // Prepare thread data
            const threadData = {
                title: title.trim(),
                content: content.trim(),
                category_id: categoryId || null,
                parent_thread_id: parentThreadId || null
            };
            
            // Handle book selection
            if (useCustomBook && customBook.trim()) {
                threadData.custom_book = customBook.trim();
                threadData.custom_author = customAuthor.trim();
                console.log('Using custom book:', customBook, 'by', customAuthor);
            } else if (bookId) {
                threadData.book_id = bookId;
                console.log('Using existing book ID:', bookId);
                // Find the book title for logging
                const selectedBook = books.find(book => book.id === parseInt(bookId));
                if (selectedBook) {
                    console.log('Selected book:', selectedBook.title, 'by', selectedBook.author);
                }
            } else {
                console.log('No book selected');
            }
            
            console.log('Submitting thread data:', threadData);
            
            const response = await fetch(`${apiUrl}/api/threads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(threadData),
            });
            
            const responseData = await response.json();
            console.log('Server response:', responseData);
            
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to create thread');
            }
            
            navigate(`/threads/${responseData.thread_id}`);
        } catch (err) {
            console.error('Error creating thread:', err);
            // Show detailed error to help debugging
            if (err.message) {
                setError(`Error: ${err.message}. Please try again or contact support.`);
            } else {
                setError('Failed to create thread. Please check your connection and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (loadingParent) {
        return (
            <div className={`page-container ${isDarkMode ? 'dark-mode' : ''}`}>
                <Navbar />
                <div className="threads-content">
                    <div className="loading-spinner">Loading parent thread information...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`page-container ${isDarkMode ? 'dark-mode' : ''}`}>
            <Navbar />
            <div className="threads-content">
                <div className="threads-header">
                    <h1>{parentThreadId ? 'Reply to Thread' : 'Create New Thread'}</h1>
                </div>
                
                {parentThread && (
                    <div className="parent-thread-info">
                        <h3>Replying to: {parentThread.title}</h3>
                        <p className="parent-thread-author">by {parentThread.username}</p>
                        <div className="parent-thread-preview">
                            {parentThread.content.length > 200 
                                ? `${parentThread.content.substring(0, 200)}...` 
                                : parentThread.content}
                        </div>
                        <Link to={`/threads/${parentThread.thread_id}`} className="view-parent-link">
                            View original thread
                        </Link>
                    </div>
                )}
                
                {error && <div className="error-message">{error}</div>}
                
                <form className="create-thread-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Enter thread title"
                            required
                        />
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="category">Category (Optional)</label>
                        <select
                            id="category"
                            value={categoryId}
                            onChange={(e) => setCategoryId(e.target.value)}
                            disabled={parentThreadId && parentThread?.category_id}
                        >
                            <option value="">Select a category</option>
                            {categories.map(category => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        {parentThreadId && parentThread?.category_id && 
                            <p className="helper-text">Category inherited from parent thread</p>}
                    </div>
                    
                    <div className="form-group book-selection">
                        <div className="book-toggle">
                            <label>Book Selection</label>
                            <div className="toggle-options">
                                <button 
                                    type="button" 
                                    className={!useCustomBook ? "toggle-btn active" : "toggle-btn"}
                                    onClick={() => setUseCustomBook(false)}
                                    disabled={parentThreadId && parentThread?.book_id}
                                >
                                    Choose Existing
                                </button>
                                <button 
                                    type="button" 
                                    className={useCustomBook ? "toggle-btn active" : "toggle-btn"}
                                    onClick={() => setUseCustomBook(true)}
                                    disabled={parentThreadId && parentThread?.book_id}
                                >
                                    Add Custom Book
                                </button>
                            </div>
                        </div>
                        
                        {!useCustomBook ? (
                            <div className="form-group">
                                <label htmlFor="book">Related Book (Optional)</label>
                                <select
                                    id="book"
                                    value={bookId}
                                    onChange={(e) => {
                                        console.log('Book selected:', e.target.value);
                                        setBookId(e.target.value);
                                    }}
                                    disabled={parentThreadId && parentThread?.book_id}
                                >
                                    <option value="">Select a book</option>
                                    {books && books.map(book => (
                                        <option key={book.id} value={book.id}>
                                            {book.title} by {book.author}
                                        </option>
                                    ))}
                                </select>
                                {parentThreadId && parentThread?.book_id && 
                                    <p className="helper-text">Book inherited from parent thread</p>}
                            </div>
                        ) : (
                            <div className="custom-book-fields">
                                <div className="form-group">
                                    <label htmlFor="customBook">Book Title</label>
                                    <input
                                        type="text"
                                        id="customBook"
                                        value={customBook}
                                        onChange={(e) => setCustomBook(e.target.value)}
                                        placeholder="Enter book title"
                                    />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="customAuthor">Author</label>
                                    <input
                                        type="text"
                                        id="customAuthor"
                                        value={customAuthor}
                                        onChange={(e) => setCustomAuthor(e.target.value)}
                                        placeholder="Enter author name"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="content">Content</label>
                        <textarea
                            id="content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Enter thread content"
                            rows="10"
                            required
                        ></textarea>
                    </div>
                    
                    <div className="form-actions">
                        <button 
                            type="button" 
                            className="cancel-btn"
                            onClick={() => navigate(parentThreadId ? `/threads/${parentThreadId}` : '/threads')}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isLoading}
                        >
                            {isLoading ? (parentThreadId ? 'Posting Reply...' : 'Creating...') : 
                                        (parentThreadId ? 'Post Reply' : 'Create Thread')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CreateThread; 