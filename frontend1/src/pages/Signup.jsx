import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Add useLocation
import { apiUrl } from "../config/config";
import "../css/signup.css";

const Signup = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Add location to get state

  // Check for needsGenres parameter in URL
  useEffect(() => {
    // Check URL query params for needsGenres
    const params = new URLSearchParams(window.location.search);
    if (params.get('needsGenres') === 'true') {
      setSignupStep('genres');
    }
  }, []);

  // Redirect if user is already logged in but needs to select genres
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/check-auth`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          // Check if user needs to select genres
          const genreCheck = await fetch(`${apiUrl}/api/user/needs-genres`, {
            method: "GET",
            credentials: "include",
          });
          
          if (genreCheck.ok) {
            const genreData = await genreCheck.json();
            
            // If user doesn't need genres, redirect to dashboard
            if (!genreData.needsGenres) {
              navigate("/dashboard");
            } else {
              // User needs to select genres, show the genre step
              setSignupStep('genres');
            }
          } else {
            // If we can't check for genres, assume logged in and redirect
            navigate("/dashboard");
          }
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
      }
    };
    checkStatus();
  }, [navigate]);

  // State for form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Add state for genres and selected genres
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [signupStep, setSignupStep] = useState('account'); // 'account' or 'genres'

  // Check if should show genres step based on location state
  useEffect(() => {
    if (location.state?.signupStep === 'genres') {
      setSignupStep('genres');
    }
  }, [location]);

  // Fetch genres when component mounts
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await fetch(`${apiUrl}/books-data`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setGenres(data.genres || []);
        }
      } catch (err) {
        console.error("Error fetching genres:", err);
      }
    };
    fetchGenres();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle Google Sign-In
  const handleGoogleSignIn = () => {
    window.location.href = 'http://localhost:4000/auth/google?source=signup';
  };

  // Handle genre selection
  const handleGenreToggle = (genreId) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter(id => id !== genreId));
    } else {
      setSelectedGenres([...selectedGenres, genreId]);
    }
  };

  // Handle submit for genre interests
  const handleGenreSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedGenres.length < 3) {
      setErrorMessage("Please select at least 3 genres you're interested in");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    
    try {
      // Submit selected genres to backend
      const response = await fetch(`${apiUrl}/api/user/genres`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ genres: selectedGenres }),
        credentials: "include",
      });

      if (response.ok) {
        navigate("/dashboard");
      } else {
        const result = await response.json();
        setErrorMessage(result.message || "Failed to save genre preferences. Please try again.");
      }
    } catch (err) {
      console.error("Error saving genre preferences:", err);
      setErrorMessage("Error saving preferences. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle signup form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      console.log("Sending verification email to:", formData.email);
      
      // Send verification email instead of completing signup
      const response = await fetch(`${apiUrl}/api/auth/send-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      console.log("Response status:", response.status);
      const result = await response.json();
      console.log("API response:", result);

      if (response.ok) {
        // No longer storing in localStorage
        setSuccessMessage("Verification email sent! Redirecting...");
        
        // Pass all signup data through navigation state
        try {
          console.log("Attempting navigation to /verify-email");
          navigate("/verify-email", { 
            state: { 
              email: formData.email,
              username: formData.username,
              password: formData.password,
              signupData: formData
            } 
          });
        } catch (navError) {
          console.error("Navigation error:", navError);
          // Hard fallback - note this will lose the state data if used
          window.location.href = "/verify-email";
        }
      } else {
        setErrorMessage(result.message || "Failed to send verification email. Please try again.");
      }
    } catch (err) {
      console.error("Error during signup:", err);
      setErrorMessage("Error signing up. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Render the appropriate step (account details or genre selection)
  if (signupStep === 'genres') {
    return (
      <div className="signup-container">
        <div className="signup-box">
          <h2>Select Your Interests</h2>
          <p>Please select at least 3 genres you're interested in</p>
          
          {errorMessage && <p className="error-message">{errorMessage}</p>}
          
          <form onSubmit={handleGenreSubmit}>
            <div className="genre-grid">
              {genres.map(genre => (
                <div 
                  key={genre.id} 
                  className={`genre-item ${selectedGenres.includes(genre.id) ? 'selected' : ''}`}
                  onClick={() => handleGenreToggle(genre.id)}
                >
                  {genre.name}
                </div>
              ))}
            </div>
            
            <div className="genre-count">
              Selected: {selectedGenres.length} {selectedGenres.length < 3 && "(minimum 3)"}
            </div>
            
            <button type="submit" disabled={isLoading || selectedGenres.length < 3}>
              {isLoading ? "Saving..." : "Complete Signup"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Default account signup step
  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" disabled={isLoading}>
            {isLoading ? "Sending..." : "Verify Email"}
          </button>
        </form>
        
        <div className="or-divider">
          <span>OR</span>
        </div>
        
        <button 
          type="button" 
          className="google-sign-in-btn"
          onClick={handleGoogleSignIn}
        >
          <img 
            src="https://developers.google.com/identity/images/g-logo.png" 
            alt="Google logo" 
            className="google-icon" 
          />
          Sign up with Google
        </button>
        
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
