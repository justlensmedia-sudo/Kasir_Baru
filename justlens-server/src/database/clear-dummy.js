const { exec } = require('../config/database');

const resetDatabase = async () => {
  console.log('Memulai pembersihan/pengosongan data sisa database...');
  const sql = `
    PRAGMA foreign_keys = OFF;

    DELETE FROM transaction_items;
    DELETE FROM transactions;
    DELETE FROM material_purchase_items;
    DELETE FROM material_purchases;
    DELETE FROM products;
    DELETE FROM materials;
    DELETE FROM finishing_options;
    DELETE FROM vendors;
    DELETE FROM suppliers;

    DELETE FROM sqlite_sequence WHERE name IN (
      'transaction_items',
      'transactions',
      'material_purchase_items',
      'material_purchases',
      'products',
      'materials',
      'finishing_options',
      'vendors',
      'suppliers'
    );

    PRAGMA foreign_keys = ON;
  `;

  await exec(sql);
  console.log('✓ Database berhasil dibersihkan (Akun Pengguna admin/kasir dipertahankan).');
};

if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Gagal membersihkan database:', err);
      process.exit(1);
    });
}

module.exports = { resetDatabase };

