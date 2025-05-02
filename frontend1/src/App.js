// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"; 
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/Notfound";
import Books from "./pages/Books";
import TVShows from "./pages/TVShows";
import BookDetails from "./pages/BookDetails";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Messages from "./pages/Messages";
import Temp from "./pages/Temp";
import ForgotPassword from "./pages/ForgotPassword";
// Import Thread pages
import Threads from "./pages/Threads";
import ThreadsByCategory from "./pages/ThreadsByCategory";
import ThreadDetail from "./pages/ThreadDetail";
import CreateThread from "./pages/CreateThread";
import SubscribedThreads from "./pages/SubscribedThreads";
import VerifyEmail from "./pages/VerifyEmail";

import { ThemeProvider } from "./components/ThemeContext";
import ThemeToggle from "./components/ThemeToggle";
import { useEffect, useState } from "react";
import "./css/theme.css";

function App() {
  const location = useLocation();
  const [showHelp, setShowHelp] = useState(true);
  
  // Show a help message about dark mode toggle when the user navigates
  useEffect(() => {
    setShowHelp(true);
    const timer = setTimeout(() => {
      setShowHelp(false);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [location.pathname]);
  
  return (
    <ThemeProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/books" element={<Books />} />
          <Route path="/books/:id" element={<BookDetails />} />
          <Route path="/tvshows" element={<TVShows />} />
          <Route path="/user/:username" element={<UserProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/temp" element={<Temp />} />
          <Route path="/messages/:userId" element={<Messages />} />
          
          {/* Thread Routes */}
          <Route path="/threads" element={<Threads />} />
          <Route path="/threads/category/:categoryId" element={<ThreadsByCategory />} />
          <Route path="/threads/subscribed" element={<SubscribedThreads />} />
          <Route path="/threads/create" element={<CreateThread />} />
          <Route path="/threads/:threadId" element={<ThreadDetail />} />
          <Route path="/verify-email" element={<VerifyEmail />} />
         
          <Route path="*" element={<NotFound />} />
        </Routes>
        
        {showHelp && (
          <div className="theme-help-message">
            Click the button in the bottom right to toggle dark/light mode
          </div>
        )}
        
        <ThemeToggle />
    </ThemeProvider>
  );
}

export default App;
