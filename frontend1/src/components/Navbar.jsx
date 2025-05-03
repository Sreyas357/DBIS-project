import React, { useContext, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import "../css/navbar.css"; // Import CSS file
import { ThemeContext } from "./ThemeContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useContext(ThemeContext);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchUnreadCount();
    // Set up polling to check for new notifications every minute
    const interval = setInterval(fetchUnreadCount, 60000);
    
    // Add click event listener to close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
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

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
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
        <button onClick={() => navigate("/messages")}>Messages</button>
      </div>

      <div className="nav-right">
        <div className="profile-dropdown" ref={dropdownRef}>
          <div className="profile-icon" onClick={toggleDropdown}>
            <i className="fa fa-user-circle"></i>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
          </div>
          
          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-item" onClick={() => {
                navigate("/profile");
                setShowDropdown(false);
              }}>
                <i className="fa fa-user"></i> Profile
              </div>
              <div className="dropdown-item" onClick={() => {
                navigate("/notifications");
                setShowDropdown(false);
              }}>
                <i className="fa fa-bell"></i> Notifications
                {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
              </div>
              <div className="dropdown-divider"></div>
              <div className="dropdown-item" onClick={handleLogout}>
                <i className="fa fa-sign-out"></i> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
