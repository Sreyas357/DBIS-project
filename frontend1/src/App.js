// App.js
import { Routes, Route, useLocation } from "react-router-dom"; 
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
import Temp from "./pages/Temp"
import Threads from "./pages/Threads"
import ThreadDetail from "./pages/ThreadDetail"
import EditThread from "./pages/EditThread"
import CreateThread from "./pages/CreateThread"
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
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/books" element={<Books />} />
        <Route path="/books/:id" element={<BookDetails />} />
        <Route path="/tvshows" element={<TVShows />} />
        <Route path="/user/:username" element={<UserProfile />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/temp" element={<Temp />} />
        <Route path="/messages/:userId" element={<Messages />} />
        <Route path="/threads" element={<Threads />} />
        <Route path="/threads/:threadId" element={<ThreadDetail />} />
        <Route path="/threads/:threadId/edit" element={<EditThread />} />
        <Route path="/create-thread" element={<CreateThread />} />
        <Route path="/threads/:threadId/reply" element={<CreateThread />} />
        <Route path="*" element={<NotFound />} />
        {/* Add more routes as needed */}
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
