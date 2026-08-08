const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

const authController = {
  login: async (req, res, next) => {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: 'Username dan password wajib diisi.'
        });
      }

      const user = await UserModel.findByUsername(username);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah.'
        });
      }

      if (user.is_active === 0) {
        return res.status(403).json({
          success: false,
          message: 'Akun Anda dinonaktifkan oleh Admin.'
        });
      }

      const isMatch = await bcrypt.compare(password, user.password_hash);
      if (!isMatch) {
        return res.status(401).json({
          success: false,
          message: 'Username atau password salah.'
        });
      }

      const LogModel = require('../models/logModel');
      await LogModel.create({
        user_id: user.id,
        user_name: user.name,
        activity: 'Login Aplikasi',
        details: `Kasir/Admin '${user.name}' (${user.role}) berhasil login.`
      });

      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role, name: user.name },
        process.env.JWT_SECRET || 'justlens_super_secret_jwt_key_2026',
        { expiresIn: '24h' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            username: user.username,
            role: user.role
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;
