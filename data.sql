-- Sample Users
INSERT INTO Users (username, email, password_hash) VALUES
('bookworm42', 'u1@example.com', '$2b$10$kkqM.bY5jlxP/xTRzMqfNuJ09NCDmm05/gHF1MBeB2pVfevB5tP2.'),
('lit_lover', 'u2@example.com', '$2b$10$jGmLKgzWBjWU5QUgI16BAODOwvHOiFHIKXqWFqgSTUw6SQalBFThu'),
('novel_nerd', 'u3@example.com', '$2b$10$By4TIFzmHQBiryHmGiUKeuZbF5kcgFgc6bxwrq/Toq9wPZx2QDO7W'),
('page_turner', 'u4@example.com', '$2b$10$hnR8SvH0iM.tq6pR/DEg8.g/zfjnVm9839r797JW/pR03MpdOq2ui'),
('fiction_fan', 'u5@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW');



-- User Follows
INSERT INTO follows (follower_id, following_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 1),
(3, 2),
(4, 1),
(5, 1);



-- Messages between users
INSERT INTO messages (sender_id, recipient_id, message, created_at) VALUES
(1, 2, 'Hey, have you read "Beyond the Stars" yet? I think you''d love it!', '2023-09-10 10:15:30'),
(2, 1, 'Not yet, but it''s on my list! I just finished "The Silent Echo" and it was fantastic.', '2023-09-10 10:23:45'),
(1, 2, 'Oh, I''ve heard great things about that one. I''ll add it to my reading list!', '2023-09-10 10:30:12'),
(3, 1, 'Do you have any good fantasy recommendations?', '2023-09-11 14:05:22'),
(1, 3, 'You should definitely check out "The Lost Kingdom" - it''s amazing!', '2023-09-11 14:15:07'),
(4, 5, 'Are you going to the virtual book club on Thursday?', '2023-09-12 09:12:30'),
(5, 4, 'Yes! I can''t wait to discuss "Whispers in the Dark"', '2023-09-12 09:30:45');

-- Sample Threads
INSERT INTO threads (title, content, user_id, category_id, book_id, view_count) VALUES
('Just finished "Beyond the Stars" and I''m blown away!', 'The character development was incredible and the plot kept me guessing until the end. What did everyone else think about the twist in chapter 15?', 1, 4, 2, 124),
('Monthly Sci-Fi Reading Challenge: October', 'This month we''re focusing on space exploration themed books. Post your reading goals and progress here!', 3, 5, NULL, 87),
('Looking for historical fiction recommendations', 'I''ve recently become interested in historical fiction set in ancient Rome. Any must-read suggestions?', 2, 3, NULL, 56),
('Discussion: The ethics in "The Silent Echo"', 'I''d love to discuss the moral dilemmas faced by the protagonist throughout the story. No spoilers in the main post, but expect them in comments!', 4, 1, 1, 203),
('Author Spotlight: Sarah Williams', 'Let''s talk about Sarah Williams and her fantasy worlds! "The Lost Kingdom" is just the beginning of her amazing universe.', 5, 2, 3, 94);

-- Thread Comments
INSERT INTO thread_comments (thread_id, user_id, content, upvotes, downvotes) VALUES
(1, 2, 'That twist completely caught me off guard! I had to reread that chapter immediately.', 12, 0),
(1, 3, 'I saw it coming, but it was still executed brilliantly. The foreshadowing was subtle but there.', 8, 1),
(2, 1, 'I''m planning to read "The Martian" and "Aurora" this month. Both deal with the challenges of space travel.', 5, 0),
(3, 5, 'You absolutely need to read "I, Claudius" by Robert Graves. It''s a classic for a reason!', 15, 0),
(3, 4, 'I just finished "The Eagle" by Simon Scarrow - great depiction of Roman legionaries.', 7, 0),
(4, 3, 'The way the author handled the protagonist''s decision in the climax was so thought-provoking. It really made me question what I would do in that situation.', 20, 1),
(5, 2, 'Her worldbuilding is unmatched! I heard she spent five years creating the languages and cultures before writing a single word of the actual story.', 10, 0);

-- Thread Replies
INSERT INTO thread_replies (comment_id, user_id, parent_reply_id, content, upvotes) VALUES
(1, 3, NULL, 'Right? And the way it connected to the prologue was so clever!', 6),
(1, 1, NULL, 'I had to go back and reread the prologue after that chapter. The author planned it all so meticulously.', 8),
(2, 5, NULL, 'What foreshadowing did you notice? I completely missed it on my first read.', 3),
(2, 3, 3, 'There were subtle hints in the dialogue between the captain and the navigator in chapters 7 and 10. Also, the recurrent dream sequences had clues.', 5),
(3, 2, NULL, '"The Martian" is excellent! The scientific accuracy makes it so immersive.', 4),
(6, 1, NULL, 'Exactly! And it was made more complex by the fact that there was no clearly "right" choice.', 7),
(6, 4, 6, 'I think that''s what made the book so powerful - forcing readers to confront that moral ambiguity.', 9),
(6, 1, 7, 'The author did mention in an interview that she wanted readers to feel uncomfortable with any possible solution. Mission accomplished!', 11);

-- Thread Votes
INSERT INTO thread_votes (user_id, thread_id, vote_type) VALUES
(2, 1, 1),
(3, 1, 1),
(4, 1, 1),
(5, 1, 1),
(1, 4, 1),
(2, 4, 1),
(3, 4, 1);

INSERT INTO thread_votes (user_id, comment_id, vote_type) VALUES
(1, 1, 1),
(3, 1, 1),
(4, 1, 1),
(5, 6, 1),
(1, 6, 1),
(2, 6, 1);

-- Thread Subscriptions
INSERT INTO thread_subscriptions (user_id, thread_id) VALUES
(2, 1),
(3, 1),
(1, 2),
(5, 3),
(2, 4),
(3, 4),
(1, 4),
(4, 5);
