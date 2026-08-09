const { exec } = require('../config/database');

const selectiveResetDatabase = async ({
  reset_transactions = false,
  reset_journals = false,
  reset_products = false,
  reset_suppliers_vendors = false,
  reset_logs = false
} = {}) => {
  console.log('Memulai pembersihan database selektif...');

  const tablesToDelete = [];
  const seqsToReset = [];

  if (reset_transactions) {
    tablesToDelete.push('transaction_items', 'transactions', 'material_purchase_items', 'material_purchases');
    seqsToReset.push('transaction_items', 'transactions', 'material_purchase_items', 'material_purchases');
  }

  if (reset_journals) {
    tablesToDelete.push('journal_entries');
    seqsToReset.push('journal_entries');
  }

  if (reset_products) {
    tablesToDelete.push('products', 'materials', 'finishing_options');
    seqsToReset.push('products', 'materials', 'finishing_options');
  }

  if (reset_suppliers_vendors) {
    tablesToDelete.push('suppliers', 'vendors');
    seqsToReset.push('suppliers', 'vendors');
  }

  if (reset_logs) {
    tablesToDelete.push('activity_logs');
    seqsToReset.push('activity_logs');
  }

  // PROTECT users table unconditionally: filter out 'users' table
  const safeTables = tablesToDelete.filter(t => t !== 'users');
  const safeSeqs = seqsToReset.filter(s => s !== 'users');

  if (safeTables.length === 0) {
    throw new Error('Tidak ada kategori data yang dipilih untuk dibersihkan.');
  }

  const deleteQueries = safeTables.map(table => `DELETE FROM ${table};`).join('\n');
  const seqListStr = safeSeqs.map(s => `'${s}'`).join(', ');

  const sql = `
    PRAGMA foreign_keys = OFF;

    ${deleteQueries}

    ${safeSeqs.length > 0 ? `DELETE FROM sqlite_sequence WHERE name IN (${seqListStr});` : ''}

    PRAGMA foreign_keys = ON;
  `;

  await exec(sql);
  console.log(`✓ Database selektif berhasil dibersihkan (${safeTables.join(', ')}). Akun pengguna (users) dipertahankan.`);
  return safeTables;
};

const resetDatabase = async () => {
  return await selectiveResetDatabase({
    reset_transactions: true,
    reset_journals: true,
    reset_products: true,
    reset_suppliers_vendors: true,
    reset_logs: true
  });
};

if (require.main === module) {
  resetDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Gagal membersihkan database:', err);
      process.exit(1);
    });
}

module.exports = { resetDatabase, selectiveResetDatabase };


