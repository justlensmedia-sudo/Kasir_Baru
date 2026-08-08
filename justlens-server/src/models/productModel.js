const { query, get, run } = require('../config/database');

const ProductModel = {
  getAll: async (category = null) => {
    if (category) {
      return await query('SELECT * FROM products WHERE category = ? ORDER BY name ASC', [category]);
    }
    return await query('SELECT * FROM products ORDER BY name ASC');
  },

  getById: async (id) => {
    return await get('SELECT * FROM products WHERE id = ?', [id]);
  },

  getByCode: async (code) => {
    return await get('SELECT * FROM products WHERE code = ?', [code]);
  },

  create: async ({ code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock }) => {
    const res = await run(
      `INSERT INTO products (code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        is_outsource ? 1 : 0,
        is_metered ? 1 : 0,
        base_price || 0,
        sell_price || 0,
        stock || 0
      ]
    );
    return res.lastID;
  },

  update: async (id, { code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock }) => {
    const res = await run(
      `UPDATE products 
       SET code = ?, name = ?, category = ?, unit = ?, is_outsource = ?, is_metered = ?, base_price = ?, sell_price = ?, stock = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        is_outsource ? 1 : 0,
        is_metered ? 1 : 0,
        base_price || 0,
        sell_price || 0,
        stock || 0,
        id
      ]
    );
    return res.changes;
  },

  upsertByCode: async ({ code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock }) => {
    const existing = await get('SELECT id FROM products WHERE code = ?', [code]);
    if (existing) {
      await run(
        `UPDATE products 
         SET name = ?, category = ?, unit = ?, is_outsource = ?, is_metered = ?, base_price = ?, sell_price = ?, stock = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          name,
          category,
          unit || 'Pcs',
          is_outsource ? 1 : 0,
          is_metered ? 1 : 0,
          base_price || 0,
          sell_price || 0,
          stock || 0,
          existing.id
        ]
      );
      return { id: existing.id, status: 'updated' };
    } else {
      const res = await run(
        `INSERT INTO products (code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          name,
          category,
          unit || 'Pcs',
          is_outsource ? 1 : 0,
          is_metered ? 1 : 0,
          base_price || 0,
          sell_price || 0,
          stock || 0
        ]
      );
      return { id: res.lastID, status: 'created' };
    }
  },

  deductStock: async (id, qty) => {
    const res = await run(
      `UPDATE products 
       SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND is_outsource = 0`,
      [qty, id]
    );
    return res.changes;
  },

  getLowStock: async (threshold = 10) => {
    return await query(
      'SELECT * FROM products WHERE is_outsource = 0 AND stock <= ? ORDER BY stock ASC',
      [threshold]
    );
  },

  delete: async (id) => {
    const res = await run('DELETE FROM products WHERE id = ?', [id]);
    return res.changes;
  }
};

module.exports = ProductModel;
