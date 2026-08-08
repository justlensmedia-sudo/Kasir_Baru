const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.get('/status', transactionController.getOrdersStatus);
router.patch('/:id/status', transactionController.updateOrderStatus);

module.exports = router;
