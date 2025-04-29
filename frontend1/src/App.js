// App.js
import { Routes, Route } from "react-router-dom"; 
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

function App() {
  return (
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
      <Route path="*" element={<NotFound />} />
      {/* Add more routes as needed */}
    </Routes>
  );
}

export default App;
