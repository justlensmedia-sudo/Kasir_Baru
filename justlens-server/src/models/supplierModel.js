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
  },

  upsert: async ({ id, name, phone, address }) => {
    let existing = null;
    if (id) {
      existing = await get('SELECT * FROM suppliers WHERE id = ?', [id]);
    }
    if (!existing && name) {
      existing = await get('SELECT * FROM suppliers WHERE name = ?', [name]);
    }

    if (existing) {
      await run(
        `UPDATE suppliers 
         SET name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name || existing.name, phone || existing.phone, address || existing.address, existing.id]
      );
      return { status: 'updated', id: existing.id };
    } else {
      const res = await run(
        'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
        [name, phone || null, address || null]
      );
      return { status: 'created', id: res.lastID };
    }
  }
};

module.exports = SupplierModel;
