import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"; // Fix import to use react-router-dom instead of react-router
import { apiUrl } from "../config/config";
import "../css/signup.css";

const Signup = () => {
  const navigate = useNavigate();

  // Redirect if user is already logged in
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/check-auth`, {
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

  // State for form data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
