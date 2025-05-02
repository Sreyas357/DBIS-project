DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS user_book_reviews CASCADE;
DROP TABLE IF EXISTS book_genres CASCADE;
DROP TABLE IF EXISTS books CASCADE;
DROP TABLE IF EXISTS genres CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS Users CASCADE;
DROP TABLE IF EXISTS group_messages CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;

-- user info - username, email, password
CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);

-- followers - user_id, follower_id
CREATE TABLE follows (
    follower_id INTEGER NOT NULL,
    following_id INTEGER NOT NULL,
    followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id),
    FOREIGN KEY (follower_id) REFERENCES users(user_id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CHECK (follower_id <> following_id)
);


CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    author VARCHAR(255) NOT NULL,
    description TEXT CHECK (LENGTH(description) <= 20000),
    coverurl TEXT,
    publishedyear VARCHAR(4) CHECK (publishedyear ~ '^[0-9]{4}$' OR publishedyear = 'Unknown'),
    pagecount INTEGER,
    publisher VARCHAR(255),
    previewlink TEXT,
    num_ratings INTEGER DEFAULT 0,
    num_reviews INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    avg_rating DECIMAL(3,2) DEFAULT 0 CHECK (avg_rating >= 0 AND avg_rating <= 5)
);

-- Genres table
CREATE TABLE genres (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for many-to-many relationship between books and genres
CREATE TABLE book_genres (
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genres(id) ON DELETE CASCADE,
    PRIMARY KEY (book_id, genre_id)
);


CREATE TABLE user_book_reviews (
    review_id SERIAL PRIMARY KEY,
    book_id INTEGER REFERENCES books(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 0 AND 5),
    comment TEXT NULL,
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE (book_id, user_id)  -- Ensures one review per user per book
);





CREATE TABLE messages (
    message_id SERIAL PRIMARY KEY,
    sender_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    recipient_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Drop existing thread-related tables and create improved ones
DROP TABLE IF EXISTS thread_votes CASCADE;
DROP TABLE IF EXISTS thread_subscriptions CASCADE;
DROP TABLE IF EXISTS thread_replies CASCADE;
DROP TABLE IF EXISTS thread_comments CASCADE;
DROP TABLE IF EXISTS threads CASCADE;
DROP TABLE IF EXISTS thread_categories CASCADE;

-- Thread categories
CREATE TABLE thread_categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    color VARCHAR(7), -- Hex color code like #FF5500
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Threads (main topics)
CREATE TABLE threads (
    thread_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    category_id INTEGER REFERENCES thread_categories(category_id),
    book_id INTEGER REFERENCES books(id), -- Optional reference to a book
    is_pinned BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments on threads
CREATE TABLE thread_comments (
    comment_id SERIAL PRIMARY KEY,
    thread_id INTEGER NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Replies to comments or other replies
-- parent_reply_id = NULL means it's a direct reply to a comment
-- parent_reply_id = X means it's a reply to reply X
CREATE TABLE thread_replies (
    reply_id SERIAL PRIMARY KEY,
    comment_id INTEGER NOT NULL REFERENCES thread_comments(comment_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    parent_reply_id INTEGER REFERENCES thread_replies(reply_id) ON DELETE CASCADE, -- For nested replies
    content TEXT NOT NULL,
    upvotes INTEGER DEFAULT 0,
    downvotes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_parent_check CHECK (
        -- Either parent_reply_id is NULL (direct reply to comment)
        -- or it's a different reply (no self-reference)
        parent_reply_id IS NULL OR parent_reply_id != reply_id
    )
);

-- User votes on threads
CREATE TABLE thread_votes (
    vote_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    thread_id INTEGER REFERENCES threads(thread_id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES thread_comments(comment_id) ON DELETE CASCADE,
    reply_id INTEGER REFERENCES thread_replies(reply_id) ON DELETE CASCADE,
    vote_type SMALLINT NOT NULL, -- 1 for upvote, -1 for downvote
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Ensure user can only vote on one entity type
    CHECK ((thread_id IS NOT NULL AND comment_id IS NULL AND reply_id IS NULL) OR
           (thread_id IS NULL AND comment_id IS NOT NULL AND reply_id IS NULL) OR
           (thread_id IS NULL AND comment_id IS NULL AND reply_id IS NOT NULL)),
    -- Ensure unique votes per user per entity
    UNIQUE (user_id, thread_id, comment_id, reply_id)
);

-- User thread subscriptions
CREATE TABLE thread_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    thread_id INTEGER NOT NULL REFERENCES threads(thread_id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, thread_id)
);

-- Insert some default thread categories
INSERT INTO thread_categories (name, description, color) VALUES
('Book Discussions', 'Discuss your favorite books and literary topics', '#1E88E5'),
('Author Spotlights', 'Conversations about authors and their works', '#43A047'),
('Reading Recommendations', 'Get and give book recommendations', '#FB8C00'),
('Book Reviews', 'Share and read detailed book reviews', '#8E24AA'),
('Reading Challenges', 'Join reading challenges and track your progress', '#D81B60'),
('General', 'General discussions about reading and books', '#546E7A');

-- Create simplified groups table
CREATE TABLE groups (
    group_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    owner_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    bio TEXT,
    invite_only BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(name)
);

-- Create simplified group members table
CREATE TABLE group_members (
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN DEFAULT false,
    PRIMARY KEY (group_id, user_id)
);

-- Create simplified group messages table
CREATE TABLE group_messages (
    message_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);



-- Drop tables if they exist
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS group_join_requests CASCADE;

-- Create notifications table
CREATE TABLE notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    related_id INTEGER, -- Can store group_id, request_id, etc.
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create group join requests table
CREATE TABLE group_join_requests (
    request_id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(group_id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, rejected
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id, status)
);

-- Create index for faster notification lookups
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Create index for faster join request lookups
CREATE INDEX idx_join_requests_group_id ON group_join_requests(group_id);
CREATE INDEX idx_join_requests_user_id ON group_join_requests(user_id);
CREATE INDEX idx_join_requests_status ON group_join_requests(status); 