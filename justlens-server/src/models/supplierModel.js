const { query, get, run } = require('../config/database');

const SupplierModel = {
  getAll: async () => {
    return await query('SELECT * FROM suppliers ORDER BY name ASC');
  },

  getById: async (id) => {
    return await get('SELECT * FROM suppliers WHERE id = ?', [id]);
  },

  create: async ({ name, phone, address }) => {
    const res = await run(
      'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
      [name, phone || null, address || null]
    );
    return res.lastID;
  },

  update: async (id, { name, phone, address }) => {
    const res = await run(
      `UPDATE suppliers 
       SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, phone || null, address || null, id]
    );
    return res.changes;
  },

  delete: async (id) => {
    const res = await run('DELETE FROM suppliers WHERE id = ?', [id]);
    return res.changes;
  }
};

module.exports = SupplierModel;
