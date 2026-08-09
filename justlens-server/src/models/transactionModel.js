const { query, get, run } = require('../config/database');
const ProductModel = require('./productModel');

const TransactionModel = {
  create: async ({ customer_name, total_amount, dp_amount, payment_status, order_status, items }) => {
    // Generate transaction_no
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const transaction_no = `TRX-${dateStr}-${randomSuffix}`;

    const calcTotal = total_amount || 0;
    const calcDp = dp_amount || 0;
    const pStatus = payment_status || (calcDp >= calcTotal ? 'Lunas' : calcDp > 0 ? 'DP' : 'Belum Bayar');
    const oStatus = order_status || 'Pending';

    const txRes = await run(
      `INSERT INTO transactions (transaction_no, customer_name, total_amount, dp_amount, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [transaction_no, customer_name, calcTotal, calcDp, pStatus, oStatus]
    );

    const transaction_id = txRes.lastID;

    if (items && Array.isArray(items)) {
      for (const item of items) {
        const width = item.width || 0;
        const length = item.length || 0;
        const qty = item.qty || 1;
        const unit = item.unit || 'Pcs';
        const price = item.price || 0;
        const discount_amount = item.discount_amount || 0;
        const subtotal = item.subtotal !== undefined ? item.subtotal : (width > 0 && length > 0 ? (width * length * price * qty) - discount_amount : (price * qty) - discount_amount);
        const vendor_cost = item.vendor_cost || 0;

        await run(
          `INSERT INTO transaction_items 
           (transaction_id, product_id, finishing_option_id, width, length, qty, unit, price, discount_amount, subtotal, vendor_cost)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            transaction_id,
            item.product_id || null,
            item.finishing_option_id || null,
            width,
            length,
            qty,
            unit,
            price,
            discount_amount,
            subtotal,
            vendor_cost
          ]
        );

        // Deduct stock for non-outsource products with unit awareness
        if (item.product_id) {
          await ProductModel.deductStock(item.product_id, qty, unit);
        }
      }
    }

    return { id: transaction_id, transaction_no };
  },

  getAll: async (statusFilter = null) => {
    if (statusFilter) {
      return await query(
        'SELECT * FROM transactions WHERE order_status = ? ORDER BY id DESC',
        [statusFilter]
      );
    }
    return await query('SELECT * FROM transactions ORDER BY id DESC');
  },

  getById: async (id) => {
    const transaction = await get('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!transaction) return null;

    const items = await query(
      `SELECT ti.*, p.name as product_name, p.code as product_code, fo.name as finishing_name 
       FROM transaction_items ti
       LEFT JOIN products p ON ti.product_id = p.id
       LEFT JOIN finishing_options fo ON ti.finishing_option_id = fo.id
       WHERE ti.transaction_id = ?`,
      [id]
    );

    transaction.items = items;
    return transaction;
  },

  getOrdersByStatus: async (order_status = null) => {
    if (order_status) {
      const sql = 'SELECT * FROM transactions WHERE order_status = ? ORDER BY updated_at DESC';
      const transactions = await query(sql, [order_status]);
      return transactions;
    }
    return await query('SELECT * FROM transactions ORDER BY updated_at DESC');
  },

  updateStatus: async (id, { order_status, payment_status, dp_amount }) => {
    const existing = await get('SELECT * FROM transactions WHERE id = ?', [id]);
    if (!existing) return null;

    const newOrderStatus = order_status || existing.order_status;
    const newDpAmount = dp_amount !== undefined ? dp_amount : existing.dp_amount;
    
    let newPaymentStatus = payment_status || existing.payment_status;
    if (dp_amount !== undefined) {
      if (newDpAmount >= existing.total_amount) {
        newPaymentStatus = 'Lunas';
      } else if (newDpAmount > 0) {
        newPaymentStatus = 'DP';
      }
    }

    const res = await run(
      `UPDATE transactions 
       SET order_status = ?, payment_status = ?, dp_amount = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [newOrderStatus, newPaymentStatus, newDpAmount, id]
    );

    return res.changes;
  }
};

module.exports = TransactionModel;
