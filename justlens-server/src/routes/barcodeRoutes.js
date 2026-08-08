const express = require('express');
const router = express.Router();
const barcodeController = require('../controllers/barcodeController');

router.get('/generate', barcodeController.generatePng);
router.get('/export-word', barcodeController.exportWord);
router.post('/export-word', barcodeController.exportWord);

module.exports = router;
