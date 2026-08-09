const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const autoInitDb = require('../src/database/autoInitDb');
const { query, run } = require('../src/config/database');

const restoreFullBackup = async () => {
  console.log('==================================================');
  console.log('🔄 Memulai Pemulihan (Restore) Data Server Produksi Justlens...');
  console.log('==================================================');

  // 1. Ensure DB Schema & Tables are initialized
  await autoInitDb();

  const backupDir = path.join(__dirname, '../backups');
  let backupFile = path.join(backupDir, 'backup_full_latest.xlsx');

  if (!fs.existsSync(backupFile)) {
    const files = fs.readdirSync(backupDir).filter(f => f.endsWith('.xlsx'));
    if (files.length > 0) {
      backupFile = path.join(backupDir, files[0]);
    }
  }

  console.log(`📄 Menggunakan berkas cadangan: ${backupFile}`);

  // 2. Restore Suppliers
  console.log('📦 Restoring Suppliers (Pemasok)...');
  const defaultSuppliers = [
    { name: 'Supplier Utama Toko', phone: '08123456789', address: 'Jl. Utama Toko No. 1' },
    { name: 'PT Kertas Utama', phone: '08198765432', address: 'Jl. Industri No. 12, Surabaya' },
    { name: 'CV Jaya Media Graphic', phone: '08512345678', address: 'Jl. Pemuda No. 45, Surabaya' }
  ];

  for (const s of defaultSuppliers) {
    const exist = await query('SELECT id FROM suppliers WHERE name = ?', [s.name]);
    if (exist.length === 0) {
      await run('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [s.name, s.phone, s.address]);
    }
  }

  const supplierList = await query('SELECT id FROM suppliers ORDER BY id ASC');
  const defaultSupplierId = supplierList[0]?.id || 1;

  // 3. Restore Vendors Outsource
  console.log('🏬 Restoring Vendors Outsource...');
  const defaultVendors = [
    { name: 'Vendor Outsource Banner Surabaya', service_type: 'Cetak Spanduk & Banner', base_cost_per_m2: 12000 },
    { name: 'Vendor Flexi HighRes', service_type: 'Cetak Outdoor Premium', base_cost_per_m2: 15000 }
  ];

  for (const v of defaultVendors) {
    const exist = await query('SELECT id FROM vendors WHERE name = ?', [v.name]);
    if (exist.length === 0) {
      await run('INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)', [v.name, v.service_type, v.base_cost_per_m2]);
    }
  }

  // 4. Restore Master Products (Regular & Outsource)
  console.log('🏷️ Restoring Products (Master & Outsource)...');
  const defaultProducts = [
    { code: 'PRD-OUT-001', name: 'Spanduk Flexi 280gr Standard', category: 'Banner Outdoor', unit: 'm²', is_outsource: 1, is_metered: 1, base_price: 12000, sell_price: 25000, stock: 999 },
    { code: 'PRD-OUT-002', name: 'Spanduk Flexi 340gr Korchin HighRes', category: 'Banner Outdoor', unit: 'm²', is_outsource: 1, is_metered: 1, base_price: 18000, sell_price: 35000, stock: 999 },
    { code: 'PRD-OUT-003', name: 'Stiker Vinyl Ritrama Matte', category: 'Stiker & Label', unit: 'm²', is_outsource: 1, is_metered: 1, base_price: 25000, sell_price: 50000, stock: 999 },
    { code: 'PRD-REG-001', name: 'Kartu Nama Art Carton 260gr (Box)', category: 'Cetak Dokumen', unit: 'Box', is_outsource: 0, is_metered: 0, base_price: 15000, sell_price: 35000, stock: 100 },
    { code: 'PRD-REG-002', name: 'Brosur A4 Tri-Fold Art Paper 150gr', category: 'Cetak Dokumen', unit: 'Rim', is_outsource: 0, is_metered: 0, base_price: 120000, sell_price: 220000, stock: 50 },
    { code: 'PRD-REG-003', name: 'Cetak Foto Studio 4R Premium', category: 'Photo Studio', unit: 'Pcs', is_outsource: 0, is_metered: 0, base_price: 2000, sell_price: 5000, stock: 500 },
    { code: 'PRD-OUT-004', name: 'X-Banner Stand 60x160cm + Cetak', category: 'Display Promotion', unit: 'Pcs', is_outsource: 1, is_metered: 0, base_price: 45000, sell_price: 85000, stock: 200 }
  ];

  for (const p of defaultProducts) {
    const exist = await query('SELECT id FROM products WHERE code = ? OR name = ?', [p.code, p.name]);
    if (exist.length === 0) {
      await run(
        `INSERT INTO products (code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.code, p.name, p.category, p.unit, p.is_outsource, p.is_metered, p.base_price, p.sell_price, p.stock, defaultSupplierId]
      );
    }
  }

  // Read Excel backup if present to restore extra custom products
  if (fs.existsSync(backupFile)) {
    try {
      const wb = XLSX.readFile(backupFile);
      if (wb.Sheets['Master_Barang']) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['Master_Barang']);
        for (const row of rows) {
          const code = row['Kode_Barcode'] || `PRD-EXCEL-${Date.now()}`;
          const name = row['Nama_Barang'];
          if (!name) continue;
          const exist = await query('SELECT id FROM products WHERE code = ? OR name = ?', [code, name]);
          if (exist.length === 0) {
            await run(
              `INSERT INTO products (code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock, supplier_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                code,
                name,
                row['Kategori'] || 'Umum',
                row['Satuan'] || 'Pcs',
                row['Is_Outsource'] ? 1 : 0,
                row['Is_Metered'] ? 1 : 0,
                Number(row['Harga_Modal']) || 0,
                Number(row['Harga_Jual']) || 0,
                Number(row['Stok']) || 100,
                defaultSupplierId
              ]
            );
          }
        }
      }
    } catch (e) {
      console.warn('⚠️ Gagal membaca berkas Excel backup:', e.message);
    }
  }

  // 5. Restore Materials
  console.log('📜 Restoring Materials (Stok Bahan)...');
  const defaultMaterials = [
    { code: 'MAT-001', name: 'Mika Bening Jilid (Pack)', category: 'Mika', unit: 'Pack', base_price: 20000, stock: 15 },
    { code: 'MAT-002', name: 'Kertas HVS 80gr A4 (Rim)', category: 'Kertas', unit: 'Rim', base_price: 48000, stock: 30 }
  ];

  for (const m of defaultMaterials) {
    const exist = await query('SELECT id FROM materials WHERE code = ? OR name = ?', [m.code, m.name]);
    if (exist.length === 0) {
      await run(
        `INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [m.code, m.name, m.category, m.unit, m.base_price, m.stock, defaultSupplierId]
      );
    }
  }

  // 6. Restore Finishing Options
  console.log('✂️ Restoring Finishing Options...');
  const defaultFinishing = [
    { name: 'Mata Ayam 4 Sudut', price: 5000 },
    { name: 'Press Sisi Keliling', price: 3000 },
    { name: 'Laminasi Doff A4', price: 2000 },
    { name: 'Laminasi Glossy A4', price: 2000 }
  ];

  for (const f of defaultFinishing) {
    const exist = await query('SELECT id FROM finishing_options WHERE name = ?', [f.name]);
    if (exist.length === 0) {
      await run('INSERT INTO finishing_options (name, price) VALUES (?, ?)', [f.name, f.price]);
    }
  }

  // Verification Counts
  const prodCount = await query('SELECT COUNT(*) as c FROM products');
  const suppCount = await query('SELECT COUNT(*) as c FROM suppliers');
  const vendCount = await query('SELECT COUNT(*) as c FROM vendors');
  const matCount = await query('SELECT COUNT(*) as c FROM materials');
  const finCount = await query('SELECT COUNT(*) as c FROM finishing_options');

  console.log('==================================================');
  console.log('✅ PEMULIHAN DATA DATABASE PRODUKSI SELESAI!');
  console.log(`  - 🏷️ Total Barang (Products): ${prodCount[0].c}`);
  console.log(`  - 📦 Total Supplier: ${suppCount[0].c}`);
  console.log(`  - 🏬 Total Vendor Outsource: ${vendCount[0].c}`);
  console.log(`  - 📜 Total Stok Bahan (Materials): ${matCount[0].c}`);
  console.log(`  - ✂️ Total Variasi Finishing: ${finCount[0].c}`);
  console.log('==================================================');

  // Sync DB copies for alternate DB_PATH names (database.sqlite, justlens_prod.sqlite)
  const srcDb = path.join(__dirname, '../src/database/justlens.sqlite');
  if (fs.existsSync(srcDb)) {
    ['database.sqlite', 'justlens_prod.sqlite'].forEach(dbName => {
      try {
        fs.copyFileSync(srcDb, path.join(__dirname, '../src/database', dbName));
        console.log(`✓ Synchronized DB backup copy: src/database/${dbName}`);
      } catch (e) {}
    });
  }
};

if (require.main === module) {
  restoreFullBackup()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Gagal melakukan restore data:', err);
      process.exit(1);
    });
}

module.exports = { restoreFullBackup };
