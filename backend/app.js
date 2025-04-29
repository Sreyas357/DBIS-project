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
// Thread System APIs

// Add thread categories if none exist
const ensureThreadCategories = async () => {
  try {
    const result = await pool.query('SELECT COUNT(*) FROM thread_categories');
    const count = parseInt(result.rows[0].count);
    
    if (count === 0) {
      console.log('No thread categories found, creating default categories...');
      await pool.query(`
        INSERT INTO thread_categories (name, description) VALUES
        ('Book Discussions', 'General discussions about books'),
        ('Author Discussions', 'Discussions about authors and their works'),
        ('Reading Lists', 'Share and discuss reading lists'),
        ('Book Recommendations', 'Ask for and provide book recommendations'),
        ('Book Reviews', 'Share your book reviews and ratings')
      `);
      console.log('Default thread categories created');
    } else {
      console.log(`Found ${count} existing thread categories`);
    }
  } catch (err) {
    console.error('Error checking/creating thread categories:', err);
  }
};

// Call this when the app starts
ensureThreadCategories();

// Get all thread categories
app.get('/api/threads/categories', async (req, res) => {
  try {
    console.log('Fetching thread categories...');
    const result = await pool.query('SELECT * FROM thread_categories ORDER BY name');
    console.log('Thread categories fetched:', result.rows);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching thread categories:', err);
    res.status(500).json({ error: 'Failed to fetch thread categories' });
  }
});

// Get all threads with optional filtering
app.get('/api/threads', async (req, res) => {
  try {
    const { category_id, book_id, parent_thread_id, user_id } = req.query;
    let query = `
      SELECT t.*, u.username, tc.name as category_name, b.title as book_title,
             (SELECT COUNT(*) FROM thread_comments WHERE thread_id = t.thread_id) as comment_count
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (category_id) {
      query += ` AND t.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (book_id) {
      query += ` AND t.book_id = $${paramIndex}`;
      params.push(book_id);
      paramIndex++;
    }

    if (parent_thread_id === 'null') {
      query += ` AND t.parent_thread_id IS NULL`;
    } else if (parent_thread_id) {
      query += ` AND t.parent_thread_id = $${paramIndex}`;
      params.push(parent_thread_id);
      paramIndex++;
    }

    if (user_id) {
      query += ` AND t.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    query += ` ORDER BY t.is_pinned DESC, t.created_at DESC`;

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching threads:', err);
    res.status(500).json({ error: 'Failed to fetch threads' });
  }
});

// Get a single thread by ID
app.get('/api/threads/:threadId', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    // Increment view count
    await pool.query('UPDATE threads SET view_count = view_count + 1 WHERE thread_id = $1', [threadId]);
    
    // Get thread details
    const threadResult = await pool.query(`
      SELECT t.*, u.username, tc.name as category_name, b.title as book_title
      FROM threads t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN thread_categories tc ON t.category_id = tc.category_id
      LEFT JOIN books b ON t.book_id = b.id
      WHERE t.thread_id = $1
    `, [threadId]);
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    res.json(threadResult.rows[0]);
  } catch (err) {
    console.error('Error fetching thread:', err);
    res.status(500).json({ error: 'Failed to fetch thread' });
  }
});

// Create a new thread
app.post('/api/threads', isAuthenticated, async (req, res) => {
  try {
    console.log("Thread creation request received:", req.body);
    const { title, content, category_id, book_id, parent_thread_id, custom_book, custom_author } = req.body;
    const userId = req.session.userId;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    if (!userId) {
      return res.status(401).json({ error: 'You must be logged in to create a thread' });
    }
    
    // Start a transaction for creating custom book if needed
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      let finalBookId = book_id;
      
      // Handle custom book if provided
      if (custom_book && custom_book.trim() !== '') {
        console.log("Processing custom book:", custom_book);
        
        // Check if a similar book already exists
        const bookCheckResult = await client.query(
          'SELECT id FROM books WHERE LOWER(title) = LOWER($1) AND LOWER(author) = LOWER($2)',
          [custom_book.trim(), custom_author ? custom_author.trim() : 'Unknown']
        );
        
        if (bookCheckResult.rows.length > 0) {
          // Use existing book
          console.log("Found existing book with same title/author");
          finalBookId = bookCheckResult.rows[0].id;
        } else {
          // Check what columns exist in the books table
          const tableInfoResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'books'
          `);
          console.log("Books table columns:", tableInfoResult.rows);
          
          // Create new book with appropriate fields
          const hasDescriptionField = tableInfoResult.rows.some(col => col.column_name === 'description');
          const hasImageField = tableInfoResult.rows.some(col => col.column_name === 'image_url');
          const hasPublishedField = tableInfoResult.rows.some(col => col.column_name === 'published');
          
          // Build the dynamic SQL based on available columns
          let insertColumns = 'title, author';
          let insertValues = '$1, $2';
          const insertParams = [custom_book.trim(), custom_author ? custom_author.trim() : 'Unknown'];
          let valueIndex = 3;
          
          if (hasDescriptionField) {
            insertColumns += ', description';
            insertValues += `, $${valueIndex++}`;
            insertParams.push('No description available');
          }
          
          if (hasImageField) {
            insertColumns += ', image_url';
            insertValues += `, $${valueIndex++}`;
            insertParams.push('');
          }
          
          if (hasPublishedField) {
            insertColumns += ', published';
            insertValues += `, $${valueIndex++}`;
            insertParams.push(new Date().getFullYear());
          }
          
          // Add timestamps
          const hasCreatedAt = tableInfoResult.rows.some(col => col.column_name === 'created_at');
          const hasUpdatedAt = tableInfoResult.rows.some(col => col.column_name === 'updated_at');
          
          if (hasCreatedAt) {
            insertColumns += ', created_at';
            insertValues += ', NOW()';
          }
          
          if (hasUpdatedAt) {
            insertColumns += ', updated_at';
            insertValues += ', NOW()';
          }
          
          const insertQuery = `
            INSERT INTO books (${insertColumns}) 
            VALUES (${insertValues}) 
            RETURNING id
          `;
          
          console.log("Creating new book with query:", insertQuery);
          console.log("Query parameters:", insertParams);
          
          const newBookResult = await client.query(insertQuery, insertParams);
          
          finalBookId = newBookResult.rows[0].id;
          console.log("Created new book with ID:", finalBookId);
        }
      }
      
      // Verify parent thread exists if specified
      if (parent_thread_id) {
        const parentThreadCheck = await client.query(
          'SELECT thread_id FROM threads WHERE thread_id = $1',
          [parent_thread_id]
        );
        
        if (parentThreadCheck.rows.length === 0) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Parent thread does not exist' });
        }
      }
      
      // Create the thread
      console.log("Creating thread with book_id:", finalBookId);
      const result = await client.query(`
        INSERT INTO threads (title, content, user_id, category_id, book_id, parent_thread_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [title, content, userId, category_id || null, finalBookId || null, parent_thread_id || null]);
      
      await client.query('COMMIT');
      
      // Return the created thread
      console.log("Thread created successfully:", result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error("Database error in thread creation:", err);
      console.error("Error details:", err.stack);
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error creating thread:', err);
    res.status(500).json({ error: 'Failed to create thread: ' + err.message });
  }
});

// Update a thread
app.put('/api/threads/:threadId', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { title, content, category_id, book_id, is_pinned, is_locked } = req.body;
    const userId = req.session.userId;
    
    // Check if user is the author of the thread
    const threadResult = await pool.query('SELECT user_id FROM threads WHERE thread_id = $1', [threadId]);
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    if (threadResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this thread' });
    }
    
    const result = await pool.query(`
      UPDATE threads
      SET title = $1, content = $2, category_id = $3, book_id = $4, updated_at = NOW()
      WHERE thread_id = $5 AND user_id = $6
      RETURNING *
    `, [title, content, category_id || null, book_id || null, threadId, userId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating thread:', err);
    res.status(500).json({ error: 'Failed to update thread' });
  }
});

// Delete a thread
app.delete('/api/threads/:threadId', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const userId = req.session.userId;
    
    // Check if user is the author of the thread
    const threadResult = await pool.query('SELECT user_id FROM threads WHERE thread_id = $1', [threadId]);
    
    if (threadResult.rows.length === 0) {
      return res.status(404).json({ error: 'Thread not found' });
    }
    
    if (threadResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this thread' });
    }
    
    await pool.query('DELETE FROM threads WHERE thread_id = $1', [threadId]);
    
    res.json({ message: 'Thread deleted successfully' });
  } catch (err) {
    console.error('Error deleting thread:', err);
    res.status(500).json({ error: 'Failed to delete thread' });
  }
});

// Get comments for a thread
app.get('/api/threads/:threadId/comments', async (req, res) => {
  try {
    const { threadId } = req.params;
    
    const result = await pool.query(`
      SELECT tc.*, u.username,
      CASE WHEN tc.parent_id IS NULL THEN 'comment' ELSE 'reply' END as comment_type
      FROM thread_comments tc
      JOIN users u ON tc.user_id = u.user_id
      WHERE tc.thread_id = $1
      ORDER BY tc.created_at ASC
    `, [threadId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

// Add a comment to a thread
app.post('/api/threads/:threadId/comments', isAuthenticated, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { content, parentId } = req.body;
    const userId = req.session.userId;
    
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const result = await pool.query(`
      INSERT INTO thread_comments (thread_id, user_id, content, parent_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [threadId, userId, content, parentId || null]);
    
    // Get the username to return with the new comment
    const userResult = await pool.query('SELECT username FROM users WHERE user_id = $1', [userId]);
    const comment = {
      ...result.rows[0],
      username: userResult.rows[0].username
    };
    
    res.status(201).json(comment);
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Update a comment
app.put('/api/comments/:commentId', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.session.userId;
    
    // Check if user is the author of the comment
    const commentResult = await pool.query('SELECT user_id FROM thread_comments WHERE comment_id = $1', [commentId]);
    
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to update this comment' });
    }
    
    const result = await pool.query(`
      UPDATE thread_comments
      SET content = $1, updated_at = NOW()
      WHERE comment_id = $2 AND user_id = $3
      RETURNING *
    `, [content, commentId, userId]);
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

// Delete a comment
app.delete('/api/comments/:commentId', isAuthenticated, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.session.userId;
    
    // Check if user is the author of the comment
    const commentResult = await pool.query('SELECT user_id FROM thread_comments WHERE comment_id = $1', [commentId]);
    
    if (commentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }
    
    if (commentResult.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }
    
    await pool.query('DELETE FROM thread_comments WHERE comment_id = $1', [commentId]);
    
    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Get replies for a comment
app.get('/api/comments/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const result = await pool.query(`
      SELECT tc.*, u.username
      FROM thread_comments tc
      JOIN users u ON tc.user_id = u.user_id
      WHERE tc.parent_id = $1
      ORDER BY tc.created_at ASC
    `, [commentId]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching replies:', err);
    res.status(500).json({ error: 'Failed to fetch replies' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});