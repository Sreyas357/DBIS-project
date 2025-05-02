import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiUrl } from "../config/config";
import "../css/verify-email.css";

const VerifyEmail = () => {
  console.log("VerifyEmail component rendering"); // Debug log
  
  const navigate = useNavigate();
  const location = useLocation();
  const [otp, setOtp] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [email, setEmail] = useState("");
  const [resendDisabled, setResendDisabled] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [signupData, setSignupData] = useState(null);

  // Get data from location state
  useEffect(() => {
    console.log("VerifyEmail component mounted");
    console.log("Current URL:", window.location.href);
    console.log("Location state:", location.state);
    
    const emailFromState = location.state?.email;
    const signupDataFromState = location.state?.signupData;
    
    if (emailFromState && signupDataFromState) {
      console.log("Using data from state");
      setEmail(emailFromState);
      setSignupData(signupDataFromState);
    } else {
      console.log("No signup data found, redirecting to signup");
      alert("Your verification session has expired. Please try signing up again.");
      navigate("/signup");
      return;
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [location, navigate]);

  // Format time as MM:SS
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  // Handle OTP input
  const handleOtpChange = (e) => {
    // Only allow numbers
    const value = e.target.value.replace(/\D/g, '');
    setOtp(value);
  };

  // Verify OTP
  const verifyOtp = async (e) => {
    e.preventDefault();
    
    if (!otp || otp.length < 4) {
      setErrorMessage("Please enter a valid OTP");
      return;
    }
    
    if (!signupData) {
      setErrorMessage("Signup data not available. Please try again.");
      navigate("/signup");
      return;
    }
    
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      console.log("Verifying OTP for email:", email);
      
      // First verify the OTP
      const verifyResponse = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          email: email,
          otp 
        }),
        credentials: "include"
      });

      console.log("OTP verification response status:", verifyResponse.status);
      const verifyResult = await verifyResponse.json();
      console.log("OTP verification result:", verifyResult);

      if (verifyResponse.ok) {
        setSuccessMessage("Email verified successfully!");
        
        // Now complete the signup process with data from state
        console.log("Completing signup for:", email);
        const signupResponse = await fetch(`${apiUrl}/signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(signupData),
        });

        console.log("Signup response status:", signupResponse.status);
        const signupResult = await signupResponse.json();
        console.log("Signup result:", signupResult);

        if (signupResponse.ok) {
          setSuccessMessage("Account created successfully! Redirecting to dashboard...");
          // Show success message briefly before redirect
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        } else {
          setErrorMessage(signupResult.message || "Signup failed. Please try again.");
        }
      } else {
        setErrorMessage(verifyResult.message || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("Error during verification:", err);
      setErrorMessage("Error verifying email: " + (err.message || "Please try again later"));
    } finally {
      setIsLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    setResendDisabled(true);
    setErrorMessage("");
    setSuccessMessage("");
    
    if (!signupData) {
      setErrorMessage("Cannot resend verification. Please try signing up again.");
      navigate("/signup");
      return;
    }
    
    try {
      console.log("Resending OTP for:", email);
      
      const response = await fetch(`${apiUrl}/api/auth/send-verification-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(signupData),
        credentials: "include"
      });

      console.log("Resend response status:", response.status);
      const result = await response.json();
      console.log("Resend result:", result);

      if (response.ok) {
        setSuccessMessage("Verification email resent. Please check your inbox.");
        setTimeLeft(600); // Reset the timer to 10 minutes
        
        // Disable resend button for 1 minute
        setResendCountdown(60);
        const countdownTimer = setInterval(() => {
          setResendCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownTimer);
              setResendDisabled(false);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setErrorMessage(result.message || "Failed to resend verification email.");
        setResendDisabled(false);
      }
    } catch (err) {
      console.error("Error resending OTP:", err);
      setErrorMessage("Error resending verification email: " + (err.message || ""));
      setResendDisabled(false);
    }
  };

  return (
    <div className="verify-email-container">
      <div className="verify-email-box">
        <h2>Verify Your Email</h2>
        
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        {successMessage && <p className="success-message">{successMessage}</p>}
        
        <p>A verification code has been sent to <strong>{email}</strong>.</p>
        <p>Please enter the code below. The code will expire in <strong>{formatTime(timeLeft)}</strong>.</p>
        
        <form onSubmit={verifyOtp}>
          <div className="otp-input-container">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={handleOtpChange}
              required
              maxLength="6"
            />
          </div>
          
          <button type="submit" disabled={isLoading || timeLeft === 0}>
            {isLoading ? "Verifying..." : "Verify & Complete Signup"}
          </button>
        </form>
        
        <div className="resend-section">
          <button 
            onClick={resendOtp} 
            disabled={resendDisabled || isLoading}
            className="resend-button"
          >
            {resendDisabled 
              ? `Resend OTP (${resendCountdown}s)` 
              : "Resend OTP"}
          </button>
        </div>
        
        <p className="back-link">
          <a href="/signup" onClick={(e) => {
            e.preventDefault();
            navigate("/signup");
          }}>← Back to Signup</a>
        </p>
      </div>
    </div>
  );

    
};

export default VerifyEmail;
