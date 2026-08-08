const { query, get, run } = require('../config/database');
const MaterialModel = require('./materialModel');

const PurchaseModel = {
  create: async ({ supplier_id, total_amount, notes, items }) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const purchase_no = `PO-${dateStr}-${randomSuffix}`;

    const res = await run(
      `INSERT INTO material_purchases (purchase_no, supplier_id, total_amount, notes)
       VALUES (?, ?, ?, ?)`,
      [purchase_no, supplier_id || null, total_amount || 0, notes || null]
    );

    const purchase_id = res.lastID;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const qty = item.qty || 1;
        const unit_price = item.unit_price || 0;
        const subtotal = item.subtotal || qty * unit_price;

        await run(
          `INSERT INTO material_purchase_items (purchase_id, material_id, qty, unit_price, subtotal)
           VALUES (?, ?, ?, ?, ?)`,
          [purchase_id, item.material_id || null, qty, unit_price, subtotal]
        );

        // Auto-add stock to materials
        if (item.material_id) {
          await MaterialModel.addStock(item.material_id, qty);
        }
      }
    }

    return { id: purchase_id, purchase_no };
  },

  getAll: async () => {
    return await query(
      `SELECT mp.*, s.name as supplier_name 
       FROM material_purchases mp 
       LEFT JOIN suppliers s ON mp.supplier_id = s.id 
       ORDER BY mp.id DESC`
    );
  },

  getById: async (id) => {
    const purchase = await get(
      `SELECT mp.*, s.name as supplier_name, s.phone as supplier_phone 
       FROM material_purchases mp 
       LEFT JOIN suppliers s ON mp.supplier_id = s.id 
       WHERE mp.id = ?`,
      [id]
    );

    if (!purchase) return null;

    const items = await query(
      `SELECT mpi.*, m.name as material_name, m.code as material_code, m.unit as material_unit 
       FROM material_purchase_items mpi
       LEFT JOIN materials m ON mpi.material_id = m.id
       WHERE mpi.purchase_id = ?`,
      [id]
    );

    purchase.items = items;
    return purchase;
  }
};

module.exports = PurchaseModel;
