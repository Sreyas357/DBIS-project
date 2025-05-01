const express = require("express");
const bodyParser = require("body-parser");
const session = require("express-session");
const bcrypt = require("bcrypt");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();
const port = 4000;

// PostgreSQL connection
// NOTE: use YOUR postgres username and password here
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'ecommerce',
  password: '0608',
  port: 5432,
});

const db = pool;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// CORS: Give permission to localhost:3000 (ie our React app)
// to use this backend API
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Session information
app.use(
  session({
    secret: "your_secret_key",
    resave: false,
    saveUninitialized: true,
    cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 24 }, // 1 day
  })
);

// Authentication middleware
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    // If a session exists, continue to the next route handler
    return next();
  } else {
    // If no session, respond with a 401 Unauthorized error
    return res.status(401).json({ message: "Unauthorized" });
  }
}

// Root endpoint
app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});

// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// Signup
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Check if all fields are provided
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Error: Missing required fields" });
  }

  try {
    // Check if the email already exists
    const emailCheckQuery = 'SELECT * FROM users WHERE email = $1';
    const emailCheckResult = await pool.query(emailCheckQuery, [email]);

    if (emailCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "Error: Email is already registered." });
    }

    // Check if the username already exists
    const usernameCheckQuery = 'SELECT * FROM users WHERE username = $1';
    const usernameCheckResult = await pool.query(usernameCheckQuery, [username]);

    if (usernameCheckResult.rows.length > 0) {
      return res.status(400).json({ message: "Error: Username is already taken." });
    }

    // Hash the password before saving it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const insertUserQuery = `
      INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3) RETURNING user_id, username, email;
    `;
    const insertResult = await pool.query(insertUserQuery, [username, email, hashedPassword]);

    const newUser = insertResult.rows[0];

    // Store the user_id in the session
    req.session.userId = newUser.user_id;
    req.session.username = newUser.username;

    // Respond with success message
    return res.status(200).json({ message: "User Registered Successfully" });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Error signing up" });
  }
});

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Invalid credentials" });
  }

  try {
    // Check if the email exists in the database
    const checkEmailQuery = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(checkEmailQuery, [email]);

    if (result.rows.length === 0) {
      // If email doesn't exist, return an error message
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];

    // Compare the provided password with the hashed password in the database
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      // If the password doesn't match, return an error message
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Store the user ID in the session after successful login
    req.session.userId = user.user_id;
    req.session.username = user.username;

    // Respond with a success message
    return res.status(200).json({ message: "Login successful" });

  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Error logging in" });
  }
});

// IsLoggedIn check
app.get("/isLoggedIn", (req, res) => {
  if (req.session && req.session.userId) {
    console.log("User is logged in with session:", {
      userId: req.session.userId,
      username: req.session.username
    });
    return res.status(200).json({
      message: "User is logged in",
      username: req.session.username,
      userId: req.session.userId
    });
  }
  console.log("User is not logged in, no valid session found");
  return res.status(400).json({ message: "User is not logged in" });
});

// Logout
app.get("/logout", (req, res) => {
  // Destroy the session
  req.session.destroy((err) => {
    if (err) {
      // If there's an error while destroying the session, send a failure response
      return res.status(500).json({ message: "Failed to log out" });
    }

    // If session is destroyed successfully, send a success response
    res.status(200).json({ message: "Logged out successfully" });
  });
});

// Book APIs
// Fetch all books, genres, and book_genres
app.get("/books-data", async (req, res) => {
  try {
    const booksQuery = "SELECT * FROM books";
    const genresQuery = "SELECT * FROM genres";
    const bookGenresQuery = "SELECT * FROM book_genres";

    const [books, genres, bookGenres] = await Promise.all([
      pool.query(booksQuery),
      pool.query(genresQuery),
      pool.query(bookGenresQuery),
    ]);

    res.json({
      books: books.rows,
      genres: genres.rows,
      bookGenres: bookGenres.rows,
    });
  } catch (err) {
    console.error("Error fetching books data:", err);
    res.status(500).json({ error: "Failed to fetch data" });
  }
});

// Get single book
app.get('/books/:id', async (req, res) => {
  try {
    // Get book details
    const bookQuery = await pool.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (bookQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Get genres for this book
    const genresQuery = await pool.query(`
      SELECT g.name 
      FROM genres g
      JOIN book_genres bg ON g.id = bg.genre_id
      WHERE bg.book_id = $1
    `, [req.params.id]);

    res.json({
      ...bookQuery.rows[0],
      genres: genresQuery.rows.map(g => g.name)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user's reviews
app.get('/user/reviews', async (req, res) => {
  try {
    // 1. Verify user is authenticated
    if (!req.session.userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // 2. Fetch reviews from database
    const result = await pool.query(
      'SELECT book_id, rating, comment FROM user_book_reviews WHERE user_id = $1',
      [req.session.userId]
    );

    // 3. Return reviews
    res.json(result.rows);

  } catch (error) {
    console.error('Failed to fetch reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Rate a book
app.post('/rate-book', async (req, res) => {
  const client = await db.connect();

  try {
    // 1. Check authentication
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { book_id, rating } = req.body;

    console.log(`Processing rating: Book ID=${book_id}, Rating=${rating}, User ID=${userId}`);

    // 2. Validate input
    if (!book_id || rating < 0 || rating > 5) {
      return res.status(400).json({ error: 'Invalid book_id or rating' });
    }

    await client.query('BEGIN');

    // 3. Check if user has rated this book before
    const prevRes = await client.query(
      `SELECT rating FROM user_book_reviews WHERE book_id = $1 AND user_id = $2`,
      [book_id, userId]
    );
    const prevRating = prevRes.rows[0]?.rating;

    console.log(`Previous rating: ${prevRating || 'none'}`);

    let newAvg = 0;
    let newCount = 0;

    // 4. Get current book stats
    const bookRes = await client.query(
      `SELECT avg_rating, num_ratings FROM books WHERE id = $1`,
      [book_id]
    );
    
    if (bookRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }

    const { avg_rating = 0, num_ratings = 0 } = bookRes.rows[0];

    console.log(`Current book stats: avg_rating=${avg_rating}, num_ratings=${num_ratings}`);

    // 5. Handle rating logic
    if (prevRating === undefined) {
      // New rating
      if (rating > 0) {
        await client.query(
          `INSERT INTO user_book_reviews (book_id, user_id, rating, updated_at)
           VALUES ($1, $2, $3, NOW())`,
          [book_id, userId, rating]
        );
        newCount = num_ratings + 1;
        newAvg = ((avg_rating * num_ratings) + rating) / newCount;
      } else {
        // Skip if trying to add a 0 rating
        await client.query('COMMIT');
        return res.status(200).json({
          avg_rating: Number(avg_rating),
          num_ratings: num_ratings
        });
      }
    } else if (rating === 0 || prevRating === rating) {
      // Remove rating
      await client.query(
        `DELETE FROM user_book_reviews WHERE book_id = $1 AND user_id = $2`,
        [book_id, userId]
      );

      newCount = num_ratings - 1;
      newAvg = newCount > 0
        ? ((avg_rating * num_ratings) - prevRating) / newCount
        : 0;
    } else {
      // Update rating
      await client.query(
        `UPDATE user_book_reviews
         SET rating = $1, updated_at = NOW()
         WHERE book_id = $2 AND user_id = $3`,
        [rating, book_id, userId]
      );
      newCount = num_ratings;
      newAvg = ((avg_rating * num_ratings) - prevRating + rating) / newCount;
    }

    // Ensure values are valid
    newCount = Math.max(0, newCount);
    newAvg = newCount > 0 ? Math.min(5, Math.max(0, newAvg)) : 0;

    console.log(`New stats: avg_rating=${newAvg}, num_ratings=${newCount}`);

    // 6. Update book record
    const updateRes = await client.query(
      `UPDATE books
       SET avg_rating = ROUND($1::numeric, 2),
           num_ratings = $2
       WHERE id = $3
       RETURNING avg_rating, num_ratings`,
      [newAvg, newCount, book_id]
    );

    await client.query('COMMIT');

    return res.status(200).json({
      avg_rating: Number(updateRes.rows[0].avg_rating),
      num_ratings: updateRes.rows[0].num_ratings
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in /rate-book:', error);
    return res.status(500).json({ error: 'Failed to rate book', details: error.message });
  } finally {
    client.release();
  }
});

// Get user profile
app.get('/user/profile', async (req, res) => {
  try {
      if (!req.session.userId) {
          return res.status(401).json({ error: 'Not authenticated' });
      }

      // Get user info
      const user = await db.query(
          'SELECT user_id, username, email FROM users WHERE user_id = $1',
          [req.session.userId]
      );

      // Get rated books
      const ratedBooks = await db.query(`
          SELECT r.book_id, b.title, b.author, r.rating, r.comment 
          FROM user_book_reviews r
          JOIN books b ON r.book_id = b.id
          WHERE r.user_id = $1
          ORDER BY r.updated_at DESC
      `, [req.session.userId]);

      res.json({
          user: user.rows[0],
          ratedBooks: ratedBooks.rows
      });

  } catch (error) {
      console.error('Profile error:', error);
      res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Search users
app.get('/user/search', async (req, res) => {
  const { username } = req.query;

  if (!username || username.trim() === '') {
    return res.status(400).json({ message: 'Username query is required' });
  }

  try {
    const searchQuery = `
      SELECT user_id, username
      FROM users
      WHERE username ILIKE $1
      ORDER BY 
        CASE 
          WHEN username ILIKE $2 THEN 0 
          ELSE 1 
        END,
        username
      LIMIT 4;
    `;

    const values = [`%${username}%`, `${username}`];
    const result = await pool.query(searchQuery, values);

    return res.status(200).json({ users: result.rows });
  } catch (err) {
    console.error('Search error:', err);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user profile by username
app.get('/user/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = req.session.userId;

  try {
      // Find user by username
      const userResult = await pool.query(
          `SELECT user_id, username, email FROM users WHERE username = $1`,
          [username]
      );

      if (userResult.rows.length === 0) {
          return res.status(404).json({ message: 'User not found' });
      }

      const profileUser = userResult.rows[0];

      // Get all rated books for the user
      const ratedBooksResult = await pool.query(
          `SELECT 
              b.id AS book_id, 
              b.title, 
              b.author, 
              r.rating, 
              r.comment
          FROM user_book_reviews r
          JOIN books b ON r.book_id = b.id
          WHERE r.user_id = $1`,
          [profileUser.user_id]
      );

      // Default to not following
      let isFollowing = false;

      if (currentUserId && parseInt(currentUserId) !== profileUser.user_id) {
          const followResult = await pool.query(
              `SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2`,
              [currentUserId, profileUser.user_id]
          );

          isFollowing = followResult.rowCount > 0;
      }

      res.status(200).json({
          user: {
              user_id: profileUser.user_id,
              username: profileUser.username,
              email: profileUser.email
          },
          ratedBooks: ratedBooksResult.rows,
          isFollowing
      });

  } catch (err) {
      console.error('Error fetching user profile:', err);
      res.status(500).json({ message: 'Internal server error' });
  }
});

// Follow/unfollow user
app.post('/user/follow/:username', async (req, res) => {
  const followerId = req.session.userId;
  const { username } = req.params;

  if (!followerId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const userResult = await db.query(
      'SELECT user_id FROM users WHERE username = $1',
      [username]
    );

    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const followingId = userResult.rows[0].user_id;

    if (parseInt(followerId) === parseInt(followingId)) {
      return res.status(400).json({ error: "You can't follow yourself." });
    }

    const existing = await db.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [followerId, followingId]
    );

    if (existing.rowCount > 0) {
      // Already following → unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [followerId, followingId]
      );
      return res.status(200).json({ message: 'Unfollowed successfully' });
    } else {
      // Not following → follow
      await db.query(
        'INSERT INTO follows (follower_id, following_id, followed_at) VALUES ($1, $2, NOW())',
        [followerId, followingId]
      );
      return res.status(200).json({ message: 'Followed successfully' });
    }
  } catch (error) {
    console.error('Error in /user/follow/:username:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Message APIs
// Get conversations
app.get('/messages/conversations', async (req, res) => {
  try {
      const currentUserId = req.session.userId;

      const query = `
          SELECT u.user_id, u.username, MAX(m.created_at) as last_message_time
          FROM messages m
          JOIN users u ON 
              (u.user_id = m.sender_id AND m.recipient_id = $1)
              OR (u.user_id = m.recipient_id AND m.sender_id = $1)
          WHERE u.user_id != $1
          GROUP BY u.user_id, u.username
          ORDER BY last_message_time DESC
      `;

      const { rows } = await pool.query(query, [currentUserId]);
      res.json(rows);
  } catch (err) {
      console.error('Error fetching conversations:', err);
      res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages with a user
app.get('/messages/:userId', async (req, res) => {
  const currentUserId = req.session.userId;
  const otherUserId = parseInt(req.params.userId);
  // const { before } = req.query; // Optional timestamp for pagination
  // const limit = 20;

  try {
      let query = `
          SELECT 
              message_id, sender_id, recipient_id, message, created_at
          FROM messages
          WHERE (
              (sender_id = $1 AND recipient_id = $2) OR
              (sender_id = $2 AND recipient_id = $1)
          )
      `;

      const params = [currentUserId, otherUserId];

      // if (before) {
      //     query += ` AND created_at < $3`;
      //     params.push(before);
      // }

      query += `
          ORDER BY created_at DESC
          `;
          
          // LIMIT ${limit}
      const { rows } = await pool.query(query, params);
      res.json(rows.reverse()); // Reverse to show oldest to newest in UI
  } catch (err) {
      console.error('Error fetching messages:', err);
      res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a message
app.post('/messages/send', async (req, res) => {
  const senderId = req.session.userId;
  const { recipient_id, message } = req.body;

  // Logging incoming data
  console.log("Sender ID:", senderId);
  console.log("Recipient ID:", recipient_id);
  console.log("Message:", message);

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty' });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO messages (sender_id, recipient_id, message)
        VALUES ($1, $2, $3)
        RETURNING message_id, sender_id, recipient_id, message, created_at
      `,
      [senderId, recipient_id, message.trim()]
    );

    console.log("Message Sent:", result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error sending message:', err);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Get user by username for messages
app.get('/user/messages/:username', async (req, res) => {
  const { username } = req.params;

  try {
      const result = await pool.query(
          'SELECT user_id, username FROM Users WHERE username = $1',
          [username]
      );

      if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.json(result.rows[0]);
  } catch (err) {
      console.error('Error fetching user by username:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Add Book Search API for thread creation
app.get('/books-search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    const query = `
      SELECT id, title, author, coverurl
      FROM books
      WHERE 
        title ILIKE $1 OR 
        author ILIKE $1
      ORDER BY 
        CASE WHEN title ILIKE $2 THEN 0
             WHEN author ILIKE $2 THEN 1
             ELSE 2
        END,
        title
      LIMIT 10
    `;
    
    const result = await pool.query(query, [`%${q}%`, `${q}%`]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error searching books:', err);
    res.status(500).json({ error: 'Failed to search books' });
  }
});

// ==== THREAD SYSTEM APIs ====

// Get thread categories
app.get('/api/thread-categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM thread_categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching thread categories:', err);
    res.status(500).json({ error: 'Failed to fetch thread categories' });
  }
});

// / Get trending threads
app.get('/api/threads/trending', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT t.*, 
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        (t.upvotes - t.downvotes) * 0.7 + t.view_count * 0.3 DESC,
        t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trending threads:', err);
    res.status(500).json({ error: 'Failed to fetch trending threads' });
  }
});

// Get newest threads
app.get('/api/threads/newest', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT t.*, 
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching newest threads:', err);
    res.status(500).json({ error: 'Failed to fetch newest threads' });
  }
});

// Fix the most-commented endpoint - add table aliases to prevent ambiguous column references
app.get('/api/threads/most-commented', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT t.thread_id, t.title, t.content, t.user_id, t.category_id, t.book_id, 
             t.is_pinned, t.is_locked, t.view_count, t.upvotes, t.downvotes, 
             t.created_at, t.updated_at,
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        COALESCE(COUNT(DISTINCT c.comment_id), 0) DESC,
        t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching most commented threads:', err);
    res.status(500).json({ error: 'Failed to fetch most commented threads' });
  }
});

// Fix the most-viewed endpoint - add table aliases
app.get('/api/threads/most-viewed', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT t.thread_id, t.title, t.content, t.user_id, t.category_id, t.book_id, 
             t.is_pinned, t.is_locked, t.view_count, t.upvotes, t.downvotes, 
             t.created_at, t.updated_at,
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        t.view_count DESC,
        t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching most viewed threads:', err);
    res.status(500).json({ error: 'Failed to fetch most viewed threads' });
  }
});

// Get top threads
app.get('/api/threads/top', async (req, res) => {
  try {
    const { limit = 10, offset = 0 } = req.query;
    
    const query = `
      SELECT t.*, 
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        (t.upvotes - t.downvotes) DESC,
        t.created_at DESC
      LIMIT $1 OFFSET $2
    `;
    
    const result = await pool.query(query, [limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching top threads:', err);
    res.status(500).json({ error: 'Failed to fetch top threads' });
  }
});

// Fix the category route - add table aliases and fix the ORDER BY clause
app.get('/api/threads/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { limit = 10, offset = 0, sort = 'trending' } = req.query;
    
    let orderBy = '';
    switch (sort) {
      case 'newest':
        orderBy = 't.created_at DESC';
        break;
      case 'most-commented':
        orderBy = 'comment_count DESC';
        break;
      case 'most-viewed':
        orderBy = 't.view_count DESC';
        break;
      case 'trending':
      default:
        orderBy = '(t.upvotes - t.downvotes) * 0.7 + t.view_count * 0.3 DESC';
    }
    
    const query = `
      SELECT t.thread_id, t.title, t.content, t.user_id, t.category_id, t.book_id, 
             t.is_pinned, t.is_locked, t.view_count, t.upvotes, t.downvotes, 
             t.comment_count as stored_comment_count,
             t.created_at, t.updated_at,
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      WHERE t.category_id = $1
      GROUP BY t.thread_id, t.comment_count, u.username, tc.name, tc.color, b.title
      ORDER BY 
        CASE WHEN t.is_pinned THEN 1 ELSE 0 END DESC,
        ${orderBy},
        t.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [categoryId, limit, offset]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching category threads:', err);
    res.status(500).json({ error: 'Failed to fetch category threads' });
  }
});

// Get threads related to a specific book
app.get('/api/threads/book/:bookId', async (req, res) => {
  try {
    const { bookId } = req.params;
    
    const query = `
      SELECT t.*, 
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      WHERE t.book_id = $1
      GROUP BY t.thread_id, u.username, tc.name, tc.color
      ORDER BY t.created_at DESC
    `;
    
    const result = await pool.query(query, [bookId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching book threads:', err);
    res.status(500).json({ error: 'Failed to fetch book threads' });
  }
});

// Fix the search endpoint - explicitly list all columns and avoid ambiguity
app.get('/api/threads/search', async (req, res) => {
  try {
    const { q, category, sort = 'trending' } = req.query;
    
    // Skip processing if query is too short
    if (!q || q.trim().length < 2) {
      return res.json([]);
    }
    
    let query = `
      SELECT t.thread_id, t.title, t.created_at, t.upvotes, t.downvotes, 
             t.comment_count as stored_comment_count, t.view_count, 
             u.username, u.user_id,
             tc.name AS category_name, tc.color AS category_color, tc.category_id, 
             b.id AS book_id, b.title AS book_title, b.author AS book_author,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      WHERE (
        LOWER(t.title) LIKE LOWER($1) OR 
        LOWER(u.username) LIKE LOWER($1) OR 
        LOWER(t.content) LIKE LOWER($1) OR
        (b.title IS NOT NULL AND LOWER(b.title) LIKE LOWER($1)) OR
        (b.author IS NOT NULL AND LOWER(b.author) LIKE LOWER($1))
      )
    `;
    
    const params = [`%${q}%`];
    let paramIndex = 2;
    
    // Add category filter if provided
    if (category && category !== 'all' && category !== 'subscribed') {
      query += ` AND t.category_id = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }
    
    // Add GROUP BY clause for aggregation
    query += `
      GROUP BY t.thread_id, t.comment_count, u.user_id, u.username, 
              tc.category_id, tc.name, tc.color, 
              b.id, b.title, b.author
    `;
    
    // Add sorting
    switch (sort) {
      case 'newest':
        query += ` ORDER BY t.created_at DESC`;
        break;
      case 'most-commented':
        query += ` ORDER BY comment_count DESC`;
        break;
      case 'most-viewed':
        query += ` ORDER BY t.view_count DESC`;
        break;
      case 'trending':
      default:
        // Trending algorithm - can be adjusted based on your definition
        query += ` ORDER BY (COALESCE(COUNT(DISTINCT c.comment_id), 0) * 2 + t.view_count + (t.upvotes - t.downvotes) * 3) DESC`;
    }
    
    // Always add a secondary sort by newest
    query += `, t.created_at DESC`;
    
    // Add limit for dropdown results
    const isForDropdown = !req.query.full;
    if (isForDropdown) {
      query += ` LIMIT 10`;
    }
    
    const result = await pool.query(query, params);
    res.json(result.rows);
    
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'An error occurred while searching threads' });
  }
});

// Make sure your thread detail route comes AFTER all the other specific routes
app.get('/api/threads/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Check if threadId is a valid integer to avoid the error
    if (!/^\d+$/.test(threadId)) {
      return res.status(400).json({ error: 'Invalid thread ID. Thread ID must be a number.' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Increment view count
      await client.query('UPDATE threads SET view_count = view_count + 1 WHERE thread_id = $1', [threadId]);
      
      // Get thread details - keep the existing code
      const threadQuery = `
        SELECT t.*, 
               u.username, 
               tc.name as category_name,
               tc.color as category_color,
               b.title as book_title,
               b.author as book_author,
               b.coverurl as book_coverurl,
               b.id as book_id
        FROM threads t
        JOIN users u ON t.user_id = u.user_id
        LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
        LEFT JOIN books b ON t.book_id = b.id
        WHERE t.thread_id = $1
      `;
      
      const threadResult = await client.query(threadQuery, [threadId]);
      
      if (threadResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Thread not found' });
      }
      
      // Get comments for the thread - keep the existing code
      const commentsQuery = `
        SELECT c.*, 
               u.username,
               (SELECT COUNT(*) FROM thread_replies WHERE comment_id = c.comment_id) as reply_count,
               COALESCE(
                 (SELECT vote_type FROM thread_votes 
                  WHERE user_id = $2 AND comment_id = c.comment_id),
                 0
               ) as user_vote
        FROM thread_comments c
        JOIN users u ON c.user_id = u.user_id
        WHERE c.thread_id = $1
        ORDER BY c.created_at ASC
      `;
      
      const commentsResult = await client.query(commentsQuery, [threadId, req.session?.userId || 0]);
      
      // Get all replies for this thread's comments - improved to get parent-child relationship
      const repliesQuery = `
        SELECT r.*, 
               u.username,
               c.thread_id, -- include thread_id for easier reference
               COALESCE(
                 (SELECT vote_type FROM thread_votes 
                  WHERE user_id = $2 AND reply_id = r.reply_id),
                 0
               ) as user_vote
        FROM thread_replies r
        JOIN users u ON r.user_id = u.user_id
        JOIN thread_comments c ON r.comment_id = c.comment_id
        WHERE c.thread_id = $1
        ORDER BY r.created_at ASC
      `;
      
      const repliesResult = await client.query(repliesQuery, [threadId, req.session?.userId || 0]);
      
      // Log the replies for debugging
      console.log(`Found ${repliesResult.rows.length} replies for thread ${threadId}`);
      
      // Combined result for comments and replies
      const combinedComments = [...commentsResult.rows, ...repliesResult.rows];
      
      // Check if user has subscribed to this thread
      let isSubscribed = false;
      
      if (req.session && req.session.userId) {
        const subscriptionQuery = `
          SELECT 1 FROM thread_subscriptions 
          WHERE user_id = $1 AND thread_id = $2
        `;
        
        const subscriptionResult = await client.query(subscriptionQuery, [req.session.userId, threadId]);
        isSubscribed = subscriptionResult.rows.length > 0;
      }
      
      // Check if user has voted on this thread
      let userVote = 0;
      
      if (req.session && req.session.userId) {
        const voteQuery = `
          SELECT vote_type FROM thread_votes 
          WHERE user_id = $1 AND thread_id = $2
        `;
        
        const voteResult = await client.query(voteQuery, [req.session.userId, threadId]);
        if (voteResult.rows.length > 0) {
          userVote = voteResult.rows[0].vote_type;
        }
      }
      
      await client.query('COMMIT');
      
      // Return the complete data
      res.json({
        thread: threadResult.rows[0],
        comments: combinedComments,
        isSubscribed,
        userVote
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Create a new thread
app.post('/api/threads', isAuthenticated, async (req, res) => {
  try {
    const { title, content, categoryId, bookId } = req.body;
    const userId = req.session.userId;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    const query = `
      INSERT INTO threads (title, content, user_id, category_id, book_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `;
    
    const result = await pool.query(query, [title, content, userId, categoryId || null, bookId || null]);
    
    // Auto-subscribe the user to their own thread
    await pool.query(
      'INSERT INTO thread_subscriptions (user_id, thread_id) VALUES ($1, $2)',
      [userId, result.rows[0].thread_id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ error: 'Failed to create thread' });
  }
});

// Add a comment to a thread
app.post('/api/threads/:threadId/comments', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Comment content is required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Add the comment
      const commentQuery = `
        INSERT INTO thread_comments (thread_id, user_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `;
      
      const commentResult = await client.query(commentQuery, [threadId, userId, content]);
      
      // Update comment count on the thread
      await client.query(
        'UPDATE threads SET comment_count = comment_count + 1 WHERE thread_id = $1',
        [threadId]
      );
      
      // Get username to return with comment
      const userQuery = 'SELECT username FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        ...commentResult.rows[0],
        username: userResult.rows[0].username
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Get replies for a comment
app.get('/api/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const query = `
      SELECT r.*, u.username,
             (SELECT COUNT(*) FROM thread_replies WHERE parent_reply_id = r.reply_id) as child_replies
      FROM thread_replies r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.comment_id = $1 AND r.parent_reply_id IS NULL
      ORDER BY r.created_at ASC
    `;
    
    const result = await pool.query(query, [commentId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Add a reply to a comment
app.post('/api/comments/:commentId/replies', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content, parentReplyId } = req.body;
    const userId = req.session.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Reply content is required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Add the reply
      const query = `
        INSERT INTO thread_replies (comment_id, user_id, parent_reply_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await client.query(query, [
        commentId, 
        userId, 
        parentReplyId || null, 
        content
      ]);
      
      // Update reply count on the comment
      await client.query(
        'UPDATE thread_comments SET reply_count = reply_count + 1 WHERE comment_id = $1',
        [commentId]
      );
      
      // Get username to return with reply
      const userQuery = 'SELECT username FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);
      
      await client.query('COMMIT');
      
      res.status(201).json({
        ...result.rows[0],
        username: userResult.rows[0].username
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ error: 'Failed to add reply' });
  }
});

// Add a reply to a comment or another reply
app.post('/api/threads/:threadId/replies', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, comment_id, parent_reply_id } = req.body;
    const userId = req.session.userId;
    
    if (!content || !comment_id) {
      return res.status(400).json({ error: 'Reply content and comment_id are required' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Debug logging
      console.log('Adding reply with data:', {
        comment_id,
        user_id: userId,
        parent_reply_id,
        content
      });
      
      // Add the reply
      const query = `
        INSERT INTO thread_replies (comment_id, user_id, parent_reply_id, content, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `;
      
      // Here parent_reply_id will be null for direct replies to comments,
      // otherwise it's the ID of the parent reply
      const result = await client.query(query, [
        comment_id, 
        userId, 
        parent_reply_id, // Can be null or a valid reply_id
        content
      ]);
      
      // Update reply count on the comment
      await client.query(
        'UPDATE thread_comments SET reply_count = reply_count + 1 WHERE comment_id = $1',
        [comment_id]
      );
      
      // Get username to return with reply
      const userQuery = 'SELECT username FROM users WHERE user_id = $1';
      const userResult = await client.query(userQuery, [userId]);
      
      await client.query('COMMIT');
      
      // Return the newly created reply with user information
      res.status(201).json({
        ...result.rows[0],
        username: userResult.rows[0].username
      });
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Database error adding reply:', err);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error adding reply:', err);
    res.status(500).json({ error: 'Failed to add reply', details: err.message });
  }
});

// Vote on a thread, comment, or reply
app.post('/api/vote', isAuthenticated, async (req, res) => {
  try {
    const { entityType, entityId, voteType } = req.body;
    const userId = req.session.userId;
    
    if (!['thread', 'comment', 'reply'].includes(entityType) || !entityId || ![1, -1, 0].includes(voteType)) {
      return res.status(400).json({ error: 'Invalid vote parameters' });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user already voted
      const checkQuery = `
        SELECT vote_type FROM thread_votes 
        WHERE user_id = $1 AND ${entityType}_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [userId, entityId]);
      const existingVote = checkResult.rows.length > 0 ? checkResult.rows[0].vote_type : 0;
      
      if (existingVote === voteType) {
        // User is toggling their vote off
        if (voteType !== 0) {
          await client.query(
            `DELETE FROM thread_votes WHERE user_id = $1 AND ${entityType}_id = $2`,
            [userId, entityId]
          );
          
          // Update vote counts on entity
          if (voteType === 1) {
            await client.query(
              `UPDATE ${entityType}s SET upvotes = upvotes - 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          } else {
            await client.query(
              `UPDATE ${entityType}s SET downvotes = downvotes - 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          }
        }
      } else {
        // Either new vote or changing vote
        if (existingVote !== 0) {
          // Remove existing vote
          if (existingVote === 1) {
            await client.query(
              `UPDATE ${entityType}s SET upvotes = upvotes - 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          } else {
            await client.query(
              `UPDATE ${entityType}s SET downvotes = downvotes - 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          }
          
          await client.query(
            `DELETE FROM thread_votes WHERE user_id = $1 AND ${entityType}_id = $2`,
            [userId, entityId]
          );
        }
        
        if (voteType !== 0) {
          // Add new vote
          const insertQuery = `
            INSERT INTO thread_votes (user_id, ${entityType}_id, vote_type, created_at)
            VALUES ($1, $2, $3, NOW())
          `;
          
          await client.query(insertQuery, [userId, entityId, voteType]);
          
          // Update vote counts on entity
          if (voteType === 1) {
            await client.query(
              `UPDATE ${entityType}s SET upvotes = upvotes + 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          } else {
            await client.query(
              `UPDATE ${entityType}s SET downvotes = downvotes + 1 WHERE ${entityType}_id = $1`,
              [entityId]
            );
          }
        }
      }
      
      // Get updated vote counts
      const updatedCountsQuery = `
        SELECT upvotes, downvotes FROM ${entityType}s WHERE ${entityType}_id = $1
      `;
      
      const updatedCounts = await client.query(updatedCountsQuery, [entityId]);
      
      await client.query('COMMIT');
      
      res.json({
        upvotes: updatedCounts.rows[0].upvotes,
        downvotes: updatedCounts.rows[0].downvotes,
        userVote: voteType === existingVote ? 0 : voteType
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error processing vote:', err);
    res.status(500).json({ error: 'Failed to process vote' });
  }
});

// Fix the vote endpoint
app.post('/api/:entityType/:entityId/vote', isAuthenticated, async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const { voteValue } = req.body;
    const userId = req.session.userId;
    
    // Convert entityType to singular if it's plural
    const singleEntityType = entityType.endsWith('s') ? 
      entityType.substring(0, entityType.length - 1) : 
      entityType;
    
    if (!['thread', 'comment', 'reply'].includes(singleEntityType) || 
        !entityId || 
        ![1, -1, 0].includes(voteValue)) {
      return res.status(400).json({ 
        error: 'Invalid vote parameters', 
        details: { entityType: singleEntityType, entityId, voteValue } 
      });
    }
    
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if user already voted
      const checkQuery = `
        SELECT vote_id, vote_type FROM thread_votes 
        WHERE user_id = $1 AND ${singleEntityType}_id = $2
      `;
      
      const checkResult = await client.query(checkQuery, [userId, entityId]);
      const existingVote = checkResult.rows.length > 0 ? checkResult.rows[0].vote_type : 0;
      
      // Record vote changes for updating counts
      let upvoteChange = 0;
      let downvoteChange = 0;
      
      if (existingVote !== voteValue) {
        // Remove effect of previous vote
        if (existingVote === 1) upvoteChange--;
        if (existingVote === -1) downvoteChange--;
        
        // Add effect of new vote
        if (voteValue === 1) upvoteChange++;
        if (voteValue === -1) downvoteChange++;
        
        // Update or delete vote record
        if (checkResult.rows.length > 0) {
          if (voteValue === 0) {
            // Delete the vote if toggling off
            await client.query(
              'DELETE FROM thread_votes WHERE vote_id = $1',
              [checkResult.rows[0].vote_id]
            );
          } else {
            // Update the vote
            await client.query(
              'UPDATE thread_votes SET vote_type = $1, created_at = NOW() WHERE vote_id = $2',
              [voteValue, checkResult.rows[0].vote_id]
            );
          }
        } else if (voteValue !== 0) {
          // Insert new vote
          const voteInsert = `
            INSERT INTO thread_votes (user_id, ${singleEntityType}_id, vote_type, created_at)
            VALUES ($1, $2, $3, NOW())
          `;
          await client.query(voteInsert, [userId, entityId, voteValue]);
        }
        
        // Update entity vote counts
        if (upvoteChange !== 0 || downvoteChange !== 0) {
          const tableName = singleEntityType === 'reply' ? 'thread_replies' : 
                           (singleEntityType === 'comment' ? 'thread_comments' : 'threads');
          
          const updateEntityQuery = `
            UPDATE ${tableName}
            SET upvotes = upvotes + $1, downvotes = downvotes + $2
            WHERE ${singleEntityType}_id = $3
            RETURNING upvotes, downvotes
          `;
          
          const updateResult = await client.query(updateEntityQuery, [
            upvoteChange, 
            downvoteChange, 
            entityId
          ]);
          
          if (updateResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: `${singleEntityType} not found` });
          }
          
          await client.query('COMMIT');
          
          return res.json({
            upvotes: updateResult.rows[0].upvotes,
            downvotes: updateResult.rows[0].downvotes,
            userVote: voteValue
          });
        }
      }
      
      await client.query('COMMIT');
      
      // If no changes were made, return current values
      const currentQuery = `
        SELECT upvotes, downvotes 
        FROM ${singleEntityType === 'reply' ? 'thread_replies' : 
              singleEntityType === 'comment' ? 'thread_comments' : 'threads'}
        WHERE ${singleEntityType}_id = $1
      `;
      
      const currentValues = await pool.query(currentQuery, [entityId]);
      
      res.json({
        upvotes: currentValues.rows[0].upvotes,
        downvotes: currentValues.rows[0].downvotes,
        userVote: voteValue
      });
      
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error processing vote:', err);
    res.status(500).json({ error: 'Failed to process vote', details: err.message });
  }
});

// Subscribe/unsubscribe to a thread
app.post('/api/threads/:threadId/subscribe', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.session.userId;
    
    // Check if already subscribed
    const checkQuery = `
      SELECT 1 FROM thread_subscriptions 
      WHERE user_id = $1 AND thread_id = $2
    `;
    
    const checkResult = await pool.query(checkQuery, [userId, threadId]);
    const isAlreadySubscribed = checkResult.rows.length > 0;
    
    if (isAlreadySubscribed) {
      // Unsubscribe
      await pool.query(
        'DELETE FROM thread_subscriptions WHERE user_id = $1 AND thread_id = $2',
        [userId, threadId]
      );
      
      res.json({ subscribed: false });
    } else {
      // Subscribe
      await pool.query(
        'INSERT INTO thread_subscriptions (user_id, thread_id, created_at) VALUES ($1, $2, NOW())',
        [userId, threadId]
      );
      
      res.json({ subscribed: true });
    }
  } catch (err) {
    console.error('Error toggling subscription:', err);
    res.status(500).json({ error: 'Failed to toggle subscription' });
  }
});

// Get user's subscribed threads
app.get('/api/user/subscribed-threads', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const query = `
      SELECT t.*, 
             u.username, 
             tc.name as category_name,
             tc.color as category_color,
             b.title as book_title,
             COALESCE(COUNT(DISTINCT c.comment_id), 0) as comment_count
      FROM threads t
      JOIN thread_subscriptions ts ON t.thread_id = ts.thread_id
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      LEFT JOIN thread_comments c ON t.thread_id = c.thread_id
      WHERE ts.user_id = $1
      GROUP BY t.thread_id, u.username, tc.name, tc.color, b.title, ts.created_at
      ORDER BY t.updated_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching subscribed threads:', err);
    res.status(500).json({ error: 'Failed to fetch subscribed threads' });
  }
});

// Get all reviews for a specific book
app.get('/books/:id/reviews', async (req, res) => {
  try {
    const bookId = req.params.id;
    const query = `
      SELECT r.review_id, r.rating, r.comment, r.updated_at, 
             u.username, u.user_id
      FROM user_book_reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.book_id = $1 AND r.comment IS NOT NULL AND r.comment != ''
      ORDER BY r.updated_at DESC
    `;
    
    const result = await pool.query(query, [bookId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching book reviews:', error);
    res.status(500).json({ error: 'Failed to fetch book reviews' });
  }
});

// Update/add comment for a book
app.post('/books/:id/comment', isAuthenticated, async (req, res) => {
  try {
    const bookId = req.params.id;
    const userId = req.session.userId;
    const { comment, rating } = req.body;
    
    // Check if user already has a review for this book
    const checkQuery = `
      SELECT review_id, rating FROM user_book_reviews 
      WHERE user_id = $1 AND book_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [userId, bookId]);
    
    if (checkResult.rows.length > 0) {
      // Update existing review
      const reviewId = checkResult.rows[0].review_id;
      const currentRating = checkResult.rows[0].rating;
      
      await pool.query(
        `UPDATE user_book_reviews 
         SET comment = $1, updated_at = NOW(), rating = $2
         WHERE review_id = $3 
         RETURNING *`,
        [comment, rating || currentRating, reviewId]
      );
    } else if (rating) {
      // Create new review
      await pool.query(
        `INSERT INTO user_book_reviews (book_id, user_id, rating, comment, updated_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [bookId, userId, rating, comment]
      );
    } else {
      return res.status(400).json({ error: 'Rating is required for a new review' });
    }
    
    // Update book counts if needed
    if (comment && comment.trim() !== '') {
      await pool.query(
        `UPDATE books SET num_reviews = 
         (SELECT COUNT(*) FROM user_book_reviews 
          WHERE book_id = $1 AND comment IS NOT NULL AND comment != '')
         WHERE id = $1`,
        [bookId]
      );
    }
    
    return res.status(200).json({ message: 'Comment saved successfully' });
  } catch (error) {
    console.error('Error saving comment:', error);
    res.status(500).json({ error: 'Failed to save comment' });
  }
});

// Add a new book with improved validation and error handling
app.post('/api/add-book', isAuthenticated, async (req, res) => {
  const client = await pool.connect();
  try {
    const {
      title,
      author,
      description,
      coverurl,
      publishedyear,
      pagecount,
      publisher,
      previewlink,
      genres // Array of genre names
    } = req.body;

    console.log('Received book data:', {
      title, author, publishedyear, genres: genres?.length || 0
    });

    // Validate required fields
    if (!title || !author) {
      return res.status(400).json({ error: 'Title and author are required' });
    }

    // Validate publishedyear format if provided
    if (publishedyear && publishedyear !== 'Unknown' && !/^\d{4}$/.test(publishedyear)) {
      return res.status(400).json({ error: 'Published year must be a 4-digit number or "Unknown"' });
    }
    
    // Check if book already exists to avoid duplicates
    const existingBook = await client.query(
      'SELECT id FROM books WHERE title = $1 AND author = $2',
      [title, author]
    );
    
    if (existingBook.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Book already exists',
        bookId: existingBook.rows[0].id
      });
    }

    await client.query('BEGIN');

    // Insert the book
    const insertBookQuery = `
      INSERT INTO books 
      (title, author, description, coverurl, publishedyear, pagecount, publisher, previewlink, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
    `;

    const bookResult = await client.query(insertBookQuery, [
      title,
      author,
      description || null,
      coverurl || null,
      publishedyear || 'Unknown',
      pagecount || null,
      publisher || null,
      previewlink || null
    ]);

    const newBook = bookResult.rows[0];
    const addedGenres = [];
    const bookGenreRelations = [];

    // Handle genres if provided
    if (genres && Array.isArray(genres) && genres.length > 0) {
      // Process each genre
      for (const genre of genres) {
        // Trim and normalize the genre name
        const normalizedGenreName = genre.trim();
        if (!normalizedGenreName) continue;

        // Check if the genre already exists
        const genreCheckQuery = 'SELECT id, name FROM genres WHERE name ILIKE $1';
        const genreResult = await client.query(genreCheckQuery, [normalizedGenreName]);

        let genreId;
        let existingGenreName;
        
        if (genreResult.rows.length > 0) {
          // Genre exists, use its ID
          genreId = genreResult.rows[0].id;
          existingGenreName = genreResult.rows[0].name;
        } else {
          // Genre doesn't exist, create it
          const createGenreQuery = 'INSERT INTO genres (name) VALUES ($1) RETURNING id, name';
          const newGenreResult = await client.query(createGenreQuery, [normalizedGenreName]);
          genreId = newGenreResult.rows[0].id;
          existingGenreName = newGenreResult.rows[0].name;
          
          // Add to the new genres list
          addedGenres.push({
            id: genreId,
            name: existingGenreName,
            created_at: new Date().toISOString()
          });
        }

        // Link the book to this genre
        await client.query(
          'INSERT INTO book_genres (book_id, genre_id) VALUES ($1, $2)',
          [newBook.id, genreId]
        );
        
        // Add to book-genre relations list
        bookGenreRelations.push({
          book_id: newBook.id,
          genre_id: genreId
        });
      }
    }

    await client.query('COMMIT');

    console.log(`Successfully added book: "${title}" by ${author}`);

    // Return the created book with all needed data
    res.status(201).json({
      book: newBook,
      newGenres: addedGenres,
      newBookGenreRelations: bookGenreRelations
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding book:', error);
    res.status(500).json({ error: 'Failed to add book', details: error.message });
  } finally {
    client.release();
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
