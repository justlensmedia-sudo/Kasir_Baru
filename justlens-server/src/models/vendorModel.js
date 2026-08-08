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
  },

  upsert: async ({ id, name, service_type, base_cost_per_m2 }) => {
    let existing = null;
    if (id) existing = await get('SELECT * FROM vendors WHERE id = ?', [id]);
    if (!existing && name) existing = await get('SELECT * FROM vendors WHERE name = ?', [name]);

    if (existing) {
      await run(
        `UPDATE vendors 
         SET name = ?, service_type = ?, base_cost_per_m2 = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name || existing.name, service_type || existing.service_type, base_cost_per_m2 !== undefined ? base_cost_per_m2 : existing.base_cost_per_m2, existing.id]
      );
      return { status: 'updated', id: existing.id };
    } else {
      const res = await run(
        'INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)',
        [name, service_type || 'Custom Service', base_cost_per_m2 || 0]
      );
      return { status: 'created', id: res.lastID };
    }
  }
};

module.exports = VendorModel;
