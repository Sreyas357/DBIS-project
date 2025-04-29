-- Add parent_id column to thread_comments table for nested comment functionality
ALTER TABLE thread_comments ADD COLUMN parent_id INTEGER REFERENCES thread_comments(comment_id) ON DELETE CASCADE;

-- Drop thread_replies table as we'll use the parent_id approach instead
DROP TABLE IF EXISTS thread_replies CASCADE; 