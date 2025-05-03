import fetch from 'node-fetch'; // If you want to use node-fetch (optional)
import pg from 'pg';
import fs from 'fs/promises'; // Use promises version of fs

const {Pool} = pg;

// List of popular book genres to fetch
const BOOK_GENRES = [
  'fiction', 'mystery', 'romance', 'science_fiction', 'fantasy', 
  'biography', 'history', 'business', 'self_help', 'thriller',
  'horror', 'young_adult', 'poetry', 'science', 'philosophy',
  'cookbooks', 'travel', 'religion', 'art', 'classics'
];

// Database connection pool
const pool = new Pool({
  user: "lokesh8639",
  password: "lokesh@2004",
  database: "ecommerce",
  host: "localhost",
  port: 5432
});

async function loadDDL() {
  try {
    const ddl = await fs.readFile('./DDL.sql', 'utf-8');
    await pool.query(ddl);
    console.log("✅ DDL loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load DDL:", err.message);
    process.exit(1); // Exit if schema setup fails
  }
}

async function loadData() {
  try {
    const ddl = await fs.readFile('./data.sql', 'utf-8');
    await pool.query(ddl);
    console.log("✅ Data loaded successfully");
  } catch (err) {
    console.error("❌ Failed to load DDL:", err.message);
    process.exit(1); // Exit if schema setup fails
  }
}

/**
 * Fetch books from a specific genre using Google Books API
 * @param {number} limit - Number of books to fetch (default: 10)
 * @param {string} subject - Book subject/category (default: "fiction")
 * @returns {Promise<Array>} - Array of book objects with detailed information
 */
async function fetchBooks(limit = 10, subject = "fiction") {
  try {
    // Google Books API allows up to 40 results per request
    const maxResults = Math.min(limit, 40);
    
    // Use orderBy=relevance to get popular books in the specified subject
    const url = `https://www.googleapis.com/books/v1/volumes?q=subject:${subject}&orderBy=relevance&maxResults=${maxResults}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`No books found for subject: ${subject}!`);
      return [];
    }
    
    // Map the response to a cleaner book object format
    const books = data.items.map(item => {
      const volumeInfo = item.volumeInfo || {};
      
      return {
        title: volumeInfo.title || "Unknown Title",
        author: volumeInfo.authors?.[0] || "Unknown",
        description: volumeInfo.description || "No description available",
        coverUrl: volumeInfo.imageLinks?.thumbnail || null,
        publishedYear: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : "Unknown",
        genres: volumeInfo.categories || [subject], // Use subject as fallback
        pageCount: volumeInfo.pageCount || "Unknown",
        publisher: volumeInfo.publisher || "Unknown",
        rating: 0 || "Not rated",
        previewLink: volumeInfo.previewLink || null,
        isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
              volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null
      };
    });
    
    return books.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching books for subject ${subject}:`, error);
    return [];
  }
}

/**
 * Insert genres into the database and return their IDs
 * @param {Array} genres - Array of genre names
 * @returns {Promise<Array>} - Array of genre IDs
 */
async function insertGenres(genres) {
  let genreIdList = [];
  
  for (const genre of genres) {
    try {
      let res = await pool.query(
        `SELECT id FROM genres WHERE name = $1`,
        [genre]
      );

      // If genre doesn't exist, insert it
      if (res.rows.length === 0) {
        res = await pool.query(
          `INSERT INTO genres(name) 
          VALUES($1) 
          RETURNING id`,
          [genre]
        );
      }

      // Add the genre ID (either new or existing)
      genreIdList.push(res.rows[0].id);
    } catch (err) {
      console.error(`Failed to insert genre ${genre}:`, err.message);
    }
  }

  return genreIdList;
}

/**
 * Insert books and their genres into the database
 * @param {Array} books - Array of book objects
 */
async function insertBooks(books) {
  console.log(`Inserting ${books.length} books into database...`);
  let insertedCount = 0;
  
  for (const book of books) {
    try {
      // Check if book already exists to avoid duplicates
      const existingBook = await pool.query(
        `SELECT id FROM books WHERE title = $1 AND author = $2`,
        [book.title, book.author]
      );
      
      let bookId;
      
      if (existingBook.rows.length > 0) {
        // Book already exists, use its ID
        bookId = existingBook.rows[0].id;
        console.log(`Book "${book.title}" already exists, skipping insert.`);
      } else {
        // Insert new book - updated to match current schema
        const resBook = await pool.query(
          `INSERT INTO books(
            title, author, description, coverurl, publishedyear, 
            pagecount, publisher, avg_rating, num_ratings, num_reviews,isbn
          ) 
          VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,$11) 
          RETURNING id`,
          [
            book.title, 
            book.author, 
            book.description, 
            book.coverUrl, 
            book.publishedYear,
            book.pageCount === "Unknown" ? null : book.pageCount,
            book.publisher,
            book.rating === "Not rated" ? 0 : Number(book.rating),
            0, // Initialize num_ratings as 0
            0,  // Initialize num_reviews as 0
            book.isbn
          ]
        );
        
        bookId = resBook.rows[0].id;
        insertedCount++;
      }

      // Insert genres for the book
      if (book.genres && book.genres.length > 0) {
        const genreIds = await insertGenres(book.genres);

        for (const genre_id of genreIds) {
          try {
            // Check if this book-genre relation already exists
            const existingRelation = await pool.query(
              `SELECT 1 FROM book_genres WHERE book_id = $1 AND genre_id = $2`,
              [bookId, genre_id]
            );
            
            if (existingRelation.rows.length === 0) {
              // Insert only if relation doesn't exist
              await pool.query(
                `INSERT INTO book_genres(book_id, genre_id) VALUES($1, $2)`,
                [bookId, genre_id]
              );
            }
          } catch (err) {
            console.error(`Unable to insert into book_genres for book ${book.title} and genre_id ${genre_id}:`, err.message);
          }
        }
      }
    } catch (err) {
      console.error(`Error adding book "${book.title}":`, err.message);
    }
  }
  
  console.log(`✅ Successfully inserted ${insertedCount} new books`);
}

/**
 * Fetch books across all predefined genres
 * @param {number} booksPerGenre - Number of books to fetch for each genre
 * @returns {Promise<Array>} - Array of all books
 */
async function fetchAllGenreBooks(booksPerGenre = 15) {
  const allBooks = [];
  const processedTitles = new Set(); // Track titles to avoid duplicates
  
  console.log(`Starting to fetch books from ${BOOK_GENRES.length} genres...`);
  
  for (const genre of BOOK_GENRES) {
    console.log(`Fetching books for genre: ${genre}`);
    
    // Fetch books for this genre
    const genreBooks = await fetchBooks(booksPerGenre, genre);
    
    // Add only unique books (by title)
    for (const book of genreBooks) {
      if (!processedTitles.has(book.title)) {
        processedTitles.add(book.title);
        allBooks.push(book);
      }
    }
    
    console.log(`Added ${genreBooks.length} books from genre: ${genre}`);
    
    // Add a delay to avoid hitting API rate limits
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`Total unique books fetched: ${allBooks.length}`);
  return allBooks;
}

/**
 * Main execution function
 */
async function execute() {
  try {
    // Load database schema
    await loadDDL();
    
    
    // Fetch books from all genres
    const allBooks = await fetchAllGenreBooks(10); // 10 books per genre
    
    // Insert books into database
    await insertBooks(allBooks);

    await loadData();
    
    console.log("✅ Database population complete!");
  } catch (error) {
    console.error("❌ Error during execution:", error);
  } finally {
    // Close the database pool
    await pool.end();
  }
}

// Execute the script
execute()
  .then(() => console.log("Script completed successfully"))
  .catch(err => console.error("Script failed:", err));