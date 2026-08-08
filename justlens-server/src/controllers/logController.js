const LogModel = require('../models/logModel');

const logController = {
  getAll: async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit || 100, 10);
      const logs = await LogModel.getAll(limit);
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { user_id, user_name, activity, details } = req.body;

      if (!activity) {
        return res.status(400).json({ success: false, message: 'Aktivitas wajib diisi.' });
      }

      const id = await LogModel.create({
        user_id,
        user_name: user_name || 'System/Kasir',
        activity,
        details
      });

      res.status(201).json({ success: true, message: 'Log aktivitas berhasil dicatat.', data: { id } });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = logController;
