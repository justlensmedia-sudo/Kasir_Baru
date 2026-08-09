const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const autoInitDb = require('../src/database/autoInitDb');
const { query, run, get } = require('../src/config/database');

const bulkRestoreAll = async () => {
  console.log('==================================================');
  console.log('🔄 Memulai Impor & Restorasi Total Data Server Justlens...');
  console.log('==================================================');

  // 1. Ensure DB Schema & Tables are initialized without modifying users table
  await autoInitDb();

  // 2. Ensure Default Suppliers exist
  console.log('📦 Inisialisasi & Presisi Data Supplier...');
  const initialSuppliers = [
    { name: 'Supplier Utama Toko', phone: '08123456789', address: 'Jl. Utama Toko No. 1' },
    { name: 'PT Kertas Utama', phone: '08198765432', address: 'Jl. Industri No. 12, Surabaya' },
    { name: 'CV Jaya Media Graphic', phone: '08512345678', address: 'Jl. Pemuda No. 45, Surabaya' }
  ];

  for (const s of initialSuppliers) {
    const exist = await get('SELECT id FROM suppliers WHERE name = ?', [s.name]);
    if (!exist) {
      await run('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [s.name, s.phone, s.address]);
    }
  }

  // Map supplier names to IDs
  const allSuppliers = await query('SELECT id, name FROM suppliers');
  const supplierMap = new Map();
  allSuppliers.forEach(s => supplierMap.set(s.name.toLowerCase().trim(), s.id));
  const defaultSupplierId = allSuppliers[0]?.id || 1;

  // 3. Ensure Default Vendors Outsource exist
  console.log('🏬 Inisialisasi Data Vendor Outsource...');
  const initialVendors = [
    { name: 'Vendor Outsource Banner Surabaya', service_type: 'Cetak Spanduk & Banner', base_cost_per_m2: 12000 },
    { name: 'Vendor Flexi HighRes', service_type: 'Cetak Outdoor Premium', base_cost_per_m2: 15000 }
  ];

  for (const v of initialVendors) {
    const exist = await get('SELECT id FROM vendors WHERE name = ?', [v.name]);
    if (!exist) {
      await run('INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)', [v.name, v.service_type, v.base_cost_per_m2]);
    }
  }

  // 4. Ensure Default Finishing Options exist
  console.log('✂️ Inisialisasi Variasi Finishing...');
  const initialFinishing = [
    { name: 'Mata Ayam 4 Sudut', price: 5000 },
    { name: 'Press Sisi Keliling', price: 3000 },
    { name: 'Laminasi Doff A4', price: 2000 },
    { name: 'Laminasi Glossy A4', price: 2000 }
  ];

  for (const f of initialFinishing) {
    const exist = await get('SELECT id FROM finishing_options WHERE name = ?', [f.name]);
    if (!exist) {
      await run('INSERT INTO finishing_options (name, price) VALUES (?, ?)', [f.name, f.price]);
    }
  }

  // 5. Ensure Default Products exist
  console.log('🏷️ Inisialisasi Master Produk Standar...');
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
    const exist = await get('SELECT id FROM products WHERE code = ? OR name = ?', [p.code, p.name]);
    if (!exist) {
      await run(
        `INSERT INTO products (code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [p.code, p.name, p.category, p.unit, p.is_outsource, p.is_metered, p.base_price, p.sell_price, p.stock, defaultSupplierId]
      );
    }
  }

  // 6. Find & Scan All Backup Excel Files
  const backupDirs = [
    path.resolve('D:/system justlens/v6/justlens-system/backup'),
    path.resolve(__dirname, '../backups')
  ];

  const excelFiles = [];
  backupDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir);
      files.forEach(f => {
        if (f.endsWith('.xlsx') || f.endsWith('.xls')) {
          excelFiles.push(path.join(dir, f));
        }
      });
    }
  });

  console.log(`📁 Menemukan ${excelFiles.length} berkas backup Excel untuk diproses:`);
  excelFiles.forEach(f => console.log(`   - ${f}`));

  let insertedProducts = 0;
  let updatedProducts = 0;

  for (const filePath of excelFiles) {
    console.log(`\n📄 Membaca berkas backup: ${path.basename(filePath)}...`);
    try {
      const wb = XLSX.readFile(filePath);

      // Restore Suppliers from Excel if sheet exists
      const supplierSheet = wb.SheetNames.find(s => s.toLowerCase().includes('supplier'));
      if (supplierSheet) {
        const suppRows = XLSX.utils.sheet_to_json(wb.Sheets[supplierSheet]);
        for (const sr of suppRows) {
          const sName = sr['Nama_Supplier'] || sr['name'] || sr['Nama'];
          if (!sName) continue;
          const sPhone = sr['Kontak_Telepon'] || sr['phone'] || '';
          const sAddress = sr['Alamat_Lengkap'] || sr['address'] || '';
          const sExist = await get('SELECT id FROM suppliers WHERE name = ?', [sName]);
          if (!sExist) {
            const res = await run('INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)', [sName, sPhone, sAddress]);
            supplierMap.set(sName.toLowerCase().trim(), res.lastID);
          } else {
            supplierMap.set(sName.toLowerCase().trim(), sExist.id);
          }
        }
      }

      // Restore Vendors from Excel if sheet exists
      const vendorSheet = wb.SheetNames.find(s => s.toLowerCase().includes('vendor'));
      if (vendorSheet) {
        const vendorRows = XLSX.utils.sheet_to_json(wb.Sheets[vendorSheet]);
        for (const vr of vendorRows) {
          const vName = vr['Nama_Vendor'] || vr['name'] || vr['Nama'];
          if (!vName) continue;
          const vType = vr['Jenis_Layanan'] || vr['service_type'] || 'Umum';
          const vCost = Number(vr['Biaya_Modal_per_m2'] || vr['base_cost_per_m2']) || 0;
          const vExist = await get('SELECT id FROM vendors WHERE name = ?', [vName]);
          if (!vExist) {
            await run('INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)', [vName, vType, vCost]);
          }
        }
      }

      // Restore Materials from Excel if sheet exists
      const materialSheet = wb.SheetNames.find(s => s.toLowerCase().includes('bahan') || s.toLowerCase().includes('material'));
      if (materialSheet) {
        const matRows = XLSX.utils.sheet_to_json(wb.Sheets[materialSheet]);
        for (const mr of matRows) {
          const mName = mr['Nama_Bahan'] || mr['name'] || mr['Nama'];
          if (!mName) continue;
          const mCode = mr['Kode_Bahan'] || mr['code'] || `MAT-${Date.now()}`;
          const mCategory = mr['Kategori'] || 'Bahan';
          const mUnit = mr['Satuan'] || 'Pcs';
          const mCost = Number(mr['Harga_Modal'] || mr['base_price']) || 0;
          const mStock = Number(mr['Stok'] || mr['stock']) || 0;
          const mSuppName = mr['Nama_Supplier'];
          let mSuppId = defaultSupplierId;
          if (mSuppName && supplierMap.has(mSuppName.toLowerCase().trim())) {
            mSuppId = supplierMap.get(mSuppName.toLowerCase().trim());
          }
          const mExist = await get('SELECT id FROM materials WHERE code = ? OR name = ?', [mCode, mName]);
          if (!mExist) {
            await run(
              'INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [mCode, mName, mCategory, mUnit, mCost, mStock, mSuppId]
            );
          }
        }
      }

      // Restore Products from Excel (Master_Barang or Products or first sheet)
      const productSheet = wb.SheetNames.find(s => s.toLowerCase().includes('barang') || s.toLowerCase().includes('product')) || wb.SheetNames[0];
      if (productSheet) {
        const prodRows = XLSX.utils.sheet_to_json(wb.Sheets[productSheet]);
        for (const pr of prodRows) {
          const name = pr['Nama_Barang'] || pr['Nama'] || pr['name'] || pr['nama_barang'];
          if (!name) continue;

          let code = String(pr['Kode_Barcode'] || pr['Kode'] || pr['code'] || pr['kode_barcode'] || '').trim();
          if (!code) {
            code = `PRD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          }

          const category = String(pr['Kategori'] || pr['kategori'] || 'Umum').trim();
          const unit = String(pr['Satuan'] || pr['satuan'] || 'Pcs').trim();
          const basePrice = Number(pr['Harga_Modal'] ?? pr['Harga Modal'] ?? pr['harga_modal'] ?? pr['base_price']) || 0;
          const sellPrice = Number(pr['Harga_Jual'] ?? pr['Harga Jual'] ?? pr['harga_jual'] ?? pr['sell_price']) || 0;
          const stock = Number(pr['Stok_Awal'] ?? pr['Stok'] ?? pr['stok_awal'] ?? pr['stok'] ?? pr['stock']) || 0;

          const catLower = category.toLowerCase();
          const codeLower = code.toLowerCase();
          const nameLower = name.toLowerCase();

          let isOutsource = pr['Is_Outsource'] !== undefined ? (pr['Is_Outsource'] ? 1 : 0) : 0;
          if (!isOutsource) {
            isOutsource = (codeLower.includes('out') || catLower.includes('spanduk') || catLower.includes('dtf') || catLower.includes('banner') || catLower.includes('sablon')) ? 1 : 0;
          }

          let isMetered = pr['Is_Metered'] !== undefined ? (pr['Is_Metered'] ? 1 : 0) : 0;
          if (!isMetered) {
            isMetered = (codeLower.includes('out') || catLower.includes('spanduk') || catLower.includes('banner') || unit.toLowerCase() === 'm²' || unit.toLowerCase() === 'm2') ? 1 : 0;
          }

          const supplierName = pr['Nama_Supplier'];
          let supplierId = defaultSupplierId;
          if (supplierName && supplierMap.has(supplierName.toLowerCase().trim())) {
            supplierId = supplierMap.get(supplierName.toLowerCase().trim());
          }

          // Upsert product by code or name
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
              [code, name, category, unit, basePrice, sellPrice, stock, isOutsource, isMetered, supplierId, existing.id]
            );
            updatedProducts++;
          } else {
            await run(
              `INSERT INTO products (
                code, name, category, unit, base_price, sell_price, stock, is_outsource, is_metered, supplier_id
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [code, name, category, unit, basePrice, sellPrice, stock, isOutsource, isMetered, supplierId]
            );
            insertedProducts++;
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ Warning: Gagal memproses file ${filePath}:`, err.message);
    }
  }

  // 7. Verify Database Counts
  const totalProducts = await get('SELECT COUNT(*) as count FROM products');
  const totalSuppliers = await get('SELECT COUNT(*) as count FROM suppliers');
  const totalVendors = await get('SELECT COUNT(*) as count FROM vendors');
  const totalMaterials = await get('SELECT COUNT(*) as count FROM materials');
  const totalUsers = await get('SELECT COUNT(*) as count FROM users');

  console.log('\n==================================================');
  console.log('✅ PEMULIHAN TOTAL DATA SELESAI!');
  console.log(`  - 📥 Barang Baru Ditambah: ${insertedProducts}`);
  console.log(`  - 🔄 Barang Diperbarui   : ${updatedProducts}`);
  console.log(`  - 🏷️ Total Master Barang : ${totalProducts.count}`);
  console.log(`  - 📦 Total Supplier      : ${totalSuppliers.count}`);
  console.log(`  - 🏬 Total Vendor Outsource: ${totalVendors.count}`);
  console.log(`  - 📜 Total Stok Bahan    : ${totalMaterials.count}`);
  console.log(`  - 👤 Total User (Keamanan Utuh): ${totalUsers.count}`);
  console.log('==================================================');

  // 8. Synchronize all SQLite DB copies across server directory
  const srcDb = path.resolve(__dirname, '../src/database/database.sqlite');
  const altSrcDb = path.resolve(__dirname, '../src/database/justlens.sqlite');
  const activeDbPath = fs.existsSync(srcDb) ? srcDb : altSrcDb;

  if (fs.existsSync(activeDbPath)) {
    const syncTargets = [
      path.resolve(__dirname, '../src/database/database.sqlite'),
      path.resolve(__dirname, '../src/database/justlens.sqlite'),
      path.resolve(__dirname, '../src/database/justlens_prod.sqlite'),
      path.resolve(__dirname, '../database.sqlite'),
      path.resolve(__dirname, '../dist/justlens.sqlite')
    ];

    syncTargets.forEach(targetPath => {
      if (targetPath !== activeDbPath) {
        try {
          const targetDir = path.dirname(targetPath);
          if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
          fs.copyFileSync(activeDbPath, targetPath);
          console.log(`✓ Synchronized DB: ${path.relative(path.join(__dirname, '..'), targetPath)}`);
        } catch (e) {
          console.warn(`⚠️ Warning sync DB to ${targetPath}:`, e.message);
        }
      }
    });
  }
};

if (require.main === module) {
  bulkRestoreAll()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('❌ Gagal mengeksekusi restorasi total:', err);
      process.exit(1);
    });
}

module.exports = { bulkRestoreAll };
