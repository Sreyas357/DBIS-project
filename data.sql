-- Sample Users
INSERT INTO Users (username, email, password_hash) VALUES
('bookworm42', 'u1@example.com', '$2b$10$kkqM.bY5jlxP/xTRzMqfNuJ09NCDmm05/gHF1MBeB2pVfevB5tP2.'),
('lit_lover', 'u2@example.com', '$2b$10$jGmLKgzWBjWU5QUgI16BAODOwvHOiFHIKXqWFqgSTUw6SQalBFThu'),
('novel_nerd', 'u3@example.com', '$2b$10$By4TIFzmHQBiryHmGiUKeuZbF5kcgFgc6bxwrq/Toq9wPZx2QDO7W'),
('page_turner', 'u4@example.com', '$2b$10$hnR8SvH0iM.tq6pR/DEg8.g/zfjnVm9839r797JW/pR03MpdOq2ui'),
('fiction_fan', 'u5@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('classic_reader', 'u6@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('sci_fi_addict', 'u7@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('fantasy_lover', 'u8@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('mystery_reader', 'u9@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('history_buff', 'u10@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('poetry_fan', 'u11@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('romance_reader', 'u12@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('thriller_addict', 'u13@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('comic_lover', 'u14@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW'),
('biography_reader', 'u15@example.com', '$2b$10$a7VwPl.bamlLvpL6mqTrS.5WaKebBhhwLstPJQ5Cocmu9Pds0teeW');



-- User Follows
INSERT INTO follows (follower_id, following_id) VALUES
(1, 2),
(1, 3),
(2, 1),
(3, 1),
(3, 2),
(4, 1),
(5, 1),
-- Additional follows for users 1-15
(1, 4), (1, 5), (1, 6), (1, 7), (1, 8), -- User 1 follows 8 users
(2, 3), (2, 4), (2, 5), (2, 6), (2, 7), (2, 8), (2, 9), -- User 2 follows 9 users
(3, 4), (3, 5), (3, 6), (3, 7), (3, 8), (3, 9), -- User 3 follows 8 users
(4, 2), (4, 3), (4, 5), (4, 6), (4, 7), (4, 8), (4, 9), -- User 4 follows 8 users
(5, 2), (5, 3), (5, 4), (5, 6), (5, 7), (5, 8), (5, 9), (5, 10), -- User 5 follows 9 users
(6, 1), (6, 2), (6, 3), (6, 4), (6, 5), (6, 7), -- User 6 follows 6 users
(7, 1), (7, 2), (7, 3), (7, 4), (7, 5), (7, 6), (7, 8), -- User 7 follows 7 users
(8, 1), (8, 2), (8, 3), (8, 4), (8, 5), (8, 6), (8, 7), (8, 9), -- User 8 follows 8 users
(9, 1), (9, 2), (9, 3), (9, 4), (9, 5), (9, 10), (9, 11), -- User 9 follows 7 users
(10, 2), (10, 3), (10, 4), (10, 5), (10, 6), (10, 7), (10, 8), (10, 9), -- User 10 follows 8 users
(11, 1), (11, 2), (11, 3), (11, 4), (11, 5), (11, 12), (11, 13), -- User 11 follows 7 users
(12, 1), (12, 2), (12, 3), (12, 4), (12, 5), (12, 11), -- User 12 follows 6 users
(13, 1), (13, 2), (13, 3), (13, 14), (13, 15), (13, 4), (13, 5), -- User 13 follows 7 users
(14, 1), (14, 2), (14, 3), (14, 4), (14, 5), (14, 13), (14, 15), -- User 14 follows 7 users
(15, 1), (15, 2), (15, 3), (15, 4), (15, 5), (15, 13), (15, 14); -- User 15 follows 7 users



-- Messages between users
INSERT INTO messages (sender_id, recipient_id, message, created_at) VALUES
(1, 2, 'Hey, have you read "Beyond the Stars" yet? I think you''d love it!', '2023-09-10 10:15:30'),
(2, 1, 'Not yet, but it''s on my list! I just finished "The Silent Echo" and it was fantastic.', '2023-09-10 10:23:45'),
(1, 2, 'Oh, I''ve heard great things about that one. I''ll add it to my reading list!', '2023-09-10 10:30:12'),
(3, 1, 'Do you have any good fantasy recommendations?', '2023-09-11 14:05:22'),
(1, 3, 'You should definitely check out "The Lost Kingdom" - it''s amazing!', '2023-09-11 14:15:07'),
(4, 5, 'Are you going to the virtual book club on Thursday?', '2023-09-12 09:12:30'),
(5, 4, 'Yes! I can''t wait to discuss "Whispers in the Dark"', '2023-09-12 09:30:45'),
-- Additional messages
(6, 1, 'I just discovered a great classic novel you might enjoy!', '2023-09-14 08:30:22'),
(1, 6, 'Really? What''s it called?', '2023-09-14 09:15:45'),
(6, 1, 'Pride and Prejudice by Jane Austen. It''s a masterpiece!', '2023-09-14 09:20:12'),
(1, 6, 'I love that book! Have you read her other works?', '2023-09-14 09:25:30'),
(6, 1, 'I''m currently reading Sense and Sensibility. It''s quite good too!', '2023-09-14 09:30:18'),
(7, 2, 'Have you read any good science fiction lately?', '2023-09-15 14:10:25'),
(2, 7, 'I just finished "Dune" and it was incredible!', '2023-09-15 14:25:40'),
(7, 2, 'That''s a classic! Did you know they made a new movie adaptation?', '2023-09-15 14:30:15'),
(2, 7, 'Yes, I watched it last weekend. The visuals were stunning!', '2023-09-15 14:35:22'),
(8, 3, 'Any fantasy recommendations for a beginner?', '2023-09-16 10:45:30'),
(3, 8, 'Start with "The Hobbit" by Tolkien. Perfect introduction to fantasy!', '2023-09-16 11:00:42'),
(8, 3, 'Thanks! I''ll check it out this weekend.', '2023-09-16 11:05:18'),
(9, 4, 'I''m looking for a good mystery novel. Any suggestions?', '2023-09-17 13:20:10'),
(4, 9, 'Try "The Silent Patient" - couldn''t put it down!', '2023-09-17 13:30:45'),
(9, 4, 'That sounds intriguing! I''ll get it from the library tomorrow.', '2023-09-17 13:35:22'),
(10, 5, 'Do you know any good books about ancient Rome?', '2023-09-18 16:40:30'),
(5, 10, '"SPQR" by Mary Beard is excellent if you want non-fiction.', '2023-09-18 16:50:15'),
(10, 5, 'Perfect! I''ve been looking for something scholarly but accessible.', '2023-09-18 16:55:22'),
(11, 6, 'Can you recommend any modern poetry collections?', '2023-09-19 11:30:15'),
(6, 11, 'Check out "Milk and Honey" by Rupi Kaur or "The Sun and Her Flowers".', '2023-09-19 11:40:30'),
(11, 6, 'Thanks! I''ve heard great things about Rupi Kaur.', '2023-09-19 11:45:22'),
(12, 7, 'Looking for a good romance novel for the weekend. Any ideas?', '2023-09-20 09:15:10'),
(7, 12, '"The Notebook" by Nicholas Sparks is a classic romance.', '2023-09-20 09:25:45'),
(12, 7, 'I''ve seen the movie but never read the book. I''ll give it a try!', '2023-09-20 09:30:22'),
(13, 8, 'Need a psychological thriller recommendation.', '2023-09-21 15:10:30'),
(8, 13, '"Gone Girl" by Gillian Flynn will keep you on the edge of your seat!', '2023-09-21 15:20:15'),
(13, 8, 'Sounds perfect! Adding it to my reading list now.', '2023-09-21 15:25:22'),
(14, 9, 'Any good graphic novels you''d recommend?', '2023-09-22 14:30:45'),
(9, 14, '"Watchmen" by Alan Moore is a masterpiece.', '2023-09-22 14:40:10'),
(14, 9, 'I''ve heard so much about it! Will definitely check it out.', '2023-09-22 14:45:22'),
(15, 10, 'Looking for a biography recommendation.', '2023-09-23 10:50:30'),
(10, 15, 'Steve Jobs by Walter Isaacson is fascinating.', '2023-09-23 11:00:15'),
(15, 10, 'Great suggestion! I''m interested in tech innovators.', '2023-09-23 11:05:22');

-- Sample Threads
INSERT INTO threads (title, content, user_id, category_id, book_id, view_count) VALUES
('Just finished "Beyond the Stars" and I''m blown away!', 'The character development was incredible and the plot kept me guessing until the end. What did everyone else think about the twist in chapter 15?', 1, 4, 2, 124),
('Monthly Sci-Fi Reading Challenge: October', 'This month we''re focusing on space exploration themed books. Post your reading goals and progress here!', 3, 5, NULL, 87),
('Looking for historical fiction recommendations', 'I''ve recently become interested in historical fiction set in ancient Rome. Any must-read suggestions?', 2, 3, NULL, 56),
('Discussion: The ethics in "The Silent Echo"', 'I''d love to discuss the moral dilemmas faced by the protagonist throughout the story. No spoilers in the main post, but expect them in comments!', 4, 1, 1, 203),
('Author Spotlight: Sarah Williams', 'Let''s talk about Sarah Williams and her fantasy worlds! "The Lost Kingdom" is just the beginning of her amazing universe.', 5, 2, 3, 94),
-- Additional threads
('Classic Literature Book Club - September', 'This month we''re reading "Pride and Prejudice" by Jane Austen. Share your thoughts and favorite quotes here!', 6, 1, 4, 156),
('The future of AI in sci-fi literature', 'How has the portrayal of artificial intelligence evolved in science fiction over the decades? From Asimov to modern writers.', 7, 5, NULL, 189),
('Fantasy worldbuilding techniques', 'What makes a fantasy world believable? Let''s discuss the techniques authors use to create immersive fantasy settings.', 8, 2, NULL, 142),
('Best detective fiction of the 21st century', 'Who are the modern masters of mystery? Share your favorite contemporary detective novels.', 9, 3, 5, 113),
('Historical accuracy in historical fiction', 'How important is historical accuracy in historical fiction? Can artistic license sometimes enhance the story?', 10, 3, NULL, 98),
('Poetry analysis: "The Waste Land"', 'T.S. Eliot''s masterpiece continues to intrigue readers. Let''s break down the symbolism and themes.', 11, 4, 6, 76),
('Romance tropes: Love them or hate them?', 'From enemies-to-lovers to fake relationships - which romance tropes work for you and which ones do you avoid?', 12, 1, NULL, 205),
('Psychological thrillers that genuinely surprised you', 'Looking for psychological thrillers with truly unexpected twists. What books genuinely shocked you?', 13, 3, NULL, 167),
('The evolution of graphic novels as literature', 'How have graphic novels evolved as a literary form? Are they finally getting the recognition they deserve?', 14, 4, NULL, 88),
('Biographies that read like novels', 'Some biographies are so well-written they read like fiction. Share your recommendations for engaging biographies.', 15, 1, NULL, 103),
('Book-to-screen adaptations: Hits and misses', 'Which books translated well to film or TV? Which ones failed miserably? What makes a good adaptation?', 1, 4, NULL, 215),
('Reading habits and routines', 'When and how do you read? Morning or night? Physical books or e-readers? Let''s share our reading rituals.', 2, 1, NULL, 132),
('The resurgence of audiobooks', 'Audiobooks are more popular than ever. How do they compare to traditional reading? Do you have favorite narrators?', 3, 5, NULL, 109),
('Navigating fantasy series: Where to start?', 'With so many epic fantasy series out there, which ones are worth the investment? Looking for recommendations!', 4, 2, NULL, 149),
('Hidden gems in literary fiction', 'Let''s highlight some underappreciated literary fiction. Which amazing books aren''t getting the attention they deserve?', 5, 1, NULL, 83);

-- Thread Comments
INSERT INTO thread_comments (thread_id, user_id, content, upvotes, downvotes) VALUES
(1, 2, 'That twist completely caught me off guard! I had to reread that chapter immediately.', 12, 0),
(1, 3, 'I saw it coming, but it was still executed brilliantly. The foreshadowing was subtle but there.', 8, 1),
(2, 1, 'I''m planning to read "The Martian" and "Aurora" this month. Both deal with the challenges of space travel.', 5, 0),
(3, 5, 'You absolutely need to read "I, Claudius" by Robert Graves. It''s a classic for a reason!', 15, 0),
(3, 4, 'I just finished "The Eagle" by Simon Scarrow - great depiction of Roman legionaries.', 7, 0),
(4, 3, 'The way the author handled the protagonist''s decision in the climax was so thought-provoking. It really made me question what I would do in that situation.', 20, 1),
(5, 2, 'Her worldbuilding is unmatched! I heard she spent five years creating the languages and cultures before writing a single word of the actual story.', 10, 0),
-- Additional comments
(6, 1, 'Elizabeth Bennet is one of my favorite literary characters of all time. Her wit and intelligence were revolutionary for the time period.', 18, 0),
(6, 3, 'The social commentary in this novel is still relevant today. Austen was truly ahead of her time.', 15, 1),
(6, 5, 'I love how Austen balances humor and serious themes throughout the novel.', 12, 0),
(6, 7, 'Mr. Darcy''s character development is masterful - from seemingly arrogant to misunderstood and honorable.', 14, 2),
(7, 2, 'Asimov''s Three Laws of Robotics have influenced how we think about AI ethics even in real-world applications today.', 22, 0),
(7, 4, 'Modern AI in sci-fi has become more nuanced. Compare HAL 9000 to the AI in "Her" or "Ex Machina".', 19, 1),
(7, 6, 'I think the trend has moved from AI as threat to AI as mirror of humanity, reflecting our own flaws back at us.', 17, 0),
(7, 8, 'William Gibson''s prescient visions of AI and cyberspace in "Neuromancer" still feel relevant despite being written in 1984.', 21, 0),
(8, 1, 'Tolkien set the gold standard with Middle-earth. His linguistic expertise gave the world authentic depth.', 25, 1),
(8, 3, 'Brandon Sanderson''s magic systems are so well-developed they almost feel like science rather than magic.', 20, 0),
(8, 5, 'I think cultural diversity in fantasy worlds has improved tremendously in recent years, moving beyond medieval European settings.', 18, 0),
(8, 7, 'The best fantasy worlds feel lived-in, with histories that extend beyond the scope of the main story.', 16, 1),
(9, 2, 'Tana French''s Dublin Murder Squad series is phenomenal. "In the Woods" is a masterclass in character-driven mystery.', 14, 0),
(9, 4, 'Gillian Flynn''s "Gone Girl" redefined the psychological thriller for a new generation.', 16, 1),
(9, 6, 'I love Louise Penny''s Inspector Gamache series - they combine great mysteries with a charming setting.', 13, 0),
(9, 8, 'Japanese mystery writer Keigo Higashino deserves more recognition in the West. "The Devotion of Suspect X" is brilliant.', 15, 0),
(10, 1, 'I think historical accuracy matters most for well-documented events and figures. More obscure periods allow for greater creative license.', 12, 0),
(10, 3, 'Hilary Mantel''s Thomas Cromwell trilogy is a perfect balance of historical accuracy and compelling narrative.', 14, 1),
(10, 5, 'Sometimes historical inaccuracies can actually help modern readers connect with the past in ways strict accuracy might not.', 11, 2),
(10, 7, 'I get frustrated when authors take liberties with important historical events just for dramatic effect.', 13, 0);

-- Thread Replies
INSERT INTO thread_replies (comment_id, user_id, parent_reply_id, content, upvotes) VALUES
(1, 3, NULL, 'Right? And the way it connected to the prologue was so clever!', 6),
(1, 1, NULL, 'I had to go back and reread the prologue after that chapter. The author planned it all so meticulously.', 8),
(2, 5, NULL, 'What foreshadowing did you notice? I completely missed it on my first read.', 3),
(2, 3, 3, 'There were subtle hints in the dialogue between the captain and the navigator in chapters 7 and 10. Also, the recurrent dream sequences had clues.', 5),
(3, 2, NULL, '"The Martian" is excellent! The scientific accuracy makes it so immersive.', 4),
(6, 1, NULL, 'Exactly! And it was made more complex by the fact that there was no clearly "right" choice.', 7),
(6, 4, 6, 'I think that''s what made the book so powerful - forcing readers to confront that moral ambiguity.', 9),
(6, 1, 7, 'The author did mention in an interview that she wanted readers to feel uncomfortable with any possible solution. Mission accomplished!', 11),
-- Additional replies with deeper nesting (up to level 5)
-- Thread 6 replies (Pride and Prejudice discussion)
(6, 2, NULL, 'Elizabeth''s rejection of Mr. Collins shows her determination to marry for love, not convenience.', 8),
(6, 4, 9, 'That was revolutionary for the time period when marriage was often an economic arrangement.', 7),
(6, 6, 10, 'Austen was subtly advocating for women''s autonomy through Elizabeth''s character.', 9),
(6, 8, 11, 'Do you think Austen was drawing from personal experience? She rejected a proposal herself.', 6),
(6, 10, 12, 'Almost certainly. Many scholars believe her personal experiences informed her portrayal of marriage.', 5),
-- Thread 7 replies (AI in sci-fi discussion)
(7, 1, NULL, 'The concept of the technological singularity has dramatically changed how AI is portrayed in modern sci-fi.', 11),
(7, 3, 14, 'True. Earlier sci-fi often portrayed AI as either menacing or servile, but rarely with the complexity we see today.', 9),
(7, 5, 15, 'Authors like Ted Chiang have taken AI narratives in fascinating philosophical directions.', 8),
(7, 7, 16, 'His story "The Lifecycle of Software Objects" treats AI with such nuance and humanity.', 7),
(7, 9, 17, 'That story explores AI raising like children rather than programming them - a radical shift in perspective.', 6),
-- Thread 8 replies (Fantasy worldbuilding discussion)
(8, 2, NULL, 'The economy and trade systems in fantasy worlds are often underdeveloped.', 7),
(8, 4, 19, 'Good point. How do all these medieval fantasy kingdoms sustain themselves?', 6),
(8, 6, 20, 'N.K. Jemisin does this well in the Broken Earth trilogy. The resource management aspects feel authentic.', 8),
(8, 8, 21, 'Her world feels lived-in because she considers these practical aspects of society.', 5),
(8, 10, 22, 'This is why urban fantasy sometimes feels more credible - it builds on existing economic frameworks.', 4),
-- Thread 9 replies (Detective fiction discussion)
(9, 1, NULL, 'The unreliable narrator technique has been revolutionizing the mystery genre.', 10),
(9, 3, 24, 'It adds such a fascinating layer when you can''t even trust the perspective you''re reading from.', 9),
(9, 5, 25, '"The Girl on the Train" used this technique effectively, though it''s become a bit overused since.', 8),
(9, 7, 26, 'I think "Atonement" by Ian McEwan was one of the most powerful uses of this technique.', 7),
(9, 9, 27, 'Though not strictly detective fiction, it demonstrates how unreliable narration can transform a story.', 6),
-- Thread 10 replies (Historical fiction discussion)
(10, 2, NULL, 'The best historical fiction makes me want to research the actual history afterward.', 9),
(10, 4, 29, 'Yes! I spent hours researching Tudor England after reading "Wolf Hall".', 8),
(10, 6, 30, 'That''s when historical fiction is at its best - as a gateway to learning actual history.', 7),
(10, 8, 31, 'I discovered my love of Roman history through Colleen McCullough''s "Masters of Rome" series.', 6),
(10, 10, 32, 'Similarly, Bernard Cornwell''s Saxon Stories led me down a rabbit hole of Anglo-Saxon history research.', 5);

-- Thread Votes
INSERT INTO thread_votes (user_id, comment_id, vote_type) VALUES
(1, 1, 1),
(3, 1, 1),
(4, 1, 1),
(5, 6, 1),
(1, 6, 1),
(2, 6, 1),
-- Additional comment votes
(6, 1, 1), (7, 1, 1), (8, 1, 1), (9, 1, 1), (10, 1, 1),
(6, 2, 1), (7, 2, 1), (8, 2, 1), (9, 2, 1), (10, 2, 1),
(1, 3, 1), (2, 3, 1), (4, 3, 1), (5, 3, 1), (6, 3, 1),
(7, 4, 1), (8, 4, 1), (9, 4, 1), (10, 4, 1), (11, 4, 1),
(1, 5, 1), (2, 5, 1), (3, 5, 1), (6, 5, 1), (7, 5, 1),
(8, 6, 1), (9, 6, 1), (10, 6, 1), (11, 6, 1), (12, 6, 1),
(1, 7, 1), (2, 7, 1), (3, 7, 1), (4, 7, 1), (6, 7, 1),
(7, 8, 1), (8, 8, 1), (9, 8, 1), (10, 8, 1), (11, 8, 1),
(1, 9, 1), (2, 9, 1), (3, 9, 1), (4, 9, 1), (5, 9, 1),
(6, 10, 1), (7, 10, 1), (8, 10, 1), (9, 10, 1), (10, 10, 1),
(11, 11, 1), (12, 11, 1), (13, 11, 1), (14, 11, 1), (15, 11, 1),
(1, 12, 1), (2, 12, 1), (3, 12, 1), (4, 12, 1), (5, 12, 1),
(6, 13, 1), (7, 13, 1), (8, 13, 1), (9, 13, 1), (10, 13, 1),
(11, 14, 1), (12, 14, 1), (13, 14, 1), (14, 14, 1), (15, 14, 1),
(1, 15, 1), (2, 15, 1), (3, 15, 1), (4, 15, 1), (5, 15, 1);

-- Thread Subscriptions
INSERT INTO thread_subscriptions (user_id, thread_id) VALUES
(2, 1),
(3, 1),
(1, 2),
(5, 3),
(2, 4),
(3, 4),
(1, 4),
(4, 5),
-- Additional subscriptions
(6, 1), (7, 1), (8, 1), (9, 1), (10, 1),
(4, 2), (5, 2), (6, 2), (7, 2), (8, 2),
(1, 3), (2, 3), (4, 3), (6, 3), (7, 3),
(5, 4), (6, 4), (7, 4), (8, 4), (9, 4),
(1, 5), (2, 5), (3, 5), (6, 5), (7, 5),
(1, 6), (2, 6), (3, 6), (4, 6), (5, 6), (8, 6), (9, 6),
(1, 7), (2, 7), (3, 7), (4, 7), (8, 7), (9, 7), (10, 7),
(2, 8), (3, 8), (4, 8), (5, 8), (6, 8), (7, 8), (9, 8),
(1, 9), (2, 9), (3, 9), (10, 9), (11, 9), (12, 9), (13, 9),
(1, 10), (4, 10), (5, 10), (6, 10), (11, 10), (12, 10), (15, 10);

-- Create 10 group chats
INSERT INTO groups (name, bio, owner_id, created_at) VALUES
('Classic Literature Club', 'Discussion group for classic literature enthusiasts', 1, '2023-09-01 10:00:00'),
('Sci-Fi Explorers', 'For lovers of science fiction across all media', 3, '2023-09-02 14:30:00'),
('Fantasy Realms', 'Discussing fantasy worlds from books to games', 5, '2023-09-03 16:45:00'),
('Mystery Solvers', 'For fans of detective fiction and mysteries', 2, '2023-09-04 11:15:00'),
('History Through Literature', 'Exploring historical events through fiction', 4, '2023-09-05 09:30:00'),
('Poetry Corner', 'Sharing and analyzing poetry of all eras', 6, '2023-09-06 13:20:00'),
('Romance Readers', 'For discussing romance novels and tropes', 8, '2023-09-07 15:10:00'),
('Thriller Enthusiasts', 'Psychological thrillers, suspense and horror', 10, '2023-09-08 17:45:00'),
('Graphic Novel Club', 'Comics, manga, and graphic storytelling', 12, '2023-09-09 12:30:00'),
('Biography Buffs', 'Real lives, extraordinary stories', 14, '2023-09-10 10:45:00');

-- Group members
INSERT INTO group_members (group_id, user_id, joined_at) VALUES
-- Classic Literature Club members
(1, 1, '2023-09-01 10:00:00'),
(1, 2, '2023-09-01 10:15:00'),
(1, 3, '2023-09-01 11:30:00'),
(1, 6, '2023-09-01 12:45:00'),
(1, 9, '2023-09-01 14:00:00'),
(1, 12, '2023-09-01 15:15:00'),
(1, 15, '2023-09-01 16:30:00'),
-- Sci-Fi Explorers members
(2, 3, '2023-09-02 14:30:00'),
(2, 1, '2023-09-02 14:45:00'),
(2, 5, '2023-09-02 15:00:00'),
(2, 7, '2023-09-02 15:15:00'),
(2, 9, '2023-09-02 15:30:00'),
(2, 11, '2023-09-02 15:45:00'),
(2, 13, '2023-09-02 16:00:00'),
-- Fantasy Realms members
(3, 5, '2023-09-03 16:45:00'),
(3, 2, '2023-09-03 17:00:00'),
(3, 4, '2023-09-03 17:15:00'),
(3, 6, '2023-09-03 17:30:00'),
(3, 8, '2023-09-03 17:45:00'),
(3, 10, '2023-09-03 18:00:00'),
(3, 12, '2023-09-03 18:15:00'),
-- Mystery Solvers members
(4, 2, '2023-09-04 11:15:00'),
(4, 4, '2023-09-04 11:30:00'),
(4, 6, '2023-09-04 11:45:00'),
(4, 8, '2023-09-04 12:00:00'),
(4, 10, '2023-09-04 12:15:00'),
(4, 12, '2023-09-04 12:30:00'),
(4, 14, '2023-09-04 12:45:00'),
-- History Through Literature members
(5, 4, '2023-09-05 09:30:00'),
(5, 1, '2023-09-05 09:45:00'),
(5, 3, '2023-09-05 10:00:00'),
(5, 5, '2023-09-05 10:15:00'),
(5, 7, '2023-09-05 10:30:00'),
(5, 9, '2023-09-05 10:45:00'),
(5, 11, '2023-09-05 11:00:00');

-- Group messages (10 groups with active conversations)
INSERT INTO group_messages (group_id, user_id, message, created_at) VALUES
-- Classic Literature Club conversation
(1, 1, 'Welcome to the Classic Literature Club! Let''s start by discussing our favorite classics.', '2023-09-11 10:00:00'),
(1, 2, 'I love "Pride and Prejudice" by Jane Austen. The wit and social commentary are timeless.', '2023-09-11 10:10:00'),
(1, 3, '"Crime and Punishment" by Dostoevsky changed how I think about morality and redemption.', '2023-09-11 10:20:00'),
(1, 6, 'For me, it''s "Jane Eyre" by Charlotte Brontë. Such a powerful exploration of independence and love.', '2023-09-11 10:30:00'),
(1, 9, 'I''m partial to "The Great Gatsby" - Fitzgerald''s prose is just magical.', '2023-09-11 10:40:00'),
(1, 1, 'Great choices! Should we pick one to discuss in depth for our next meeting?', '2023-09-11 10:50:00'),
(1, 12, 'I''d vote for "Pride and Prejudice" since it seems popular and accessible.', '2023-09-11 11:00:00'),
(1, 15, 'Sounds good to me. I''ve been meaning to re-read it anyway.', '2023-09-11 11:10:00'),
(1, 2, 'Perfect! Let''s read (or re-read) "Pride and Prejudice" and discuss it next week.', '2023-09-11 11:20:00'),
(1, 3, 'Looking forward to it! Any particular themes we should focus on?', '2023-09-11 11:30:00'),

-- Sci-Fi Explorers conversation
(2, 3, 'Welcome everyone to Sci-Fi Explorers! What sci-fi are you all currently reading?', '2023-09-12 15:00:00'),
(2, 1, 'I just started "Project Hail Mary" by Andy Weir and it''s fantastic so far!', '2023-09-12 15:10:00'),
(2, 5, 'I''m re-reading "Dune" before watching the new movie.', '2023-09-12 15:20:00'),
(2, 7, 'I''m working through Ted Chiang''s "Exhalation" - his short stories are mind-blowing.', '2023-09-12 15:30:00'),
(2, 9, 'Just finished "The Three-Body Problem" by Liu Cixin. Highly recommend if you like hard sci-fi.', '2023-09-12 15:40:00'),
(2, 3, 'Great recommendations! Has anyone read any good first contact stories lately?', '2023-09-12 15:50:00'),
(2, 11, '"Arrival" (originally "Story of Your Life" by Ted Chiang) is my favorite first contact story.', '2023-09-12 16:00:00'),
(2, 13, 'I enjoyed "Contact" by Carl Sagan - both the book and the movie adaptation.', '2023-09-12 16:10:00'),
(2, 1, 'Those are classics! Anyone read "To Sleep in a Sea of Stars" by Christopher Paolini?', '2023-09-12 16:20:00'),
(2, 5, 'Not yet, but it''s on my list. How is it?', '2023-09-12 16:30:00'),

-- Fantasy Realms conversation
(3, 5, 'Welcome to Fantasy Realms! What fantasy worlds do you find most immersive?', '2023-09-13 17:00:00'),
(3, 2, 'Middle-earth from Tolkien''s works will always be the gold standard for me.', '2023-09-13 17:10:00'),
(3, 4, 'Earthsea by Ursula K. Le Guin has such a unique magic system and philosophy.', '2023-09-13 17:20:00'),
(3, 6, 'I love the Discworld series by Terry Pratchett - humor with depth!', '2023-09-13 17:30:00'),
(3, 8, 'Brandon Sanderson''s Cosmere universe is incredible - especially the Stormlight Archive.', '2023-09-13 17:40:00'),
(3, 5, 'Great choices! What about fantasy series with strong female protagonists?', '2023-09-13 17:50:00'),
(3, 10, 'The Broken Earth trilogy by N.K. Jemisin is phenomenal.', '2023-09-13 18:00:00'),
(3, 12, 'Throne of Glass series by Sarah J. Maas has a compelling female lead.', '2023-09-13 18:10:00'),
(3, 2, 'Mistborn by Brandon Sanderson features Vin, one of my favorite protagonists.', '2023-09-13 18:20:00'),
(3, 4, 'And don''t forget Circe by Madeline Miller - a feminist retelling of Greek mythology.', '2023-09-13 18:30:00'),

-- Mystery Solvers conversation
(4, 2, 'Welcome to Mystery Solvers! What classic mystery novel would you recommend to someone new to the genre?', '2023-09-14 10:00:00'),
(4, 4, 'Agatha Christie''s "And Then There Were None" is a perfect starting point.', '2023-09-14 10:10:00'),
(4, 6, 'I''d suggest "The Hound of the Baskervilles" - Sherlock Holmes at his finest!', '2023-09-14 10:20:00'),
(4, 8, 'For something more contemporary, "The Girl with the Dragon Tattoo" is gripping.', '2023-09-14 10:30:00'),
(4, 10, 'I love "In the Woods" by Tana French - beautiful prose with a compelling mystery.', '2023-09-14 10:40:00'),
(4, 2, 'Has anyone read "The Thursday Murder Club"? It''s a recent favorite of mine.', '2023-09-14 10:50:00'),
(4, 12, 'Yes! It''s so charming and clever. I love the elderly protagonists.', '2023-09-14 11:00:00'),
(4, 14, 'For those who enjoy psychological elements, "The Silent Patient" was mind-blowing.', '2023-09-14 11:10:00'),
(4, 4, 'Speaking of psychological thrillers, "Gone Girl" completely changed the genre.', '2023-09-14 11:20:00'),
(4, 6, 'What are your thoughts on cozy mysteries versus hardboiled detective fiction?', '2023-09-14 11:30:00'),
(4, 8, 'I enjoy both for different moods. Cozy for relaxation, hardboiled for intensity.', '2023-09-14 11:40:00'),

-- History Through Literature conversation
(5, 4, 'Welcome to History Through Literature! What historical periods do you enjoy reading about?', '2023-09-15 09:00:00'),
(5, 1, 'I''m fascinated by Ancient Rome - particularly the fall of the Republic.', '2023-09-15 09:10:00'),
(5, 3, 'Tudor England for me. So many amazing novels set during Henry VIII''s reign.', '2023-09-15 09:20:00'),
(5, 5, 'I love reading about the French Revolution. "A Place of Greater Safety" by Hilary Mantel is brilliant.', '2023-09-15 09:30:00'),
(5, 7, 'World War II fiction has been my recent focus. "All the Light We Cannot See" was beautiful.', '2023-09-15 09:40:00'),
(5, 9, 'I enjoy novels set during the American Civil War, like "Cold Mountain."', '2023-09-15 09:50:00'),
(5, 11, 'Has anyone read "Pachinko"? It covers Korean history through multiple generations.', '2023-09-15 10:00:00'),
(5, 3, 'Yes! It was eye-opening about a part of history I knew little about.', '2023-09-15 10:10:00'),
(5, 5, 'What do you think makes a historical novel successful? Accuracy or storytelling?', '2023-09-15 10:20:00'),
(5, 1, 'I think a balance is ideal, but if forced to choose, compelling storytelling with reasonable accuracy.', '2023-09-15 10:30:00'),
(5, 7, 'I agree. Historical novels should inspire us to learn more about the actual history.', '2023-09-15 10:40:00'),

-- Poetry Corner conversation
(6, 6, 'Welcome to Poetry Corner! Who are your favorite poets?', '2023-09-16 13:00:00'),
(6, 11, 'Emily Dickinson has always resonated with me deeply.', '2023-09-16 13:10:00'),
(6, 1, 'I love Pablo Neruda''s work - so passionate and vivid.', '2023-09-16 13:20:00'),
(6, 3, 'T.S. Eliot''s "The Waste Land" changed how I think about poetry.', '2023-09-16 13:30:00'),
(6, 5, 'Mary Oliver''s nature poetry speaks to my soul.', '2023-09-16 13:40:00'),
(6, 6, 'What about contemporary poets? Any recommendations?', '2023-09-16 13:50:00'),
(6, 11, 'Ocean Vuong''s "Night Sky with Exit Wounds" is absolutely stunning.', '2023-09-16 14:00:00'),
(6, 1, 'I''ve been enjoying Rupi Kaur, though I know her style is polarizing.', '2023-09-16 14:10:00'),
(6, 3, 'Morgan Parker''s work is powerful - "Magical Negro" is a brilliant collection.', '2023-09-16 14:20:00'),
(6, 5, 'Do you prefer reading poetry or hearing it performed?', '2023-09-16 14:30:00'),
(6, 6, 'Both have their merits, but hearing the poet read their own work adds another dimension.', '2023-09-16 14:40:00'),

-- Romance Readers conversation
(7, 8, 'Welcome to Romance Readers! What''s your favorite romance subgenre?', '2023-09-17 15:00:00'),
(7, 12, 'I love historical romance, especially Regency era.', '2023-09-17 15:10:00'),
(7, 3, 'Contemporary romance with strong character development for me.', '2023-09-17 15:20:00'),
(7, 5, 'I enjoy paranormal romance - vampires, werewolves, the works!', '2023-09-17 15:30:00'),
(7, 7, 'Romantic comedies are my comfort reads - witty banter is everything.', '2023-09-17 15:40:00'),
(7, 8, 'What romance novel do you find yourself recommending most often?', '2023-09-17 15:50:00'),
(7, 12, '"Pride and Prejudice" is timeless for a reason.', '2023-09-17 16:00:00'),
(7, 3, 'For contemporary, "Beach Read" by Emily Henry balances humor and depth beautifully.', '2023-09-17 16:10:00'),
(7, 5, 'I always recommend "Red, White & Royal Blue" - it''s just delightful.', '2023-09-17 16:20:00'),
(7, 7, 'Anyone read "The Love Hypothesis"? It''s become my new favorite.', '2023-09-17 16:30:00'),
(7, 8, 'Yes! The STEM setting was refreshing and the fake dating trope was well executed.', '2023-09-17 16:40:00'),

-- Thriller Enthusiasts conversation
(8, 10, 'Welcome to Thriller Enthusiasts! What thriller kept you up all night?', '2023-09-18 17:00:00'),
(8, 13, '"Gone Girl" - that twist blindsided me completely.', '2023-09-18 17:10:00'),
(8, 2, '"The Silent Patient" had me racing to the end.', '2023-09-18 17:20:00'),
(8, 4, 'I couldn''t put down "Behind Closed Doors" by B.A. Paris.', '2023-09-18 17:30:00'),
(8, 6, '"Dark Places" by Gillian Flynn is underrated compared to her other works.', '2023-09-18 17:40:00'),
(8, 10, 'Do you prefer psychological thrillers or more action-oriented ones?', '2023-09-18 17:50:00'),
(8, 13, 'Psychological all the way - I love being in the character''s disturbed mind.', '2023-09-18 18:00:00'),
(8, 2, 'I enjoy both, but a good psychological twist stays with you longer.', '2023-09-18 18:10:00'),
(8, 4, 'What''s your take on unreliable narrators? Overused trope or still effective?', '2023-09-18 18:20:00'),
(8, 6, 'When done well, still incredibly effective. "Sometimes I Lie" by Alice Feeney used it brilliantly.', '2023-09-18 18:30:00'),
(8, 10, 'Agreed. It''s all in the execution. What thriller are you looking forward to reading next?', '2023-09-18 18:40:00'),

-- Graphic Novel Club conversation
(9, 12, 'Welcome to Graphic Novel Club! What graphic novels would you consider essential reading?', '2023-09-19 12:00:00'),
(9, 14, '"Watchmen" is absolutely foundational to the medium.', '2023-09-19 12:10:00'),
(9, 1, '"Maus" by Art Spiegelman showed how powerful graphic storytelling can be for serious topics.', '2023-09-19 12:20:00'),
(9, 3, 'For manga, "Nausicaä of the Valley of the Wind" is a masterpiece.', '2023-09-19 12:30:00'),
(9, 5, '"Saga" by Brian K. Vaughan and Fiona Staples is my modern favorite.', '2023-09-19 12:40:00'),
(9, 12, 'What about graphic memoirs? "Fun Home" by Alison Bechdel is incredible.', '2023-09-19 12:50:00'),
(9, 14, '"Persepolis" by Marjane Satrapi is another powerful memoir in graphic form.', '2023-09-19 13:00:00'),
(9, 1, 'For superhero content, what do you think rises above the typical fare?', '2023-09-19 13:10:00'),
(9, 3, '"Kingdom Come" by Mark Waid and Alex Ross is a sophisticated take on superheroes.', '2023-09-19 13:20:00'),
(9, 5, 'I love how "Ms. Marvel" brought fresh perspective to the superhero genre.', '2023-09-19 13:30:00'),
(9, 12, 'Do you think graphic novels get the literary respect they deserve?', '2023-09-19 13:40:00'),

-- Biography Buffs conversation
(10, 14, 'Welcome to Biography Buffs! What''s the most fascinating biography you''ve read?', '2023-09-20 10:00:00'),
(10, 15, '"Steve Jobs" by Walter Isaacson showed both the brilliance and flaws of a complex person.', '2023-09-20 10:10:00'),
(10, 2, 'I was captivated by "Alexander Hamilton" by Ron Chernow - so much more than just the inspiration for the musical.', '2023-09-20 10:20:00'),
(10, 4, '"The Immortal Life of Henrietta Lacks" blended science, ethics, and personal story brilliantly.', '2023-09-20 10:30:00'),
(10, 6, '"Born a Crime" by Trevor Noah was both hilarious and deeply moving.', '2023-09-20 10:40:00'),
(10, 14, 'Do you prefer biographies of historical figures or contemporary ones?', '2023-09-20 10:50:00'),
(10, 15, 'Historical for me - I love seeing how their legacy has played out over time.', '2023-09-20 11:00:00'),
(10, 2, 'I enjoy both, but contemporary biographies often have more direct sources and interviews.', '2023-09-20 11:10:00'),
(10, 4, 'What makes a biography truly exceptional versus just informative?', '2023-09-20 11:20:00'),
(10, 6, 'For me, it''s when the author balances factual research with compelling narrative style.', '2023-09-20 11:30:00'),
(10, 14, 'I agree. The best biographies read like novels while maintaining journalistic integrity.', '2023-09-20 11:40:00');

-- Create reading lists and book ratings
INSERT INTO reading_lists (user_id, name, description, is_public) VALUES
(1, 'Fantasy Favorites', 'My all-time favorite fantasy novels', true),
(2, 'Classic Must-Reads', 'Essential classics everyone should read', true),
(3, 'Sci-Fi Exploration', 'Best science fiction across the decades', true),
(4, 'Mystery Masterpieces', 'Top detective and mystery novels', true),
(5, 'Historical Fiction Gems', 'Historical fiction that brings the past to life', true),
(6, 'Poetry Collections', 'Beautiful poetry anthologies and collections', true),
(7, 'Romance Recommendations', 'Swoon-worthy romance novels', true),
(8, 'Thrilling Reads', 'Page-turners that kept me up all night', true),
(9, 'Graphic Novel Essentials', 'Must-read graphic novels and comics', true),
(10, 'Biography Brilliance', 'Fascinating lives of remarkable people', true),
(11, 'Philosophical Fiction', 'Novels that make you think deeply', true),
(12, 'Young Adult Favorites', 'Best of YA literature', true),
(13, 'Literary Fiction Standouts', 'Contemporary literary masterpieces', true),
(14, 'Dystopian Worlds', 'Books about dystopian societies', true),
(15, 'Non-fiction Knowledge', 'Informative and enlightening non-fiction', true);

-- Add books to reading lists and ratings
INSERT INTO user_book_reviews (user_id, book_id, rating, comment) VALUES
(1, 1, 5, 'Absolutely loved this book! The character development was phenomenal.'),
(1, 2, 4, 'Great read with an engaging plot. Highly recommend.'),
(1, 3, 5, 'One of my all-time favorites. Couldn''t put it down.'),
(1, 4, 3, 'Solid story but the pacing was a bit slow in the middle.'),
(1, 5, 4, 'Fascinating world-building and intriguing characters.'),
(1, 6, 5, 'A masterpiece that deserves all the praise it gets.'),
(1, 7, 4, 'Very enjoyable read with some unexpected twists.'),
(1, 8, 3, 'Good but not great. Had potential for more depth.'),
(1, 9, 5, 'Brilliantly written with memorable characters.'),
(1, 10, 4, 'Excellent storytelling and emotional impact.'),
-- Additional ratings for user 2
(2, 1, 4, 'Really enjoyed this book, great character development.'),
(2, 2, 5, 'One of my all-time favorites, couldn''t put it down.'),
(2, 3, 3, 'Decent read but had some pacing issues.'),
(2, 4, 4, 'Well-written with engaging plot twists.'),
(2, 5, 5, 'Absolutely brilliant, a must-read for everyone.'),
(2, 6, 3, 'Solid read, enjoyed most of it.'),
(2, 7, 4, 'Really excellent book, highly recommend!'),
(2, 8, 5, 'Absolute masterpiece, changed my perspective!'),
(2, 9, 2, 'Disappointing read, wouldn''t recommend.'),
(2, 10, 4, 'Great storytelling with memorable characters.'),
-- Additional ratings for user 3
(3, 1, 3, 'Decent book but nothing special.'),
(3, 2, 4, 'Really enjoyed the characters and plot.'),
(3, 3, 5, 'Exceptional storytelling and world-building.'),
(3, 4, 2, 'Had trouble getting through it.'),
(3, 5, 3, 'Some interesting moments but overall just okay.'),
(3, 6, 4, 'Well-crafted narrative with strong themes.'),
(3, 7, 5, 'One of the best books I''ve read this year.'),
(3, 8, 3, 'Good but not great, somewhat predictable.'),
(3, 9, 4, 'Engaging story with well-developed characters.'),
(3, 10, 3, 'Worth reading but didn''t live up to the hype.'),
-- Additional ratings for user 4
(4, 1, 5, 'Absolutely fantastic from beginning to end.'),
(4, 2, 2, 'Struggled to finish, not my cup of tea.'),
(4, 3, 4, 'Very well written with a satisfying conclusion.'),
(4, 4, 3, 'Had its moments but somewhat uneven.'),
(4, 5, 5, 'Couldn''t put it down, utterly captivating.'),
(4, 6, 4, 'Excellent pacing and character development.'),
(4, 7, 2, 'Disappointing given all the hype.'),
(4, 8, 3, 'Decent read but won''t be re-reading.'),
(4, 9, 5, 'Brilliant concept and execution.'),
(4, 10, 4, 'Very engaging, would recommend to others.'),
-- Additional ratings for user 5
(5, 1, 2, 'Not my favorite, found it overrated.'),
(5, 2, 3, 'Some strong moments but overall mediocre.'),
(5, 3, 4, 'Really enjoyable, would read more by this author.'),
(5, 4, 5, 'Exceptional in every way, couldn''t put it down.'),
(5, 5, 3, 'Interesting premise but execution was lacking.'),
(5, 6, 2, 'Too slow and tedious for my taste.'),
(5, 7, 4, 'Well-crafted story with compelling characters.'),
(5, 8, 5, 'Outstanding, one of my new favorites.'),
(5, 9, 3, 'Good but not quite as great as I expected.'),
(5, 10, 4, 'Thoroughly engaging from start to finish.'),
-- Additional ratings for user 6
(6, 1, 3, 'Decent read with some memorable moments.'),
(6, 2, 4, 'Very well-written and engaging throughout.'),
(6, 3, 5, 'Extraordinary book that stayed with me long after reading.'),
(6, 4, 2, 'Didn''t live up to expectations, rather disappointing.'),
(6, 5, 4, 'Great storyline with well-developed characters.'),
(6, 6, 3, 'Worth reading but not a standout.'),
(6, 7, 5, 'Among the best I''ve read this year, highly recommend.'),
(6, 8, 4, 'Very enjoyable with a satisfying conclusion.'),
(6, 9, 3, 'Had some great moments but lacked consistency.'),
(6, 10, 5, 'Brilliant from start to finish, couldn''t put it down.'),
-- Additional ratings for user 7
(7, 1, 5, 'Masterfully written, a true modern classic.'),
(7, 2, 3, 'Had its moments but didn''t quite hit the mark for me.'),
(7, 3, 4, 'Compelling story with intriguing characters.'),
(7, 4, 5, 'Outstanding in every respect, deeply moving.'),
(7, 5, 2, 'Struggled to connect with the story or characters.'),
(7, 6, 3, 'Decent but somewhat predictable.'),
(7, 7, 4, 'Really well-crafted with thoughtful themes.'),
(7, 8, 2, 'Unfortunately not as good as I hoped.'),
(7, 9, 5, 'Exceptional storytelling, couldn''t put it down.'),
(7, 10, 3, 'Good but not particularly memorable.'),
-- Additional ratings for user 8
(8, 1, 4, 'Really excellent book with compelling characters.'),
(8, 2, 5, 'One of the best books I''ve read in years.'),
(8, 3, 2, 'Unfortunately not to my taste.'),
(8, 4, 3, 'Solid story but the writing style was inconsistent.'),
(8, 5, 4, 'Very engaging with some unexpected twists.'),
(8, 6, 5, 'Absolutely loved everything about this book.'),
(8, 7, 3, 'Enjoyable but didn''t quite meet expectations.'),
(8, 8, 4, 'Well-written with a fascinating premise.'),
(8, 9, 2, 'Struggled to finish, not my cup of tea.'),
(8, 10, 5, 'Brilliant in every way, a must-read.'),
-- Additional ratings for user 9
(9, 1, 2, 'Disappointing given the hype.'),
(9, 2, 3, 'Some interesting elements but overall just okay.'),
(9, 3, 4, 'Very well-executed story with depth.'),
(9, 4, 5, 'Exceptional, one of my all-time favorites now.'),
(9, 5, 3, 'Worth reading but had some flaws.'),
(9, 6, 4, 'Thoroughly enjoyed the characters and plot.'),
(9, 7, 2, 'Just couldn''t get into this one.'),
(9, 8, 5, 'Absolutely captivating from beginning to end.'),
(9, 9, 3, 'Good premise but somewhat uneven execution.'),
(9, 10, 4, 'Very engaging and thought-provoking.'),
-- Additional ratings for user 10
(10, 1, 5, 'Utterly brilliant, couldn''t put it down.'),
(10, 2, 4, 'Really enjoyed the depth of the storytelling.'),
(10, 3, 3, 'Good but not quite what I expected.'),
(10, 4, 2, 'Struggled to connect with the narrative.'),
(10, 5, 5, 'Exceptional in every way, highly recommend.'),
(10, 6, 4, 'Very well-written with memorable characters.'),
(10, 7, 3, 'Decent story with some standout moments.'),
(10, 8, 5, 'Absolutely loved it, will definitely re-read.'),
(10, 9, 2, 'Unfortunately fell flat for me.'),
(10, 10, 4, 'Engaging throughout with a satisfying conclusion.');

-- Add sample book statuses
INSERT INTO user_book_status (user_id, book_id, status, is_private, created_at, updated_at) VALUES
(1, 1, 'completed', false, '2023-09-15 14:30:00', '2023-09-15 14:30:00'),
(1, 2, 'reading', false, '2023-09-16 10:15:00', '2023-09-16 10:15:00'),
(1, 3, 'plan_to_read', true, '2023-09-17 09:20:00', '2023-09-17 09:20:00'),
(1, 4, 'on_hold', false, '2023-09-18 11:45:00', '2023-09-18 11:45:00'),
(1, 5, 'dropped', false, '2023-09-19 16:30:00', '2023-09-19 16:30:00'),
(2, 1, 'reading', false, '2023-09-15 15:20:00', '2023-09-15 15:20:00'),
(2, 3, 'completed', true, '2023-09-16 14:10:00', '2023-09-16 14:10:00'),
(2, 5, 'plan_to_read', false, '2023-09-17 12:40:00', '2023-09-17 12:40:00'),
(3, 2, 'completed', false, '2023-09-15 18:05:00', '2023-09-15 18:05:00'),
(3, 4, 'reading', true, '2023-09-16 09:30:00', '2023-09-16 09:30:00'),
(3, 6, 'on_hold', false, '2023-09-17 13:15:00', '2023-09-17 13:15:00'),
(4, 1, 'plan_to_read', false, '2023-09-15 11:20:00', '2023-09-15 11:20:00'),
(4, 3, 'reading', false, '2023-09-16 16:45:00', '2023-09-16 16:45:00'),
(4, 5, 'completed', true, '2023-09-17 10:10:00', '2023-09-17 10:10:00'),
(5, 2, 'on_hold', false, '2023-09-15 13:40:00', '2023-09-15 13:40:00'),
(5, 4, 'dropped', true, '2023-09-16 08:25:00', '2023-09-16 08:25:00'),
(5, 6, 'reading', false, '2023-09-17 15:30:00', '2023-09-17 15:30:00');
