// Add this new endpoint to search for users

router.get('/search', authenticate, async (req, res) => {
    try {
        const searchQuery = req.query.q;
        if (!searchQuery || searchQuery.length < 2) {
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        // Search for users with username containing the search query
        // Exclude the current user from results
        const users = await pool.query(
            `SELECT user_id, username 
             FROM users 
             WHERE username ILIKE $1 AND user_id != $2
             LIMIT 10`,
            [`%${searchQuery}%`, req.user.user_id]
        );

        res.json(users.rows);
    } catch (err) {
        console.error('Error searching users:', err);
        res.status(500).json({ error: 'Server error' });
    }
});
