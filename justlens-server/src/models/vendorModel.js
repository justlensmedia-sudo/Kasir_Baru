const { query, get, run } = require('../config/database');

const VendorModel = {
  getAll: async () => {
    return await query('SELECT * FROM vendors ORDER BY name ASC');
  },

  getById: async (id) => {
    return await get('SELECT * FROM vendors WHERE id = ?', [id]);
  },

  create: async ({ name, service_type, base_cost_per_m2 }) => {
    const res = await run(
      'INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)',
      [name, service_type, base_cost_per_m2 || 0]
    );
    return res.lastID;
  },

  update: async (id, { name, service_type, base_cost_per_m2 }) => {
    const res = await run(
      `UPDATE vendors 
       SET name = ?, service_type = ?, base_cost_per_m2 = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [name, service_type, base_cost_per_m2 || 0, id]
    );
    return res.changes;
  },

  delete: async (id) => {
    const res = await run('DELETE FROM vendors WHERE id = ?', [id]);
    return res.changes;
  }
};

module.exports = VendorModel;
