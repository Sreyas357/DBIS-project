import fetch from 'node-fetch';

/**
 * Search books by name using Google Books API
 * @param {string} bookName - Name of the book to search
 * @param {number} limit - Maximum number of results to return (default: 10)
 * @returns {Promise<Array>} - Array of book objects matching the search
 */
async function searchBooksByName(bookName, limit = 10) {
  try {
    // Google Books API allows up to 40 results per request
    const maxResults = Math.min(limit, 3);
    
    // Encode the book name for URL safety
    const encodedBookName = encodeURIComponent(bookName);
    
    // Create URL for searching by book name
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodedBookName}&maxResults=${maxResults}`;
    
    console.log(`Searching for books with name: ${bookName}`);
    console.log(`API URL: ${url}`);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.warn(`No books found for name: ${bookName}!`);
      return [];
    }

    console.log(data.items);
    
    // Map the response to a cleaner book object format (similar to load_books.js)
    const books = data.items.map(item => {
      const volumeInfo = item.volumeInfo || {};
      
      return {
        title: volumeInfo.title || "Unknown Title",
        author: volumeInfo.authors?.[0] || "Unknown",
        description: volumeInfo.description || "No description available",
        coverUrl: volumeInfo.imageLinks?.thumbnail || null,
        publishedYear: volumeInfo.publishedDate ? volumeInfo.publishedDate.substring(0, 4) : "Unknown",
        genres: volumeInfo.categories || [],
        pageCount: volumeInfo.pageCount || "Unknown",
        publisher: volumeInfo.publisher || "Unknown",
        rating: volumeInfo.averageRating || "Not rated",
        previewLink: volumeInfo.previewLink || null,
        isbn: volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_13')?.identifier || 
              volumeInfo.industryIdentifiers?.find(id => id.type === 'ISBN_10')?.identifier || null
      };
    });
    
    return books.slice(0, limit);
  } catch (error) {
    console.error(`Error searching for book "${bookName}":`, error);
    return [];
  }
}

// Test the function with a sample book name
async function testBookSearch() {
  const bookName = process.argv[2] || "Harry Potter";
  console.log(`Searching for books with name: ${bookName}`);
  
  const results = await searchBooksByName(bookName);
  
  console.log(`Found ${results.length} books matching "${bookName}":`);
  results.forEach((book, index) => {
    console.log(`\n--- Book ${index + 1} ---`);
    console.log(`Title: ${book.title}`);
    console.log(`Author: ${book.author}`);
    console.log(`Published: ${book.publishedYear}`);
    console.log(`Rating: ${book.rating}`);
    console.log(`Cover: ${book.coverUrl || 'No cover image'}`);
    console.log(`ISBN: ${book.isbn || 'No ISBN available'}`);
  });
}

// Run the test function
testBookSearch()
  .then(() => console.log("\nSearch completed successfully"))
  .catch(err => console.error("Search failed:", err));
