const LedgerModel = require('../models/ledgerModel');

const ledgerController = {
  // GET /api/ledger/accounts
  getAccounts: async (req, res) => {
    try {
      const accounts = await LedgerModel.getAllAccounts();
      res.json({ success: true, data: accounts });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/ledger/accounts
  createAccount: async (req, res) => {
    try {
      const { code, name, type, description } = req.body;
      if (!code || !name || !type) {
        return res.status(400).json({ success: false, message: 'Kode, nama akun, dan tipe wajib diisi.' });
      }
      const account = await LedgerModel.createAccount({ code, name, type, description });
      res.status(201).json({ success: true, message: 'Akun pembukuan baru berhasil ditambahkan.', data: account });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /api/ledger/entries
  getEntries: async (req, res) => {
    try {
      const { account_id, type, payment_method, start_date, end_date } = req.query;
      const entries = await LedgerModel.getEntries({ account_id, type, payment_method, start_date, end_date });
      res.json({ success: true, data: entries });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // POST /api/ledger/entries
  createEntry: async (req, res) => {
    try {
      const { account_id, type, amount, payment_method, category, description, reference_no, entry_date } = req.body;
      if (!account_id || !type || amount === undefined || amount === null) {
        return res.status(400).json({ success: false, message: 'Akun kas, jenis transaksi (Kas Masuk/Keluar), dan nominal wajib diisi.' });
      }

      const entry = await LedgerModel.createEntry({
        account_id,
        type,
        amount: Number(amount) || 0,
        payment_method: payment_method || 'Tunai',
        category: category || 'Operasional',
        description: description || '',
        reference_no: reference_no || '',
        created_by: req.user ? req.user.name : 'Admin',
        entry_date
      });

      res.status(201).json({ success: true, message: `Transaksi ${type} berhasil dicatat.`, data: entry });
    } catch (err) {
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // DELETE /api/ledger/entries/:id
  deleteEntry: async (req, res) => {
    try {
      const { id } = req.params;
      const success = await LedgerModel.deleteEntry(id);
      if (!success) {
        return res.status(404).json({ success: false, message: 'Transaksi kas tidak ditemukan.' });
      }
      res.json({ success: true, message: 'Transaksi kas berhasil dihapus.' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /api/ledger/reports/profit-loss
  getProfitLossReport: async (req, res) => {
    try {
      const { start_date, end_date } = req.query;
      const report = await LedgerModel.getProfitLossReport(start_date, end_date);
      res.json({ success: true, data: report });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

module.exports = ledgerController;
