const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const settingController = require('../controllers/settingController');

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, 'logo.png');
  }
});

const upload = multer({ storage });

router.get('/', settingController.getSettings);
router.post('/upload-logo', upload.single('logo'), settingController.uploadLogo);
router.post('/reset-database', settingController.resetDatabase);
router.post('/backup-git', settingController.backupGit);

module.exports = router;
