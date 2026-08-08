const bcrypt = require('bcryptjs');
const { run, query } = require('../config/database');

const seed = async () => {
  console.log('Memulai seeder data...');
  try {
    // 1. Seed Users
    const usersCount = await query('SELECT COUNT(*) as count FROM users');
    if (usersCount[0].count === 0) {
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
      console.log('- Users seeded (admin/admin123, kasir/kasir123)');
    }

    // 2. Seed Suppliers
    const suppliersCount = await query('SELECT COUNT(*) as count FROM suppliers');
    if (suppliersCount[0].count === 0) {
      await run(
        'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
        ['PT Paper Utama', '081234567890', 'Jl. Industri Paper No. 45, Jakarta']
      );
      await run(
        'INSERT INTO suppliers (name, phone, address) VALUES (?, ?, ?)',
        ['CV Tinta Cemerlang', '089876543210', 'Jl. Grafika No. 12, Bandung']
      );
      console.log('- Suppliers seeded');
    }

    // 3. Seed Materials (Bahan Baku)
    const materialsCount = await query('SELECT COUNT(*) as count FROM materials');
    if (materialsCount[0].count === 0) {
      await run(
        `INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['MAT-001', 'Kertas HVS A4 80gsm (Rim)', 'Kertas', 'Rim', 35000, 100, 1]
      );
      await run(
        `INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['MAT-002', 'Tinta Cyan Eco-Solvent (Liter)', 'Tinta', 'Liter', 250000, 10, 2]
      );
      await run(
        `INSERT INTO materials (code, name, category, unit, base_price, stock, supplier_id)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['MAT-003', 'Ring Spiral Kawat No. 6', 'Jilid', 'Box', 45000, 25, 1]
      );
      console.log('- Materials seeded');
    }

    // 4. Seed Material Purchases (Pembelian Barang Baku)
    const purchasesCount = await query('SELECT COUNT(*) as count FROM material_purchases');
    if (purchasesCount[0].count === 0) {
      const res = await run(
        `INSERT INTO material_purchases (purchase_no, supplier_id, total_amount, notes)
         VALUES (?, ?, ?, ?)`,
        ['PO-20260808-001', 1, 350000, 'Pembelian stok awal kertas A4 10 rim']
      );
      const purchaseId = res.lastID;
      await run(
        `INSERT INTO material_purchase_items (purchase_id, material_id, qty, unit_price, subtotal)
         VALUES (?, ?, ?, ?, ?)`,
        [purchaseId, 1, 10, 35000, 350000]
      );
      console.log('- Material Purchases seeded');
    }

    // 5. Seed Vendors
    const vendorsCount = await query('SELECT COUNT(*) as count FROM vendors');
    if (vendorsCount[0].count === 0) {
      await run(
        'INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)',
        ['Vendor Print Pro', 'Digital Printing Banner Outdoor', 12000]
      );
      await run(
        'INSERT INTO vendors (name, service_type, base_cost_per_m2) VALUES (?, ?, ?)',
        ['Vendor Decal Stiker', 'Cetak Stiker High-Res', 35000]
      );
      console.log('- Vendors seeded');
    }

    // 6. Seed Products
    const productsCount = await query('SELECT COUNT(*) as count FROM products');
    if (productsCount[0].count === 0) {
      await run(
        `INSERT INTO products (code, name, category, is_outsource, is_metered, base_price, sell_price, stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PRD-001', 'Kertas A4 HVS 80gr (Rim)', 'Bahan Baku', 0, 0, 35000, 55000, 50]
      );
      await run(
        `INSERT INTO products (code, name, category, is_outsource, is_metered, base_price, sell_price, stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PRD-002', 'Cetak HVS A4 Warna', 'Cetak Lembaran', 0, 0, 300, 1000, 1000]
      );
      await run(
        `INSERT INTO products (code, name, category, is_outsource, is_metered, base_price, sell_price, stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PRD-003', 'Banner Flexi 280gr', 'Banner Outdoor', 1, 1, 12000, 25000, 999]
      );
      await run(
        `INSERT INTO products (code, name, category, is_outsource, is_metered, base_price, sell_price, stock) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['PRD-004', 'Pulpen Gel Hitam', 'ATK', 0, 0, 2500, 5000, 5]
      );
      console.log('- Products seeded');
    }

    // 7. Seed Finishing Options
    const finishingCount = await query('SELECT COUNT(*) as count FROM finishing_options');
    if (finishingCount[0].count === 0) {
      await run(
        'INSERT INTO finishing_options (name, price) VALUES (?, ?)',
        ['Jilid Ring Kawat', 15000]
      );
      await run(
        'INSERT INTO finishing_options (name, price) VALUES (?, ?)',
        ['Laminating Glossy A4', 5000]
      );
      await run(
        'INSERT INTO finishing_options (name, price) VALUES (?, ?)',
        ['Cutting Presisi', 3000]
      );
      console.log('- Finishing Options seeded');
    }

    // 8. Seed Sample Transaction
    const txCount = await query('SELECT COUNT(*) as count FROM transactions');
    if (txCount[0].count === 0) {
      const res = await run(
        `INSERT INTO transactions (transaction_no, customer_name, total_amount, dp_amount, payment_status, order_status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        ['TRX-20260808-001', 'Toko Maju Jaya', 75000, 25000, 'DP', 'Diproses']
      );
      
      const txId = res.lastID;
      await run(
        `INSERT INTO transaction_items (transaction_id, product_id, finishing_option_id, width, length, qty, price, subtotal, vendor_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, 3, 2, 2.0, 1.0, 1, 50000, 50000, 24000]
      );
      await run(
        `INSERT INTO transaction_items (transaction_id, product_id, finishing_option_id, width, length, qty, price, subtotal, vendor_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, null, 2, 0, 0, 1, 5000, 5000, 0]
      );
      await run(
        `INSERT INTO transaction_items (transaction_id, product_id, finishing_option_id, width, length, qty, price, subtotal, vendor_cost)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [txId, 2, null, 0, 0, 20, 1000, 20000, 6000]
      );
      console.log('- Sample Transaction seeded');
    }

    console.log('Seeding data berhasil diselesaikan!');
    process.exit(0);
  } catch (error) {
    console.error('Seeder gagal:', error);
    process.exit(1);
  }
};

seed();
