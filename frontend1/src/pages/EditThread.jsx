import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiUrl } from '../config/config';
import Navbar from '../components/Navbar';
import "../css/threads.css";

const EditThread = () => {
    const { threadId } = useParams();
    const [thread, setThread] = useState(null);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [bookId, setBookId] = useState('');
    const [categories, setCategories] = useState([]);
    const [books, setBooks] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [username, setUsername] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Check if user is logged in
        const checkLoginStatus = async () => {
            try {
                const response = await fetch(`${apiUrl}/isLoggedIn`, {
                    credentials: 'include'
                });
                const data = await response.json();
                
                if (response.status === 200) {
                    setIsLoggedIn(true);
                    setUsername(data.username);
                } else {
                    setIsLoggedIn(false);
                    navigate('/login');
                }
            } catch (err) {
                console.error('Error checking login status:', err);
                setIsLoggedIn(false);
                navigate('/login');
            }
        };

        checkLoginStatus();
    }, [navigate]);

    useEffect(() => {
        // Fetch thread details
        const fetchThreadDetails = async () => {
            setIsLoading(true);
            try {
                const response = await fetch(`${apiUrl}/api/threads/${threadId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch thread details');
                }
                const data = await response.json();
                setThread(data);
                
                // Set form values
                setTitle(data.title);
                setContent(data.content);
                setCategoryId(data.category_id || '');
                setBookId(data.book_id || '');
                
                // Check if user is the author of the thread
                if (data.username !== username) {
                    setError('You are not authorized to edit this thread');
                    navigate('/threads');
                }
                
                setError(null);
            } catch (err) {
                console.error('Error fetching thread details:', err);
                setError('Failed to load thread details');
            } finally {
                setIsLoading(false);
            }
        };

        if (threadId && isLoggedIn) {
            fetchThreadDetails();
        }
    }, [threadId, isLoggedIn, username, navigate]);

    useEffect(() => {
        // Fetch thread categories
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/threads/categories`);
                if (!response.ok) {
                    throw new Error('Failed to fetch categories');
                }
                const data = await response.json();
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
        
        if (!title.trim() || !content.trim()) {
            setError('Title and content are required');
            return;
        }
        
        setIsSubmitting(true);
        setError(null);
        
        try {
            const response = await fetch(`${apiUrl}/api/threads/${threadId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    title,
                    content,
                    category_id: categoryId || null,
                    book_id: bookId || null,
                }),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update thread');
            }
            
            navigate(`/threads/${threadId}`);
        } catch (err) {
            console.error('Error updating thread:', err);
            setError(err.message || 'Failed to update thread');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="threads-container">
                <Navbar />
                <div className="threads-content">
                    <div className="loading-spinner">Loading thread...</div>
                </div>
            </div>
        );
    }

    if (error && !thread) {
        return (
            <div className="threads-container">
                <Navbar />
                <div className="threads-content">
                    <div className="error-message">{error}</div>
                    <button 
                        className="back-btn"
                        onClick={() => navigate('/threads')}
                    >
                        Back to Threads
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="threads-container">
            <Navbar />
            <div className="threads-content">
                <div className="threads-header">
                    <h1>Edit Thread</h1>
                </div>
                
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
                        >
                            <option value="">Select a category</option>
                            {categories.map(category => (
                                <option key={category.category_id} value={category.category_id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div className="form-group">
                        <label htmlFor="book">Related Book (Optional)</label>
                        <select
                            id="book"
                            value={bookId}
                            onChange={(e) => setBookId(e.target.value)}
                        >
                            <option value="">Select a book</option>
                            {books.map(book => (
                                <option key={book.id} value={book.id}>
                                    {book.title} by {book.author}
                                </option>
                            ))}
                        </select>
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
                            onClick={() => navigate(`/threads/${threadId}`)}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="submit-btn"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Updating...' : 'Update Thread'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditThread; 