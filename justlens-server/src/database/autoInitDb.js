const bcrypt = require('bcryptjs');
const { exec, query, run, get } = require('../config/database');

/**
 * Auto Initialize Database (Migration + Seed)
 * Called automatically when server starts up.
 */
const autoInitDb = async () => {
  try {
    // 1. Run DDL Schema Migrations
    const schemaSql = `
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        role TEXT DEFAULT 'kasir',
        is_active INTEGER DEFAULT 1,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS suppliers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT DEFAULT 'Pcs',
        base_price REAL DEFAULT 0,
        stock REAL DEFAULT 0,
        supplier_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS material_purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_no TEXT UNIQUE NOT NULL,
        supplier_id INTEGER,
        total_amount REAL DEFAULT 0,
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS material_purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        purchase_id INTEGER NOT NULL,
        material_id INTEGER,
        qty REAL DEFAULT 1,
        unit_price REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (purchase_id) REFERENCES material_purchases(id) ON DELETE CASCADE,
        FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS vendors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        service_type TEXT NOT NULL,
        base_cost_per_m2 REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        unit TEXT DEFAULT 'Pcs',
        base_unit TEXT DEFAULT 'lembar',
        purchase_unit TEXT DEFAULT 'rim',
        conversion_ratio REAL DEFAULT 500,
        tiered_pricing TEXT DEFAULT NULL,
        is_discountable INTEGER DEFAULT 1,
        max_discount_percent REAL DEFAULT 0,
        is_outsource INTEGER DEFAULT 0,
        is_metered INTEGER DEFAULT 0,
        base_price REAL DEFAULT 0,
        sell_price REAL DEFAULT 0,
        stock REAL DEFAULT 0,
        supplier_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE RESTRICT
      );

      CREATE TABLE IF NOT EXISTS finishing_options (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        price REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_no TEXT UNIQUE NOT NULL,
        customer_name TEXT NOT NULL,
        total_amount REAL DEFAULT 0,
        dp_amount REAL DEFAULT 0,
        payment_status TEXT DEFAULT 'Belum Bayar',
        order_status TEXT DEFAULT 'Pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS transaction_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        product_id INTEGER,
        finishing_option_id INTEGER,
        width REAL DEFAULT 0,
        length REAL DEFAULT 0,
        qty INTEGER DEFAULT 1,
        unit TEXT DEFAULT 'Pcs',
        price REAL DEFAULT 0,
        discount_amount REAL DEFAULT 0,
        subtotal REAL DEFAULT 0,
        vendor_cost REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
        FOREIGN KEY (finishing_option_id) REFERENCES finishing_options(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        user_name TEXT NOT NULL,
        activity TEXT NOT NULL,
        details TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS ledger_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS journal_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        entry_no TEXT UNIQUE NOT NULL,
        account_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL DEFAULT 0,
        payment_method TEXT DEFAULT 'Tunai',
        category TEXT,
        description TEXT,
        reference_no TEXT,
        created_by TEXT DEFAULT 'Admin',
        entry_date DATE DEFAULT (CURRENT_DATE),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES ledger_accounts(id) ON DELETE RESTRICT
      );
    `;

    await exec(schemaSql);

    // Auto seed default ledger accounts if none exist
    const accountCount = await query('SELECT COUNT(*) as count FROM ledger_accounts');
    if (accountCount[0].count === 0) {
      const initialAccounts = [
        ['101', 'Kas Tunai Toko', 'Aset', 'Kas tunai fisik di laci kasir toko'],
        ['102', 'Bank / QRIS Toko', 'Aset', 'Saldo penerimaan digital QRIS & transfer bank'],
        ['401', 'Pendapatan Penjualan Kasir', 'Pemasukan', 'Pemasukan dari transaksi penjualan kasir POS'],
        ['402', 'Pendapatan Lain-lain', 'Pemasukan', 'Pemasukan kas di luar penjualan utama'],
        ['501', 'Beban Gaji Karyawan', 'Pengeluaran', 'Pengeluaran gaji dan insentif staf toko'],
        ['502', 'Beban Listrik, Air & Internet', 'Pengeluaran', 'Tagihan rutin bulanan utilitas toko'],
        ['503', 'Beban Perlengkapan & ATK Toko', 'Pengeluaran', 'Pembelian kertas, pita printer, & kebutuhan toko'],
        ['504', 'Beban Sewa & Operasional', 'Pengeluaran', 'Biaya sewa gedung & operasional rutin'],
        ['505', 'Beban Vendor Outsource', 'Pengeluaran', 'Pembayaran modal spanduk/banner vendor luar']
      ];
      for (const acc of initialAccounts) {
        await run('INSERT INTO ledger_accounts (code, name, type, description) VALUES (?, ?, ?, ?)', acc);
      }
    }

    // Auto seed a default supplier if none exists so mandatory FK checks pass for existing data
    const supplierCount = await query('SELECT COUNT(*) as count FROM suppliers');
    if (supplierCount[0].count === 0) {
      await run('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [
        'Supplier Utama Toko',
        '08123456789',
        'Jl. Utama Toko No. 1'
      ]);
    }
    const defaultSupplier = await get('SELECT id FROM suppliers LIMIT 1');
    const defaultSupplierId = defaultSupplier ? defaultSupplier.id : 1;

    try {
      await exec("ALTER TABLE products ADD COLUMN unit TEXT DEFAULT 'Pcs'");
    } catch (e) {}
    try {
      await exec(`ALTER TABLE products ADD COLUMN supplier_id INTEGER DEFAULT ${defaultSupplierId} REFERENCES suppliers(id) ON DELETE RESTRICT`);
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN base_unit TEXT DEFAULT 'lembar'");
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN purchase_unit TEXT DEFAULT 'rim'");
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN conversion_ratio REAL DEFAULT 500");
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN tiered_pricing TEXT DEFAULT NULL");
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN is_discountable INTEGER DEFAULT 1");
    } catch (e) {}
    try {
      await exec("ALTER TABLE products ADD COLUMN max_discount_percent REAL DEFAULT 0");
    } catch (e) {}
    try {
      await exec("ALTER TABLE transaction_items ADD COLUMN unit TEXT DEFAULT 'Pcs'");
    } catch (e) {}
    try {
      await exec("ALTER TABLE transaction_items ADD COLUMN discount_amount REAL DEFAULT 0");
    } catch (e) {}
    try {
      await exec("ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1");
    } catch (e) {}
    console.log('✓ Skema Database SQLite siap/terverifikasi.');

    // 2. Auto Seed Initial User Accounts ONLY if empty
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
      console.log('⚡ Mengisi akun pengguna awal (Admin & Kasir)...');
      const adminPassword = await bcrypt.hash('admin123', 10);
      const kasirPassword = await bcrypt.hash('kasir123', 10);

      await run(
        'INSERT INTO users (name, username, role, password_hash) VALUES (?, ?, ?, ?)',
        ['Administrator', 'admin', 'admin', adminPassword]
      );
      await run(
        'INSERT INTO users (name, username, role, password_hash) VALUES (?, ?, ?, ?)',
        ['Kasir 1', 'kasir', 'kasir', kasirPassword]
      );
    }
  } catch (err) {
    console.error('Error saat inisialisasi database otomatis:', err);
  }
};

module.exports = autoInitDb;
