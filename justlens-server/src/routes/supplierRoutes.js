const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { verifyToken } = require('../middlewares/auth');

const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Excel Import/Export routes
router.get('/export-excel', supplierController.downloadExcel);
router.post('/import-excel', upload.single('file'), supplierController.importExcel);

// All supplier CRUD routes
router.get('/', supplierController.getAll);
router.get('/:id', supplierController.getById);
router.post('/', verifyToken, supplierController.create);
router.put('/:id', verifyToken, supplierController.update);
router.delete('/:id', verifyToken, supplierController.delete);

module.exports = router;
