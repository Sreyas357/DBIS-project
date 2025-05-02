import React, { useContext } from 'react';
import { ThemeContext } from '../components/ThemeContext';
import Navbar from '../components/Navbar';
import NotificationsComponent from '../components/Notifications';
import '../css/notifications.css';

const Notifications = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className={`notifications-page ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      <div className="content-container">
        <h1>Notifications</h1>
        <NotificationsComponent />
      </div>
    </div>
  );
};

export default Notifications; 