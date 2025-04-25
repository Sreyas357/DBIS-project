import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiUrl } from "../config/config";

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Check if the user is logged in by hitting the backend endpoint
        const response = await fetch(`${apiUrl}/isLoggedIn`, {
          method: "GET",
          credentials: "include", // Ensures cookies are sent with the request
        });

        // If response is ok, redirect to the dashboard, else to the login page
        const data = await response.json();
        
        if (response.ok && data.loggedIn) {
          navigate("/dashboard"); // Redirect to dashboard if logged in
        } else {
          navigate("/login"); // Redirect to login if not logged in
        }
      } catch (error) {
        console.error("Error checking login status:", error);
        navigate("/login"); // In case of an error, redirect to login
      }
    };

    checkStatus();
  }, [navigate]);

  return <div>Redirecting...</div>;
};

export default Home;
