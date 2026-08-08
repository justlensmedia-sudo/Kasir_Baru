const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

// Transaction endpoints
router.post('/create', transactionController.create);
router.get('/', transactionController.getAll);
router.get('/:id', transactionController.getById);

module.exports = router;
