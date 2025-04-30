import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import '../css/thread-form.css';

const CreateThread = () => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [bookId, setBookId] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get category from query params if present
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category');
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
    }
    
    const bookIdFromUrl = searchParams.get('book');
    if (bookIdFromUrl) {
      fetchBookDetails(bookIdFromUrl);
    }
  }, [searchParams]);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('http://localhost:4000/api/thread-categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        } else {
          console.error('Failed to fetch categories');
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Fetch book details if bookId is provided
  const fetchBookDetails = async (id) => {
    try {
      const response = await fetch(`http://localhost:4000/books/${id}`);
      if (response.ok) {
        const bookData = await response.json();
        setSelectedBook(bookData);
        setBookId(bookData.id);
      }
    } catch (error) {
      console.error('Error fetching book details:', error);
    }
  };
  
  // Search books as user types
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (bookSearch.trim().length >= 2) {
        searchBooks(bookSearch);
      } else {
        setSearchResults([]);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounce);
  }, [bookSearch]);
  
  const searchBooks = async (query) => {
    setIsSearching(true);
    try {
      // This is a simple implementation - ideally, you would have a proper book search endpoint
      const response = await fetch(`http://localhost:4000/books-search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching books:', error);
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleBookSelect = (book) => {
    setSelectedBook(book);
    setBookId(book.id);
    setBookSearch('');
    setSearchResults([]);
  };
  
  const removeSelectedBook = () => {
    setSelectedBook(null);
    setBookId('');
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:4000/api/threads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          categoryId: selectedCategory || null,
          bookId: bookId || null,
        }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create thread');
      }
      
      const newThread = await response.json();
      navigate(`/threads/${newThread.thread_id}`);
    } catch (error) {
      console.error('Error creating thread:', error);
      setError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div>
      <Navbar />
      <div className="thread-form-container">
        <div className="thread-form">
          <h2>Create a New Thread</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="threadTitle">Title</label>
              <input
                type="text"
                id="threadTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a descriptive title"
                maxLength={255}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="threadCategory">Category (optional)</label>
              <select
                id="threadCategory"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">Select a category</option>
                {categories.map(category => (
                  <option 
                    key={category.category_id} 
                    value={category.category_id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Related Book (optional)</label>
              {!selectedBook ? (
                <>
                  <input
                    type="text"
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    placeholder="Search for a book"
                  />
                  {isSearching && <div className="search-loading">Searching...</div>}
                  {searchResults.length > 0 && (
                    <div className="book-search-results">
                      {searchResults.map(book => (
                        <div
                          key={book.id}
                          className="book-result"
                          onClick={() => handleBookSelect(book)}
                        >
                          {book.coverurl && (
                            <img src={book.coverurl} alt={book.title} />
                          )}
                          <div className="book-result-info">
                            <div className="book-result-title">{book.title}</div>
                            <div className="book-result-author">{book.author}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="selected-book">
                  {selectedBook.coverurl && (
                    <img src={selectedBook.coverurl} alt={selectedBook.title} />
                  )}
                  <div className="selected-book-info">
                    <div className="selected-book-title">{selectedBook.title}</div>
                    <div className="selected-book-author">{selectedBook.author}</div>
                  </div>
                  <button
                    type="button"
                    className="remove-book-btn"
                    onClick={removeSelectedBook}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="threadContent">Content</label>
              <textarea
                id="threadContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your thread content here..."
                rows={10}
                required
              />
            </div>
            
            <div className="thread-form-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isSubmitting || !title.trim() || !content.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Create Thread'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateThread;
