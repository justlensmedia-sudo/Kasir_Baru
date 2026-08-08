const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { query, get, run } = require('../config/database');
const { resetDatabase } = require('../database/clear-dummy');

const isPkg = typeof process.pkg !== 'undefined';

const settingController = {
  getSettings: async (req, res, next) => {
    try {
      const rows = await query('SELECT key, value FROM settings');
      const settings = {};
      rows.forEach(r => {
        settings[r.key] = r.value;
      });

      // Default logo path check
      const logoPath = isPkg
        ? path.join(path.dirname(process.execPath), 'uploads/logo.png')
        : path.join(__dirname, '../../public/uploads/logo.png');

      const logoExists = fs.existsSync(logoPath);

      if (!settings.logo_url && logoExists) {
        settings.logo_url = '/uploads/logo.png';
      }

      res.json({
        success: true,
        data: {
          logo_url: settings.logo_url || null,
          shop_name: settings.shop_name || 'Justlens Percetakan',
          shop_phone: settings.shop_phone || '0812-3456-7890',
          shop_address: settings.shop_address || 'Jl. Raya Grafika No. 88, Digital Printing',
          updated_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  },

  uploadLogo: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Harap pilih file logo (PNG/JPG).' });
      }

      const logoUrl = `/uploads/logo.png?t=${Date.now()}`;
      await run(
        `INSERT INTO settings (key, value, updated_at) VALUES ('logo_url', ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [logoUrl]
      );

      res.json({
        success: true,
        message: 'Logo usaha berhasil diunggah & diperbarui.',
        data: { logo_url: logoUrl }
      });
    } catch (error) {
      next(error);
    }
  },

  resetDatabase: async (req, res, next) => {
    try {
      await resetDatabase();
      res.json({
        success: true,
        message: 'Seluruh data sisa transaksi, stok, supplier, dan vendor outsource berhasil dibersihkan! (Akun pengguna admin & kasir dipertahankan).'
      });
    } catch (error) {
      next(error);
    }
  },

  backupGit: async (req, res, next) => {
    try {
      const rootRepoDir = isPkg ? path.dirname(process.execPath) : path.resolve(__dirname, '../../../');
      const commitMessage = `Auto Backup System & Database: ${new Date().toLocaleString('id-ID')}`;

      console.log(`📡 Memulai proses Git Backup di: ${rootRepoDir}`);

      const gitCmd = `git add . && git commit -m "${commitMessage}" && git push origin main`;

      exec(gitCmd, { cwd: rootRepoDir }, (error, stdout, stderr) => {
        if (error) {
          console.warn('⚠️ Git push output:', stderr || error.message);
          if ((stdout + stderr).includes('nothing to commit')) {
            return res.json({
              success: true,
              message: 'Tidak ada perubahan baru untuk dibackup. Repositori GitHub sudah sinkron.',
              details: stdout || stderr
            });
          }
          return res.status(500).json({
            success: false,
            message: `Gagal melakukan push ke GitHub: ${stderr || error.message}`,
            details: stderr || error.message
          });
        }

        console.log('✓ Backup Git ke GitHub berhasil:', stdout);
        return res.json({
          success: true,
          message: 'Berhasil melakukan backup source code & database ke repositori GitHub!',
          details: stdout
        });
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = settingController;
