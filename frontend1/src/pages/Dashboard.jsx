import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import Navbar from "../components/Navbar";
import { apiUrl } from "../config/config";

const Dashboard = () => {
  const navigate = useNavigate(); // Use this to redirect users

  const [username, setUsername] = useState("User");

  // Check if user is logged in and has selected genres
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
          console.log("data is ",data);
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
  }, [navigate]);

  /* 
    syntax for useEffect : 
    useEffect(() => {
        // Code to run when the component mounts or when specific dependencies change
    }, [dependencies]);

    here in above dependies array we have navigate as a dependency, so whenever navigate changes( it doesnot change in general) 
    but better practice to include all which are used in useEffect in the dependencies array, so that if navigate changes,
    the useEffect will run again.
  
  */

  return (
    <div>
      <Navbar />
      <h1>Hi {username} !</h1>
      <div>Welcome to the Ecommerce App</div>
    </div>
  );
};

export default Dashboard;
