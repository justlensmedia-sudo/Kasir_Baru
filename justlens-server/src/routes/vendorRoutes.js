const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendorController');
const { verifyToken } = require('../middlewares/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Excel Import/Export routes
router.get('/export-excel', vendorController.downloadExcel);
router.post('/import-excel', upload.single('file'), vendorController.importExcel);

router.get('/', vendorController.getAll);
router.get('/:id', vendorController.getById);
router.post('/', verifyToken, vendorController.create);
router.put('/:id', verifyToken, vendorController.update);
router.delete('/:id', verifyToken, vendorController.delete);

module.exports = router;
