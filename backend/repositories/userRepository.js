export const userRepository = (db) => ({
    async findUserByEmail(email) {
        return await db.get('SELECT * FROM users WHERE email = ?', email);
    },

    async findUserById(id) {
        return await db.get('SELECT * FROM users WHERE id = ?', id);
    },

    async findUserByWalletAddress(wallet_address) {
        return await db.get('SELECT * FROM users WHERE wallet_address = ?', wallet_address);
    },

    async createUser({ email, wallet_address, status, recommender_wallet_address }) {
        const result = await db.run(
            'INSERT INTO users (email, wallet_address, status, recommender_wallet_address) VALUES (?, ?, ?, ?)',
            email,
            wallet_address,
            status,
            recommender_wallet_address
        );
        return { id: result.lastID, email, wallet_address, status };
    },

    async getAllUsers() {
        return await db.all('SELECT * FROM users');
    },

    async getUsersByStatus(status) {
        return await db.all('SELECT * FROM users WHERE status = ?', status);
    },

    async updateUser(id, data) {
        const fields = Object.keys(data);
        const values = Object.values(data);

        if (fields.length === 0) {
            // Si aucune donnée n'est fournie, ne rien faire
            return;
        }

        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const query = `UPDATE users SET ${setClause} WHERE id = ?`;

        return await db.run(query, [...values, id]);
    },

    async updateUserStatus(wallet_address, status) {
        return await db.run('UPDATE users SET status = ? WHERE wallet_address = ?', status, wallet_address);
    }
});
