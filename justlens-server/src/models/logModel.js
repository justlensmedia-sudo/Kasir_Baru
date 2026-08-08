const { query, run } = require('../config/database');

const LogModel = {
  getAll: async (limit = 100) => {
    return await query(
      'SELECT id, user_id, user_name, activity, details, created_at FROM activity_logs ORDER BY id DESC LIMIT ?',
      [limit]
    );
  },

  create: async ({ user_id, user_name, activity, details }) => {
    const res = await run(
      'INSERT INTO activity_logs (user_id, user_name, activity, details) VALUES (?, ?, ?, ?)',
      [user_id || null, user_name || 'System', activity, details || '']
    );
    return res.lastID;
  }
};

module.exports = LogModel;
