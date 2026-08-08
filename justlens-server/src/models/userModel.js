const { query, get, run } = require('../config/database');

const UserModel = {
  findByUsername: async (username) => {
    return await get('SELECT * FROM users WHERE username = ?', [username]);
  },

  findById: async (id) => {
    return await get('SELECT id, name, username, role, created_at FROM users WHERE id = ?', [id]);
  },

  getAll: async () => {
    return await query('SELECT id, name, username, role, created_at FROM users ORDER BY id DESC');
  },

  create: async ({ name, username, role, password_hash }) => {
    const res = await run(
      'INSERT INTO users (name, username, role, password_hash) VALUES (?, ?, ?, ?)',
      [name, username, role || 'kasir', password_hash]
    );
    return res.lastID;
  }
};

module.exports = UserModel;
