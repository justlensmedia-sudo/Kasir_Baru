const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { verifyToken } = require('../middlewares/auth');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

// Endpoint khusus sync Kasir
router.get('/sync', productController.sync);
// Endpoint alert stok menipis
router.get('/low-stock', productController.getLowStock);

// Endpoint Excel Import/Export
router.get('/template-excel', productController.downloadTemplateExcel);
router.post('/import-excel', upload.single('file'), productController.importExcel);

// Standard CRUD
router.get('/', productController.getAll);
router.get('/:id', productController.getById);
router.post('/', verifyToken, productController.create);
router.put('/:id', verifyToken, productController.update);
router.delete('/:id', verifyToken, productController.delete);

module.exports = router;
