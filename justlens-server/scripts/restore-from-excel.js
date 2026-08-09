const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const autoInitDb = require('../src/database/autoInitDb');
const { query, run, get } = require('../src/config/database');

const restoreFromExcel = async () => {
  console.log('==================================================');
  console.log('🔄 Memulai Restorasi Presisi Data Master dari Backup Excel...');
  console.log('==================================================');

  // 1. Ensure DB Schema & Tables are initialized
  await autoInitDb();

  // Path file Excel spesifik
  const excelPath = path.resolve('D:/system justlens/v6/justlens-system/backup/Data_Master_Barang_Justlens.xlsx');

  if (!fs.existsSync(excelPath)) {
    throw new Error(`File Excel tidak ditemukan di path: ${excelPath}`);
  }

  console.log(`📄 Menggunakan file Excel: ${excelPath}`);

  // 2. Ensure default supplier exists
  let supplier = await get('SELECT id FROM suppliers LIMIT 1');
  if (!supplier) {
    const res = await run(
      'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
      ['Supplier Utama Toko', '08123456789', 'Jl. Utama Toko No. 1']
    );
    supplier = { id: res.lastID };
  }
  const defaultSupplierId = supplier.id;

  // 3. Read Excel workbook
  const wb = XLSX.readFile(excelPath);
  const sheetName = wb.SheetNames.includes('Master_Barang') ? 'Master_Barang' : wb.SheetNames[0];
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);

  console.log(`📦 Ditemukan ${rows.length} baris data barang pada sheet '${sheetName}'. Restorasi dimulai...`);

  let insertedCount = 0;
  let updatedCount = 0;

  for (const row of rows) {
    const name = row['Nama_Barang'] || row['Nama'] || row['nama_barang'];
    if (!name) continue;

    const code = String(row['Kode_Barcode'] || row['Kode'] || row['kode_barcode'] || `PRD-${Date.now()}`).trim();
    const category = String(row['Kategori'] || row['kategori'] || 'Umum').trim();
    const unit = String(row['Satuan'] || row['satuan'] || 'Pcs').trim();
    const basePrice = Number(row['Harga_Modal'] || row['Harga Modal'] || row['harga_modal']) || 0;
    const sellPrice = Number(row['Harga_Jual'] || row['Harga Jual'] || row['harga_jual']) || 0;
    const stock = Number(row['Stok_Awal'] ?? row['Stok'] ?? row['stok_awal'] ?? row['stok']) || 0;

    const isOutsource = (code.includes('OUT') || category.toLowerCase().includes('spanduk') || category.toLowerCase().includes('dtf')) ? 1 : 0;
    const isMetered = (code.includes('OUT') || category.toLowerCase().includes('spanduk') || category.toLowerCase().includes('dtf')) ? 1 : 0;

    // Check if product exists by code
    const existing = await get('SELECT id FROM products WHERE code = ? OR name = ?', [code, name]);

    if (existing) {
      await run(
        `UPDATE products SET 
          code = ?,
          name = ?,
          category = ?,
          unit = ?,
          base_price = ?,
          sell_price = ?,
          stock = ?,
          is_outsource = ?,
          is_metered = ?,
          supplier_id = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [code, name, category, unit, basePrice, sellPrice, stock, isOutsource, isMetered, defaultSupplierId, existing.id]
      );
      updatedCount++;
    } else {
      await run(
        `INSERT INTO products (
          code, name, category, unit, base_price, sell_price, stock, is_outsource, is_metered, supplier_id
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [code, name, category, unit, basePrice, sellPrice, stock, isOutsource, isMetered, defaultSupplierId]
      );
      insertedCount++;
    }
  }

  // Count final products
  const totalProducts = await get('SELECT COUNT(*) as c FROM products');
  const totalSuppliers = await get('SELECT COUNT(*) as c FROM suppliers');
  const totalUsers = await get('SELECT COUNT(*) as c FROM users');

  console.log('==================================================');
  console.log('✅ PEMULIHAN DATA EXCEL SELESAI!');
  console.log(`  - 📥 Barang Ditambah Baru: ${insertedCount}`);
  console.log(`  - 🔄 Barang Diperbarui  : ${updatedCount}`);
  console.log(`  - 🏷️ Total Barang di DB  : ${totalProducts.c}`);
  console.log(`  - 📦 Total Supplier di DB: ${totalSuppliers.c}`);
  console.log(`  - 👤 Total Pengguna (Aman): ${totalUsers.c}`);
  console.log('==================================================');

  // Sync DB copies for all database files
  const srcDb = path.join(__dirname, '../src/database/justlens.sqlite');
  if (fs.existsSync(srcDb)) {
    const syncTargets = [
      path.join(__dirname, '../src/database/database.sqlite'),
      path.join(__dirname, '../src/database/justlens_prod.sqlite'),
      path.join(__dirname, '../database.sqlite'),
      path.join(__dirname, '../dist/justlens.sqlite')
    ];
    syncTargets.forEach(targetPath => {
      try {
        const targetDir = path.dirname(targetPath);
        if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
        fs.copyFileSync(srcDb, targetPath);
        console.log(`✓ Synchronized DB backup copy: ${path.relative(path.join(__dirname, '..'), targetPath)}`);
      } catch (e) {
        console.warn(`⚠️ Failed sync DB to ${targetPath}:`, e.message);
      }
    });
  }
};

if (require.main === module) {
  restoreFromExcel()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Gagal melakukan restore dari Excel:', err);
      process.exit(1);
    });
}

module.exports = { restoreFromExcel };
