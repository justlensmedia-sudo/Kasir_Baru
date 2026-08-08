const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getById);
router.post('/', verifyToken, vendorController.create);
router.put('/:id', verifyToken, vendorController.update);
router.delete('/:id', verifyToken, vendorController.delete);

module.exports = router;
