const TransactionModel = require('../models/transactionModel');

const transactionController = {
  create: async (req, res, next) => {
    try {
      const { customer_name, total_amount, dp_amount, payment_status, order_status, items } = req.body;

      if (!customer_name) {
        return res.status(400).json({
          success: false,
          message: 'Nama pelanggan wajib diisi.'
        });
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Item transaksi tidak boleh kosong.'
        });
      }

      const result = await TransactionModel.create({
        customer_name,
        total_amount,
        dp_amount,
        payment_status,
        order_status,
        items
      });

      const transaction = await TransactionModel.getById(result.id);

      res.status(201).json({
        success: true,
        message: 'Transaksi berhasil dibuat & pemotongan stok diproses.',
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const { order_status } = req.query;
      const transactions = await TransactionModel.getAll(order_status);
      res.json({ success: true, data: transactions });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const transaction = await TransactionModel.getById(req.params.id);
      if (!transaction) {
        return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
      }
      res.json({ success: true, data: transaction });
    } catch (error) {
      next(error);
    }
  },

  getOrdersStatus: async (req, res, next) => {
    try {
      const { status } = req.query;
      const orders = await TransactionModel.getOrdersByStatus(status);
      res.json({
        success: true,
        message: status ? `Order dengan status '${status}'` : 'Semua status order pesanan.',
        data: orders
      });
    } catch (error) {
      next(error);
    }
  },

  updateOrderStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { order_status, payment_status, dp_amount } = req.body;

      const existing = await TransactionModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Transaksi/Order tidak ditemukan.' });
      }

      await TransactionModel.updateStatus(id, {
        order_status,
        payment_status,
        dp_amount
      });

      const updatedTransaction = await TransactionModel.getById(id);

      res.json({
        success: true,
        message: 'Status order & pembayaran berhasil diperbarui.',
        data: updatedTransaction
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = transactionController;
