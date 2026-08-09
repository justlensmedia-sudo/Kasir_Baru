const { query, get, run } = require('../config/database');

const ProductModel = {
  getAll: async (category = null) => {
    if (category) {
      return await query(
        `SELECT p.*, s.name AS supplier_name 
         FROM products p 
         LEFT JOIN suppliers s ON p.supplier_id = s.id 
         WHERE p.category = ? 
         ORDER BY p.name ASC`,
        [category]
      );
    }
    return await query(
      `SELECT p.*, s.name AS supplier_name 
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       ORDER BY p.name ASC`
    );
  },

  getById: async (id) => {
    return await get(
      `SELECT p.*, s.name AS supplier_name 
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       WHERE p.id = ?`,
      [id]
    );
  },

  getByCode: async (code) => {
    return await get(
      `SELECT p.*, s.name AS supplier_name 
       FROM products p 
       LEFT JOIN suppliers s ON p.supplier_id = s.id 
       WHERE p.code = ?`,
      [code]
    );
  },

  create: async ({ code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id }) => {
    const res = await run(
      `INSERT INTO products (code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        base_unit || 'lembar',
        purchase_unit || 'rim',
        conversion_ratio !== undefined ? Number(conversion_ratio) : 500,
        tiered_pricing ? (typeof tiered_pricing === 'string' ? tiered_pricing : JSON.stringify(tiered_pricing)) : null,
        is_discountable !== undefined ? (is_discountable ? 1 : 0) : 1,
        max_discount_percent !== undefined ? Number(max_discount_percent) : 0,
        is_outsource ? 1 : 0,
        is_metered ? 1 : 0,
        base_price || 0,
        sell_price || 0,
        stock || 0,
        supplier_id
      ]
    );
    return res.lastID;
  },

  update: async (id, { code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id }) => {
    const res = await run(
      `UPDATE products 
       SET code = ?, name = ?, category = ?, unit = ?, base_unit = ?, purchase_unit = ?, conversion_ratio = ?, tiered_pricing = ?, is_discountable = ?, max_discount_percent = ?, is_outsource = ?, is_metered = ?, base_price = ?, sell_price = ?, stock = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [
        code,
        name,
        category,
        unit || 'Pcs',
        base_unit || 'lembar',
        purchase_unit || 'rim',
        conversion_ratio !== undefined ? Number(conversion_ratio) : 500,
        tiered_pricing ? (typeof tiered_pricing === 'string' ? tiered_pricing : JSON.stringify(tiered_pricing)) : null,
        is_discountable !== undefined ? (is_discountable ? 1 : 0) : 1,
        max_discount_percent !== undefined ? Number(max_discount_percent) : 0,
        is_outsource ? 1 : 0,
        is_metered ? 1 : 0,
        base_price || 0,
        sell_price || 0,
        stock || 0,
        supplier_id,
        id
      ]
    );
    return res.changes;
  },

  upsertByCode: async ({ code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id }) => {
    const existing = await get('SELECT id FROM products WHERE code = ?', [code]);
    if (existing) {
      await run(
        `UPDATE products 
         SET name = ?, category = ?, unit = ?, base_unit = ?, purchase_unit = ?, conversion_ratio = ?, tiered_pricing = ?, is_discountable = ?, max_discount_percent = ?, is_outsource = ?, is_metered = ?, base_price = ?, sell_price = ?, stock = ?, supplier_id = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [
          name,
          category,
          unit || 'Pcs',
          base_unit || 'lembar',
          purchase_unit || 'rim',
          conversion_ratio !== undefined ? Number(conversion_ratio) : 500,
          tiered_pricing ? (typeof tiered_pricing === 'string' ? tiered_pricing : JSON.stringify(tiered_pricing)) : null,
          is_discountable !== undefined ? (is_discountable ? 1 : 0) : 1,
          max_discount_percent !== undefined ? Number(max_discount_percent) : 0,
          is_outsource ? 1 : 0,
          is_metered ? 1 : 0,
          base_price || 0,
          sell_price || 0,
          stock || 0,
          supplier_id,
          existing.id
        ]
      );
      return { id: existing.id, status: 'updated' };
    } else {
      const res = await run(
        `INSERT INTO products (code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          code,
          name,
          category,
          unit || 'Pcs',
          base_unit || 'lembar',
          purchase_unit || 'rim',
          conversion_ratio !== undefined ? Number(conversion_ratio) : 500,
          tiered_pricing ? (typeof tiered_pricing === 'string' ? tiered_pricing : JSON.stringify(tiered_pricing)) : null,
          is_discountable !== undefined ? (is_discountable ? 1 : 0) : 1,
          max_discount_percent !== undefined ? Number(max_discount_percent) : 0,
          is_outsource ? 1 : 0,
          is_metered ? 1 : 0,
          base_price || 0,
          sell_price || 0,
          stock || 0,
          supplier_id
        ]
      );
      return { id: res.lastID, status: 'created' };
    }
  },

  deductStock: async (id, qty, soldUnit = null) => {
    const product = await get('SELECT stock, purchase_unit, conversion_ratio FROM products WHERE id = ?', [id]);
    if (!product) return 0;
    
    let baseQtyToDeduct = Number(qty) || 0;
    if (soldUnit && product.purchase_unit && soldUnit.toLowerCase() === product.purchase_unit.toLowerCase()) {
      const ratio = Number(product.conversion_ratio) || 1;
      baseQtyToDeduct = baseQtyToDeduct * ratio;
    }

    const res = await run(
      `UPDATE products 
       SET stock = stock - ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ? AND is_outsource = 0`,
      [baseQtyToDeduct, id]
    );
    return res.changes;
  },

  addStock: async (id, qty, unit = null) => {
    const product = await get('SELECT stock, purchase_unit, conversion_ratio FROM products WHERE id = ?', [id]);
    if (!product) return 0;
    
    let baseQtyToAdd = Number(qty) || 0;
    if (!unit || (product.purchase_unit && unit.toLowerCase() === product.purchase_unit.toLowerCase())) {
      const ratio = Number(product.conversion_ratio) || 1;
      baseQtyToAdd = baseQtyToAdd * ratio;
    }

    const res = await run(
      `UPDATE products 
       SET stock = stock + ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [baseQtyToAdd, id]
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
