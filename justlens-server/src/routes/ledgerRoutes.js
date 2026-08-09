const express = require('express');
const router = express.Router();
const ledgerController = require('../controllers/ledgerController');

// Account management
router.get('/accounts', ledgerController.getAccounts);
router.post('/accounts', ledgerController.createAccount);

// Journal entries (Kas Masuk & Kas Keluar)
router.get('/entries', ledgerController.getEntries);
router.post('/entries', ledgerController.createEntry);
router.delete('/entries/:id', ledgerController.deleteEntry);

// Reports
router.get('/reports/profit-loss', ledgerController.getProfitLossReport);

module.exports = router;
