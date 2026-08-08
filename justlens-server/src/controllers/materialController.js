const MaterialModel = require('../models/materialModel');

const materialController = {
  getAll: async (req, res, next) => {
    try {
      const { category } = req.query;
      const materials = await MaterialModel.getAll(category);
      res.json({ success: true, data: materials });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const material = await MaterialModel.getById(req.params.id);
      if (!material) {
        return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
      }
      res.json({ success: true, data: material });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { code, name, category, unit, base_price, stock, supplier_id } = req.body;

      if (!code || !name || !category) {
        return res.status(400).json({ success: false, message: 'Kode, nama, dan kategori bahan baku wajib diisi.' });
      }

      const existing = await MaterialModel.getByCode(code);
      if (existing) {
        return res.status(400).json({ success: false, message: `Kode bahan baku '${code}' sudah ada.` });
      }

      const id = await MaterialModel.create({
        code,
        name,
        category,
        unit,
        base_price,
        stock,
        supplier_id
      });

      const newMaterial = await MaterialModel.getById(id);
      res.status(201).json({ success: true, message: 'Bahan baku berhasil ditambahkan.', data: newMaterial });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { code, name, category, unit, base_price, stock, supplier_id } = req.body;

      const existing = await MaterialModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
      }

      await MaterialModel.update(id, {
        code: code || existing.code,
        name: name || existing.name,
        category: category || existing.category,
        unit: unit || existing.unit,
        base_price: base_price !== undefined ? base_price : existing.base_price,
        stock: stock !== undefined ? stock : existing.stock,
        supplier_id: supplier_id !== undefined ? supplier_id : existing.supplier_id
      });

      const updatedMaterial = await MaterialModel.getById(id);
      res.json({ success: true, message: 'Bahan baku berhasil diperbarui.', data: updatedMaterial });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await MaterialModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Bahan baku tidak ditemukan.' });
      }

      await MaterialModel.delete(id);
      res.json({ success: true, message: 'Bahan baku berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = materialController;
