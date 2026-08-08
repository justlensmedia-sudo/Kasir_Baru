const SupplierModel = require('../models/supplierModel');

const supplierController = {
  getAll: async (req, res, next) => {
    try {
      const suppliers = await SupplierModel.getAll();
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const supplier = await SupplierModel.getById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, phone, address } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi.' });
      }

      const id = await SupplierModel.create({ name, phone, address });
      const newSupplier = await SupplierModel.getById(id);
      res.status(201).json({ success: true, message: 'Supplier berhasil ditambahkan.', data: newSupplier });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, phone, address } = req.body;
      const { id } = req.params;

      const existing = await SupplierModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }

      await SupplierModel.update(id, { name, phone, address });
      const updatedSupplier = await SupplierModel.getById(id);
      res.json({ success: true, message: 'Supplier berhasil diperbarui.', data: updatedSupplier });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await SupplierModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }

      await SupplierModel.delete(id);
      res.json({ success: true, message: 'Supplier berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = supplierController;
