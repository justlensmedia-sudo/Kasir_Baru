const ReportModel = require('../models/reportModel');

const reportController = {
  getSales: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await ReportModel.getSalesReport(startDate, endDate);
      res.json({
        success: true,
        message: 'Laporan Penjualan berhasil didapatkan.',
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  getVendorMargin: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await ReportModel.getVendorMarginReport(startDate, endDate);
      res.json({
        success: true,
        message: 'Laporan Margin Vendor Outsource berhasil didapatkan.',
        data: report
      });
    } catch (error) {
      next(error);
    }
  },

  getProfitLoss: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const report = await ReportModel.getProfitLoss(startDate, endDate);
      res.json({
        success: true,
        message: 'Laporan Keuangan & Laba Kotor berhasil didapatkan.',
        data: report
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reportController;
