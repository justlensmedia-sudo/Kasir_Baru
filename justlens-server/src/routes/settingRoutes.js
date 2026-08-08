const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const settingController = require('../controllers/settingController');

const isPkg = typeof process.pkg !== 'undefined';
const baseUploadsDir = isPkg
  ? path.join(path.dirname(process.execPath), 'uploads')
  : path.join(__dirname, '../../public/uploads');

if (!fs.existsSync(baseUploadsDir)) {
  try {
    fs.mkdirSync(baseUploadsDir, { recursive: true });
  } catch (e) {
    console.error('Failed to create uploads directory:', e.message);
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(baseUploadsDir)) {
      try { fs.mkdirSync(baseUploadsDir, { recursive: true }); } catch (e) {}
    }
    cb(null, baseUploadsDir);
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
