import React, { useContext } from 'react';
import { ThemeContext } from '../components/ThemeContext';
import Navbar from '../components/Navbar';
import '../css/theme.css';

const Temp = () => {
  const { isDarkMode } = useContext(ThemeContext);

  return (
    <div className={`page-container ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      <div className="content-card" style={{ margin: '30px auto', maxWidth: '800px' }}>
        <h1>Dark Mode Test Page</h1>
        <p>This page demonstrates the dark mode functionality working across all pages.</p>
        
        <div style={{ marginTop: '30px' }}>
          <h2>Current Theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}</h2>
          <p>Use the floating toggle button in the bottom right corner to switch themes.</p>
        </div>
        
        <div style={{ marginTop: '30px' }}>
          <h2>Form Elements</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px' }}>
            <input type="text" placeholder="Text input" />
            <select>
              <option>Select option</option>
              <option>Option 1</option>
              <option>Option 2</option>
            </select>
            <textarea placeholder="Textarea" rows="4"></textarea>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button style={{ 
                padding: '8px 16px', 
                background: 'var(--button-primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px' 
              }}>
                Primary Button
              </button>
              <button style={{ 
                padding: '8px 16px', 
                background: 'var(--button-secondary)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--input-border)', 
                borderRadius: '4px' 
              }}>
                Secondary Button
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Temp;