import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/login.css"; // Import CSS file

const Login = () => {
  const navigate = useNavigate(); // Use this to redirect users
  const location = useLocation();

  // Read error from URL or navigation state
  useEffect(() => {
    // Check URL query parameters
    const params = new URLSearchParams(window.location.search);
    const urlError = params.get('error');
    
    if (urlError === 'existing_account') {
      setErrorMessage('There is already an account with this Gmail, please login.');
    } else if (urlError) {
      setErrorMessage(urlError);
    }
    
    // Check location state (from redirects)
    if (location.state && location.state.errorMessage) {
      setErrorMessage(location.state.errorMessage);
      // Clear state after reading
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  // useEffect checks if the user is already logged in
  // if already loggedIn then it will simply navigate to the dashboard
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include",
        });
        if (response.ok) {
          navigate("/dashboard");
        }
      } catch (err) {
        console.error("Error checking auth status:", err);
      }
    };
    checkStatus();
  }, [navigate]);

  // Read about useState to manage form data
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });


const [errorMessage, setErrorMessage] = useState(""); // Initialize with an empty string

// Handle form input changes
const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData({
    ...formData, 
    [name]: value, 
  });
};

// Handle Google Sign-In
const handleGoogleSignIn = () => {
  window.location.href = 'http://localhost:4000/auth/google?source=login';
};


// Handle form submission for login
const handleSubmit = async (e) => {
  e.preventDefault();

  // Send the login credentials to the server
  try {
    const response = await fetch(`${apiUrl}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
      credentials: "include", // Ensures cookies are sent with the request
    });

    const data = await response.json();

    if (response.status === 200) {
      // If login is successful, redirect to the dashboard
      navigate("/dashboard");
    } else {
      // Display error message if login failed
      setErrorMessage(data.message || "Login failed. Please try again.");
    }
  } catch (error) {
    console.error("Login error:", error);
    setErrorMessage("Error logging in. Please try again later.");
  }
};

return (
  <div className="login-container">
    <div className="login-box">
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button type="submit">Login</button>
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
        Sign in with Google
      </button>
      
      <p className="signup-link">
        Don't have an account? <Link to="/signup" className="signup-link-text">Sign up here</Link>
      </p>
      <p className="forgot-password-link">
        <Link to="/forgot-password" className="forgot-password-link-text">Forgot Password?</Link>
      </p>
    </div>
  </div>
);

};

export default Login;