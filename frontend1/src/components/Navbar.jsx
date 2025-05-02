import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router";
import "../css/navbar.css"; // Import CSS file
import { ThemeContext } from "./ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Set up polling to check for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await fetch("http://localhost:4000/api/notifications/unread-count", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUnreadCount(data.count);
      }
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  };

  const handleLogout = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:4000/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        navigate("/login"); // Redirect to login
      } else {
        console.error("Error logging out");
      }
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <nav className={`navbar ${isDarkMode ? 'dark-mode' : ''}`}>
      <div className="nav-left">
        <div className="nav-logo" onClick={() => navigate("/dashboard")}>📚 My Library</div>
      </div>

      <div className="nav-center">
        <button onClick={() => navigate("/dashboard")}>Home</button>
        <button onClick={() => navigate("/books")}>Books</button>
        <button onClick={() => navigate("/threads")}>Discussions</button>
        <button onClick={() => navigate("/groups")}>Groups</button>
        <button onClick={() => navigate("/profile")}>Profile</button>
        <button onClick={() => navigate("/messages")}>Messages</button>
        <button onClick={() => navigate("/temp")}> Temp </button>
      </div>

      <div className="nav-right">
        <div className="notification-icon" onClick={() => navigate("/notifications")}>
          <i className="fa fa-bell"></i>
          {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
        </div>
        <button className="logout-btn" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  );
};

export default Navbar;
