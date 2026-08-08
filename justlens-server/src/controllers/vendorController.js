const VendorModel = require('../models/vendorModel');

const vendorController = {
  getAll: async (req, res, next) => {
    try {
      const vendors = await VendorModel.getAll();
      res.json({ success: true, data: vendors });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const vendor = await VendorModel.getById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }
      res.json({ success: true, data: vendor });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, service_type, base_cost_per_m2 } = req.body;
      if (!name || !service_type) {
        return res.status(400).json({ success: false, message: 'Nama vendor dan jenis layanan wajib diisi.' });
      }

      const id = await VendorModel.create({ name, service_type, base_cost_per_m2 });
      const newVendor = await VendorModel.getById(id);
      res.status(201).json({ success: true, message: 'Vendor berhasil ditambahkan.', data: newVendor });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, service_type, base_cost_per_m2 } = req.body;
      const { id } = req.params;

      const existing = await VendorModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }

      await VendorModel.update(id, { name, service_type, base_cost_per_m2 });
      const updatedVendor = await VendorModel.getById(id);
      res.json({ success: true, message: 'Vendor berhasil diperbarui.', data: updatedVendor });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await VendorModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }

      await VendorModel.delete(id);
      res.json({ success: true, message: 'Vendor berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = vendorController;
