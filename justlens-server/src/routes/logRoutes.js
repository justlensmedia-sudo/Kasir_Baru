const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');

router.get('/', logController.getAll);
router.post('/', logController.create);

module.exports = router;
