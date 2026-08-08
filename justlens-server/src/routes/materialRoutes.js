const express = require('express');
const router = express.Router();
const materialController = require('../controllers/materialController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', materialController.getAll);
router.get('/:id', materialController.getById);
router.post('/', verifyToken, materialController.create);
router.put('/:id', verifyToken, materialController.update);
router.delete('/:id', verifyToken, materialController.delete);

module.exports = router;
