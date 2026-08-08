const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/sales', reportController.getSales);
router.get('/vendor-margin', reportController.getVendorMargin);
router.get('/profit-loss', reportController.getProfitLoss);
router.get('/daily-shift', reportController.getDailyShiftReport);

module.exports = router;
