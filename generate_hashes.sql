-- First enable the pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Generate bcrypt hashes with this function
SELECT crypt('password1', gen_salt('bf', 10)); -- For bookworm42
SELECT crypt('password2', gen_salt('bf', 10)); -- For lit_lover
SELECT crypt('password3', gen_salt('bf', 10)); -- For novel_nerd
SELECT crypt('password4', gen_salt('bf', 10)); -- For page_turner
SELECT crypt('password5', gen_salt('bf', 10)); -- For fiction_fan

-- To verify passwords (for future reference)
-- This returns true if password matches
SELECT (password_hash = crypt('password1', password_hash))
FROM users
WHERE username = 'bookworm42';
