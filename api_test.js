import fetch from 'node-fetch';



/**
 * Fetch present top best sellers for a given genre (NYT list name) using NYT Books API.
 * Requires NYT API key set as environment variable NYT_API_KEY.
 * @param {string} listName - NYT list name (e.g., 'hardcover-fiction', 'hardcover-nonfiction')
 * @returns {Promise<Array>} - Array of best seller book objects
 */
async function fetchNYTBestSellers(listName = 'hardcover-fiction') {
  const apiKey = 'UNZtEJKqEi8PmC5klRwIHQROGgR1B2ec';
  if (!apiKey) {
    console.error('NYT_API_KEY environment variable not set.');
    return [];
  }
  const url = `https://api.nytimes.com/svc/books/v3/lists/current/${listName}.json?api-key=${apiKey}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    if (!data.results || !data.results.books) {
      console.warn(`No best sellers found for list: ${listName}!`);
      return [];
    }
    return data.results.books.map(book => ({
      title: book.title,
      author: book.author,
      description: book.description,
      coverUrl: book.book_image,
      publisher: book.publisher,
      rank: book.rank,
      weeksOnList: book.weeks_on_list,
      amazonUrl: book.amazon_product_url,
      isbn: book.primary_isbn13 || book.primary_isbn10
    }));
  } catch (error) {
    console.error(`Error fetching NYT best sellers for list "${listName}":`, error);
    return [];
  }
}

// Map common genres to NYT list names (all keys and values are strings)
const genreToNYTList = {
  "fiction": "hardcover-fiction",
  "nonfiction": "hardcover-nonfiction",
  "young adult": "young-adult-hardcover",
  "young-adult": "young-adult-hardcover",
  "middle grade": "childrens-middle-grade-hardcover",
  "middle-grade": "childrens-middle-grade-hardcover",
  "business": "business-books",
  "science": "science",
  "sports": "sports",
  "manga": "graphic-books-and-manga",
  "graphic": "graphic-books-and-manga",
  "romance": "paperback-trade-fiction",
  "mystery": "hardcover-fiction", // closest available
  "thriller": "hardcover-fiction", // closest available
  "fantasy": "hardcover-fiction", // closest available
  "history": "hardcover-nonfiction",
  "politics": "hardcover-nonfiction",
  "advice": "advice-how-to-and-miscellaneous"
};

// Test the NYT best sellers function
async function testNYTBestSellers() {
  let input = process.argv[2] || 'hardcover-fiction';
  let listName = input;

  // Map genre to NYT list name if possible
  if (!input.startsWith('hardcover-') && !input.startsWith('paperback-') && !input.endsWith('-books')) {
    const mapped = genreToNYTList[input.toLowerCase()];
    if (mapped) {
      listName = mapped;
      console.log(`Mapped genre "${input}" to NYT list "${listName}"`);
    } else {
      console.warn(`Genre "${input}" not recognized. Defaulting to "hardcover-fiction".`);
      listName = 'hardcover-fiction';
    }
  }

  console.log(`Fetching NYT best sellers for list: ${listName}`);
  const results = await fetchNYTBestSellers(listName);
  console.log(`Found ${results.length} best sellers in list "${listName}":`);
  results.forEach((book, index) => {
    console.log(`\n--- Book ${index + 1} ---`);
    console.log(`Title: ${book.title}`);
    console.log(`Author: ${book.author}`);
    console.log(`Publisher: ${book.publisher}`);
    console.log(`Rank: ${book.rank}`);
    console.log(`Weeks on List: ${book.weeksOnList}`);
    console.log(`Cover: ${book.coverUrl || 'No cover image'}`);
    console.log(`ISBN: ${book.isbn || 'No ISBN available'}`);
    console.log(`Amazon: ${book.amazonUrl || 'No link'}`);
  });
}

// Run the NYT best sellers test
testNYTBestSellers()
  .then(() => console.log("\nNYT Best Sellers fetch completed successfully"))
  .catch(err => console.error("NYT Best Sellers fetch failed:", err));
