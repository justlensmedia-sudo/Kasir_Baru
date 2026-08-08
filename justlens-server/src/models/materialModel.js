const { query, get, run } = require('../config/database');

const MaterialModel = {
  getAll: async (category = null) => {
    if (category) {
      return await query(
        `SELECT m.*, s.name as supplier_name 
         FROM materials m 
         LEFT JOIN suppliers s ON m.supplier_id = s.id 
         WHERE m.category = ? ORDER BY m.name ASC`,
        [category]
      );
    }
    return await query(
      `SELECT m.*, s.name as supplier_name 
       FROM materials m 
       LEFT JOIN suppliers s ON m.supplier_id = s.id 
       ORDER BY m.name ASC`
    );
  },

  getById: async (id) => {
    return await get(
      `SELECT m.*, s.name as supplier_name 
       FROM materials m 
       LEFT JOIN suppliers s ON m.supplier_id = s.id 
       WHERE m.id = ?`,
      [id]
    );
  },

  getByCode: async (code) => {
    return await get('SELECT * FROM materials WHERE code = ?', [code]);
  },

  create: async ({ code, name, category, unit, base_price, stock, supplier_id }) => {
    const res = await run(
      `INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        base_price || 0,
        stock || 0,
        supplier_id || null
      ]
    );
    return res.lastID;
  },

  update: async (id, { code, name, category, unit, base_price, stock, supplier_id }) => {
    const res = await run(
      `UPDATE materials 
       SET code = ?, name = ?, category = ?, unit = ?, base_price = ?, stock = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        base_price || 0,
        stock || 0,
        supplier_id || null,
        id
      ]
    );
    return res.changes;
  },

  addStock: async (id, qty) => {
    const res = await run(
      `UPDATE materials 
       SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [qty, id]
    );
    return res.changes;
  },

  delete: async (id) => {
    const res = await run('DELETE FROM materials WHERE id = ?', [id]);
    return res.changes;
  }
};

module.exports = MaterialModel;
