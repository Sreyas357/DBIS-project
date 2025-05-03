import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";
import "../css/Dashboard.css";

const Dashboard = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("User");
  const [genreBooks, setGenreBooks] = useState({});
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [friendRecommendedBooks, setFriendRecommendedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [friendRecommendationsLoading, setFriendRecommendationsLoading] = useState(true);

  // Define the main genres we want to display
  const mainGenres = [
    "fiction", 
    "science", 
    "business", 
    "self-help",
    "young-adult", 
    "manga",
  ];
  
  // NYT list names mapping for each genre
  const genreToNYTList = {
    // Fiction categories
    "fiction": "hardcover-fiction",
    "nonfiction": "hardcover-nonfiction",
    
    // Non-fiction categories
    "science": "science", // Changed from "science" (invalid)
    "business": "business-books",
    
    "self-help": "advice-how-to-and-miscellaneous",
    // Special categories
    "young-adult": "young-adult-hardcover",
    "children": "childrens-middle-grade-hardcover",
    "manga": "graphic-books-and-manga",
  };
  

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Make an API call to check if the user is logged in
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include", // To ensure the session is included
        });

        if (response.ok) {
          // If logged in, fetch the username and update the state
          const data = await response.json();
          console.log("data is ", data);
          setUsername(data.username); // Assuming the response has a username field
          
          // Check if user needs to select genres
          const genreCheck = await fetch(`${apiUrl}/api/user/needs-genres`, {
            method: "GET",
            credentials: "include",
          });
          
          if (genreCheck.ok) {
            const genreData = await genreCheck.json();
            
            // If user needs to select genres, redirect to signup page
            if (genreData.needsGenres) {
              navigate("/signup?needsGenres=true");
            }
          }
        } else {
          // If not logged in, redirect to the login page
          navigate("/login");
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login");
      }
    };

    checkStatus();
    
    // Fetch books for each genre
    fetchBooksForAllGenres();
    
    // Fetch personalized recommendations
    fetchRecommendedBooks();
    
    // Fetch friend recommendations
    fetchFriendRecommendedBooks();
  }, [navigate]);

  const fetchBooksForAllGenres = async () => {
    setLoading(true);
    const genreBooksData = {};
    
    // Use Promise.all to fetch books for all genres in parallel
    await Promise.all(
      mainGenres.map(async (genre) => {
        const books = await fetchBooksForGenre(genre);
        genreBooksData[genre] = books;
      })
    );
    
    setGenreBooks(genreBooksData);
    setLoading(false);
  };

  const fetchBooksForGenre = async (genre) => {
    try {
      // Get the appropriate NYT list name for this genre
      const listName = genreToNYTList[genre];
      
      // Fetch books from our backend API that connects to NYT API
      const response = await fetch(`${apiUrl}/api/books/bestsellers/${listName}`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error(`Error fetching bestsellers for ${genre}: ${response.status}`);
        return [];
      }
      
      const data = await response.json();
      return data.books || [];
    } catch (error) {
      console.error(`Error fetching books for genre ${genre}:`, error);
      return [];
    }
  };

  const fetchRecommendedBooks = async () => {
    setRecommendationsLoading(true);
    try {
      // Fetch recommended books based on user's genre interests
      const response = await fetch(`${apiUrl}/api/books/recommendations`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error(`Error fetching recommendations: ${response.status}`);
        setRecommendedBooks([]);
        setRecommendationsLoading(false);
        return;
      }
      
      const data = await response.json();
      setRecommendedBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching recommended books:", error);
      setRecommendedBooks([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };
  
  const fetchFriendRecommendedBooks = async () => {
    setFriendRecommendationsLoading(true);
    try {
      // Fetch books recommended by people the user follows
      const response = await fetch(`${apiUrl}/api/books/friend-recommendations`, {
        method: "GET",
        credentials: "include",
      });
      
      if (!response.ok) {
        console.error(`Error fetching friend recommendations: ${response.status}`);
        setFriendRecommendedBooks([]);
        setFriendRecommendationsLoading(false);
        return;
      }
      
      const data = await response.json();
      setFriendRecommendedBooks(data.books || []);
    } catch (error) {
      console.error("Error fetching friend recommended books:", error);
      setFriendRecommendedBooks([]);
    } finally {
      setFriendRecommendationsLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="dashboard-header">
        <h1 className="welcome-header">Hi {username}!</h1>
        <h2 className="bestsellers-title">Today's Bestsellers by Genre</h2>
      </div>
      
      {/* Personalized Recommendations Section */}
      <div className="recommendations-section">
        <h2 className="recommendations-title">Recommended For You</h2>
        {recommendationsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading recommendations...</p>
          </div>
        ) : recommendedBooks.length > 0 ? (
          <div className="books-scroll-container">
            <div className="books-scroll">
              {recommendedBooks.slice(0, 15).map((book, index) => (
                <div 
                  key={index} 
                  className="book-card"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <div className="book-cover-container">
                    {book.avgRating && (
                      <div className="book-rating-badge">★ {book.avgRating}</div>
                    )}
                    <img 
                      src={book.coverUrl || "/default-book-cover.png"} 
                      alt={book.title} 
                      className="book-cover" 
                    />
                  </div>
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">By {book.author}</p>
                    <a 
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + " " + book.author)}`}
                      className="amazon-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Buy on Amazon
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-recommendations">
            <p>No personalized recommendations available yet. Try rating more books!</p>
          </div>
        )}
      </div>
      
      {/* Friend Recommendations Section */}
      <div className="recommendations-section friend-recommendations-section">
        <h2 className="recommendations-title">Recommended by People You Follow</h2>
        {friendRecommendationsLoading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading recommendations from people you follow...</p>
          </div>
        ) : friendRecommendedBooks.length > 0 ? (
          <div className="books-scroll-container">
            <div className="books-scroll">
              {friendRecommendedBooks.map((book, index) => (
                <div 
                  key={index} 
                  className="book-card"
                  onClick={() => navigate(`/books/${book.id}`)}
                >
                  <div className="book-cover-container">
                    {book.avgRating && (
                      <div className="book-rating-badge">★ {book.avgRating}</div>
                    )}
                    <img 
                      src={book.coverUrl || "/default-book-cover.png"} 
                      alt={book.title} 
                      className="book-cover" 
                    />
                  </div>
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">By {book.author}</p>
                    {book.recommendedBy && (
                      <p className="recommended-by">
                        Rated highly by: {book.recommendedBy.slice(0, 2).join(', ')}
                        {book.recommendedBy.length > 2 ? ` +${book.recommendedBy.length - 2} more` : ''}
                      </p>
                    )}
                    <a 
                      href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + " " + book.author)}`}
                      className="amazon-link"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Buy on Amazon
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="no-recommendations">
            <p>No recommendations from people you follow yet. Try following more users or encourage your friends to rate books!</p>
          </div>
        )}
      </div>
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading bestsellers...</p>
        </div>
      ) : (
        <div className="genre-rows-container">
          {mainGenres.map((genre) => (
            <div key={genre} className="genre-row">
              <h2 className="genre-title">{genre.charAt(0).toUpperCase() + genre.slice(1)}</h2>
              <div className="books-scroll-container">
                {genreBooks[genre] && genreBooks[genre].length > 0 ? (
                  <div className="books-scroll">
                    {genreBooks[genre].map((book, index) => (
                      <div 
                        key={index} 
                        className="book-card"
                        onClick={() => navigate(`/books/${book.id}`)}
                      >
                        <div className="book-cover-container">
                          {book.rank && <div className="book-rank">#{book.rank}</div>}
                          <img 
                            src={book.coverUrl || "/default-book-cover.png"} 
                            alt={book.title} 
                            className="book-cover" 
                          />
                          
                        </div>
                        <div className="book-info">
                          <h3 className="book-title">{book.title}</h3>
                          <p className="book-author">By {book.author}</p>

                          <a 
                            href={`https://www.amazon.com/s?k=${encodeURIComponent(book.title + " " + book.author)}`}
                            className="amazon-link"
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Buy on Amazon
                          </a>
                          
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-books-message">No bestsellers found for {genre}.</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
