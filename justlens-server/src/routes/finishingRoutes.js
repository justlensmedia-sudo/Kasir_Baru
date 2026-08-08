const express = require('express');
const router = express.Router();
const finishingController = require('../controllers/finishingController');
const { verifyToken } = require('../middlewares/auth');

router.get('/', finishingController.getAll);
router.get('/:id', finishingController.getById);
router.post('/', verifyToken, finishingController.create);
router.put('/:id', verifyToken, finishingController.update);
router.delete('/:id', verifyToken, finishingController.delete);

module.exports = router;
