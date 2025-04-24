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

/////////////////////////////////////////////////////////////
// Authentication APIs
// Signup, Login, IsLoggedIn and Logout

// TODO: Implement authentication middleware
// Redirect unauthenticated users to the login page with respective status code
function isAuthenticated(req, res, next) {
  if (req.session && req.session.userId) {
    // If a session exists, continue to the next route handler
    return next();
  } else {
    // If no session, respond with a 400 Unauthorized error
    return res.status(400).json({ message: "Unauthorized" });
  }
}

app.get("/", (req, res) => {
  res.send("Welcome to the backend API!");
});







/////////////////////////////////////////////////////////////
// signup
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







/////////////////////////////////////////////////////////////
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






/////////////////////////////////////////////////////////////
// TODO: Implement API used to check if the client is currently logged in or not.
// use correct status codes and messages mentioned in the lab document
app.get("/isLoggedIn", (req, res) => {
  if (req.session && req.session.userId) {
    return res.status(200).json({ message: "User is logged in", username: req.session.username });
  }
  return res.status(400).json({ message: "User is not logged in" });
});







/////////////////////////////////////////////////////////////
// TODO: Implement API used to logout the user
// use correct status codes and messages mentioned in the lab document
// Logout API route
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







/////////////////////////////////////////////////////////////
// ✅ Fetch all books, genres, and book_genres
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






/////////////////////////////////////////////////////////////
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








/////////////////////////////////////////////////////////////
// GET /user/reviews - Get all reviews by the current user
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








/////////////////////////////////////////////////////////////
app.post('/rate-book', async (req, res) => {
  const client = await db.connect();

  try {
    // 1. Check authentication
    const userId = req.session?.userId;
    if (!userId) return res.status(401).json({ error: 'Not authenticated' });

    const { book_id, rating } = req.body;

    // 2. Validate input
    if (!book_id || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Invalid book_id or rating' });
    }

    await client.query('BEGIN');

    // 3. Check if user has rated this book before
    const prevRes = await client.query(
      `SELECT rating FROM user_book_reviews WHERE book_id = $1 AND user_id = $2`,
      [book_id, userId]
    );
    const prevRating = prevRes.rows[0]?.rating;

    let newAvg = 0;
    let newCount = 0;

    // 4. Get current book stats
    const bookRes = await client.query(
      `SELECT avg_rating, num_ratings FROM books WHERE id = $1 FOR UPDATE`,
      [book_id]
    );
    const { avg_rating, num_ratings } = bookRes.rows[0];

    // 5. Handle rating logic
    if (prevRating === undefined) {
      // New rating
      await client.query(
        `INSERT INTO user_book_reviews (book_id, user_id, rating, updated_at)
         VALUES ($1, $2, $3, NOW())`,
        [book_id, userId, rating]
      );
      newCount = num_ratings + 1;
      newAvg = ((avg_rating * num_ratings) + rating) / newCount;

    } else if (prevRating === rating) {
      // Remove rating
      await client.query(
        `DELETE FROM user_book_reviews WHERE book_id = $1 AND user_id = $2`,
        [book_id, userId]
      );

      newCount = num_ratings - 1;
      newAvg = newCount > 0
        ? ((avg_rating * num_ratings) - rating) / newCount
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
    return res.status(500).json({ error: 'Failed to rate book' });
  } finally {
    client.release();
  }
});










/////////////////////////////////////////////////////////////
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










/////////////////////////////////////////////////////////////
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








/////////////////////////////////////////////////////////////
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








/////////////////////////////////////////////////////////////
// === FOLLOW USER ===
// === TOGGLE FOLLOW ===
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
















/////////////////////////////////////////////////////////////
// GET /messages/conversations
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












/////////////////////////////////////////////////////////////
// GET /messages/:userId

//uncomment to handle pagination. (should also handle in messages.jsx)

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



















/////////////////////////////////////////////////////////////
// POST /messages/:userId
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
























/////////////////////////////////////////////////////////////
// GET /user/:username
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












////////////////////////////////////////////////////
// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});