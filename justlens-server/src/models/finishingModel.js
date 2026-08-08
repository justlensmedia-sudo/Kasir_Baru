const { query, get, run } = require('../config/database');

const FinishingModel = {
  getAll: async () => {
    return await query('SELECT * FROM finishing_options ORDER BY name ASC');
  },

  getById: async (id) => {
    return await get('SELECT * FROM finishing_options WHERE id = ?', [id]);
  },

  create: async ({ name, price }) => {
    const res = await run(
      'INSERT INTO finishing_options (name, price) VALUES (?, ?)',
      [name, price || 0]
    );
    return res.lastID;
  },

  update: async (id, { name, price }) => {
    const res = await run(
      `UPDATE finishing_options 
       SET name = ?, price = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, price || 0, id]
    );
    return res.changes;
  },

  delete: async (id) => {
    const res = await run('DELETE FROM finishing_options WHERE id = ?', [id]);
    return res.changes;
  }
};

module.exports = FinishingModel;
