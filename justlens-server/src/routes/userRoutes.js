const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAll);
router.get('/:id', userController.getById);
router.post('/', userController.create);
router.put('/:id', userController.update);
router.put('/:id/reset-password', userController.resetPassword);
router.put('/:id/toggle-status', userController.toggleStatus);

module.exports = router;
