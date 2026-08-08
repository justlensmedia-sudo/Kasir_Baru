const PurchaseModel = require('../models/purchaseModel');

const purchaseController = {
  create: async (req, res, next) => {
    try {
      const { supplier_id, total_amount, notes, items } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Item pembelian bahan baku tidak boleh kosong.'
        });
      }

      const result = await PurchaseModel.create({
        supplier_id,
        total_amount,
        notes,
        items
      });

      const purchase = await PurchaseModel.getById(result.id);

      res.status(201).json({
        success: true,
        message: 'Pembelian barang baku berhasil dicatat & stok bahan baku ditambahkan.',
        data: purchase
      });
    } catch (error) {
      next(error);
    }
  },

  getAll: async (req, res, next) => {
    try {
      const purchases = await PurchaseModel.getAll();
      res.json({ success: true, data: purchases });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const purchase = await PurchaseModel.getById(req.params.id);
      if (!purchase) {
        return res.status(404).json({ success: false, message: 'Data pembelian tidak ditemukan.' });
      }
      res.json({ success: true, data: purchase });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = purchaseController;
