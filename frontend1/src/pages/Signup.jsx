import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { apiUrl } from "../config/config";
import "../css/signup.css"; // Import the CSS file

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
          navigate("/dashboard"); // Redirect if authenticated
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

  // State for managing verification process
  const [signupStep, setSignupStep] = useState("initial");
  const [otpValue, setOtpValue] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle OTP input changes
  const handleOtpChange = (e) => {
    setOtpValue(e.target.value);
  };

  // Handle initial signup form submission
  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const response = await fetch(`${apiUrl}/signup/request-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSignupStep("verify-otp");
        setSuccessMessage("OTP sent to your email. Please check and verify.");
      } else {
        setErrorMessage(result.message || "Failed to send OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error requesting OTP:", err);
      setErrorMessage("Error sending OTP. Please try again later.");
    }
  };

  // Handle OTP verification submission
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    
    try {
      const response = await fetch(`${apiUrl}/signup/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          otp: otpValue,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        navigate("/dashboard"); // Redirect to dashboard on success
      } else {
        setErrorMessage(result.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error verifying OTP:", err);
      setErrorMessage("Error verifying OTP. Please try again later.");
    }
  };

  // Handle resend OTP
  const handleResendOtp = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    
    try {
      const response = await fetch(`${apiUrl}/signup/resend-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccessMessage("OTP resent to your email. Please check and verify.");
      } else {
        setErrorMessage(result.message || "Failed to resend OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      setErrorMessage("Error resending OTP. Please try again later.");
    }
  };

  // Go back to initial signup form
  const handleGoBack = () => {
    setSignupStep("initial");
    setErrorMessage("");
    setSuccessMessage("");
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <h2>Sign Up</h2>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        {signupStep === "initial" ? (
          // Initial signup form
          <form onSubmit={handleInitialSubmit}>
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
            <button type="submit">Request OTP</button>
          </form>
        ) : (
          // OTP verification form
          <form onSubmit={handleOtpSubmit}>
            <div>
              <p className="email-info">Verification code sent to: <strong>{formData.email}</strong></p>
              <label htmlFor="otp">Enter OTP:</label>
              <input
                type="text"
                id="otp"
                name="otp"
                value={otpValue}
                onChange={handleOtpChange}
                required
                placeholder="Enter 6-digit code"
                maxLength="6"
              />
            </div>
            <button type="submit">Verify OTP</button>
            <div className="otp-actions">
              <button type="button" onClick={handleResendOtp} className="resend-button">
                Resend OTP
              </button>
              <button type="button" onClick={handleGoBack} className="back-button">
                Back
              </button>
            </div>
          </form>
        )}
        
        <p>
          Already have an account? <a href="/login">Login here</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
