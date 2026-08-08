const FinishingModel = require('../models/finishingModel');

const finishingController = {
  getAll: async (req, res, next) => {
    try {
      const options = await FinishingModel.getAll();
      res.json({ success: true, data: options });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const option = await FinishingModel.getById(req.params.id);
      if (!option) {
        return res.status(404).json({ success: false, message: 'Opsi finishing tidak ditemukan.' });
      }
      res.json({ success: true, data: option });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, price } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Nama opsi finishing wajib diisi.' });
      }

      const id = await FinishingModel.create({ name, price });
      const newOption = await FinishingModel.getById(id);
      res.status(201).json({ success: true, message: 'Opsi finishing berhasil ditambahkan.', data: newOption });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, price } = req.body;
      const { id } = req.params;

      const existing = await FinishingModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Opsi finishing tidak ditemukan.' });
      }

      await FinishingModel.update(id, { name, price });
      const updatedOption = await FinishingModel.getById(id);
      res.json({ success: true, message: 'Opsi finishing berhasil diperbarui.', data: updatedOption });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await FinishingModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Opsi finishing tidak ditemukan.' });
      }

      await FinishingModel.delete(id);
      res.json({ success: true, message: 'Opsi finishing berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = finishingController;
