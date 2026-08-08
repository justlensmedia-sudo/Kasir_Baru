const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken } = require('../middlewares/auth');

// All supplier routes can be accessed with or without auth token verification (protected where needed)
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', verifyToken, supplierController.create);
router.put('/:id', verifyToken, supplierController.update);
router.delete('/:id', verifyToken, supplierController.delete);

module.exports = router;
