const bcrypt = require('bcryptjs');
const { query, get, run } = require('../config/database');

const userController = {
  getAll: async (req, res, next) => {
    try {
      const users = await query(
        'SELECT id, name, username, role, COALESCE(is_active, 1) AS is_active, created_at FROM users ORDER BY id DESC'
      );
      res.json({ success: true, data: users });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const user = await get(
        'SELECT id, name, username, role, COALESCE(is_active, 1) AS is_active, created_at FROM users WHERE id = ?',
        [req.params.id]
      );
      if (!user) {
        return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
      }
      res.json({ success: true, data: user });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, username, role, password, is_active } = req.body;

      if (!name || !username || !password) {
        return res.status(400).json({ success: false, message: 'Nama lengkap, username, dan password wajib diisi.' });
      }

      const existing = await get('SELECT id FROM users WHERE username = ?', [username]);
      if (existing) {
        return res.status(400).json({ success: false, message: `Username '${username}' sudah digunakan.` });
      }

      const password_hash = await bcrypt.hash(password, 10);
      const result = await run(
        'INSERT INTO users (name, username, role, is_active, password_hash) VALUES (?, ?, ?, ?, ?)',
        [name, username, role || 'kasir', is_active !== undefined ? is_active : 1, password_hash]
      );

      const newUser = await get(
        'SELECT id, name, username, role, COALESCE(is_active, 1) AS is_active, created_at FROM users WHERE id = ?',
        [result.lastID]
      );
      res.status(201).json({ success: true, message: 'Akun kasir/user berhasil ditambahkan.', data: newUser });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, username, role, is_active } = req.body;

      const existing = await get('SELECT id, username FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
      }

      if (username && username !== existing.username) {
        const checkUsername = await get('SELECT id FROM users WHERE username = ?', [username]);
        if (checkUsername) {
          return res.status(400).json({ success: false, message: `Username '${username}' sudah digunakan.` });
        }
      }

      await run(
        `UPDATE users 
         SET name = ?, username = ?, role = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP 
         WHERE id = ?`,
        [name, username, role || 'kasir', is_active !== undefined ? is_active : 1, id]
      );

      const updatedUser = await get(
        'SELECT id, name, username, role, COALESCE(is_active, 1) AS is_active, created_at FROM users WHERE id = ?',
        [id]
      );
      res.json({ success: true, message: 'Akun pengguna berhasil diperbarui.', data: updatedUser });
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { password } = req.body;

      if (!password || password.length < 4) {
        return res.status(400).json({ success: false, message: 'Password baru minimal 4 karakter.' });
      }

      const existing = await get('SELECT id FROM users WHERE id = ?', [id]);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
      }

      const password_hash = await bcrypt.hash(password, 10);
      await run('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [password_hash, id]);

      res.json({ success: true, message: 'Password akun berhasil diperbarui.' });
    } catch (error) {
      next(error);
    }
  },

  toggleStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const user = await get('SELECT id, COALESCE(is_active, 1) AS is_active FROM users WHERE id = ?', [id]);
      if (!user) {
        return res.status(404).json({ success: false, message: 'Akun pengguna tidak ditemukan.' });
      }

      const newStatus = user.is_active === 1 ? 0 : 1;
      await run('UPDATE users SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStatus, id]);

      res.json({
        success: true,
        message: `Status akun berhasil diubah menjadi ${newStatus === 1 ? 'Aktif' : 'Nonaktif'}.`,
        data: { id, is_active: newStatus }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = userController;
