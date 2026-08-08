const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { query } = require('../src/config/database');

const exportFullBackup = async () => {
  console.log('🔄 Memulai ekspor FULL BACKUP seluruh data database ke Excel...');

  const backupDir = path.join(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Fetch data from tables
  const products = await query('SELECT id, code AS Kode_Barcode, name AS Nama_Barang, category AS Kategori, unit AS Satuan, is_outsource AS Is_Outsource, is_metered AS Is_Metered, base_price AS Harga_Modal, sell_price AS Harga_Jual, stock AS Stok FROM products ORDER BY id ASC');
  const materials = await query('SELECT m.id, m.code AS Kode_Bahan, m.name AS Nama_Bahan, m.category AS Kategori, m.unit AS Satuan, m.base_price AS Harga_Modal, m.stock AS Stok, s.name AS Nama_Supplier FROM materials m LEFT JOIN suppliers s ON m.supplier_id = s.id ORDER BY m.id ASC');
  const suppliers = await query('SELECT id AS ID_Supplier, name AS Nama_Supplier, phone AS Kontak_Telepon, address AS Alamat_Lengkap FROM suppliers ORDER BY id ASC');
  const vendors = await query('SELECT id AS ID_Vendor, name AS Nama_Vendor, service_type AS Jenis_Layanan, base_cost_per_m2 AS Biaya_Modal_per_m2 FROM vendors ORDER BY id ASC');
  const finishing = await query('SELECT id AS ID_Finishing, name AS Nama_Finishing, price AS Biaya_Tambahan FROM finishing_options ORDER BY id ASC');
  const transactions = await query('SELECT id, transaction_no AS No_Transaksi, customer_name AS Nama_Pelanggan, total_amount AS Total_Biaya, dp_amount AS DP, payment_status AS Status_Pembayaran, order_status AS Status_Pesanan, created_at AS Waktu_Transaksi FROM transactions ORDER BY id DESC');
  const transactionItems = await query('SELECT ti.id, t.transaction_no AS No_Transaksi, p.name AS Nama_Produk, f.name AS Finishing, ti.width AS Lebar_m, ti.length AS Panjang_m, ti.qty AS Qty, ti.price AS Harga_Satuan, ti.subtotal AS Subtotal, ti.vendor_cost AS Modal_Vendor FROM transaction_items ti LEFT JOIN transactions t ON ti.transaction_id = t.id LEFT JOIN products p ON ti.product_id = p.id LEFT JOIN finishing_options f ON ti.finishing_option_id = f.id ORDER BY ti.id DESC');
  const materialPurchases = await query('SELECT mp.id, mp.purchase_no AS No_Pembelian, s.name AS Nama_Supplier, mp.total_amount AS Total_Biaya, mp.notes AS Catatan, mp.created_at AS Tanggal FROM material_purchases mp LEFT JOIN suppliers s ON mp.supplier_id = s.id ORDER BY mp.id DESC');
  const materialPurchaseItems = await query('SELECT mpi.id, mp.purchase_no AS No_Pembelian, m.name AS Nama_Bahan, mpi.qty AS Qty, mpi.unit_price AS Harga_Satuan, mpi.subtotal AS Subtotal FROM material_purchase_items mpi LEFT JOIN material_purchases mp ON mpi.purchase_id = mp.id LEFT JOIN materials m ON mpi.material_id = m.id ORDER BY mpi.id DESC');
  const users = await query('SELECT id, name AS Nama, username AS Username, role AS Role, created_at AS Dibuat_Pada FROM users ORDER BY id ASC');
  const settings = await query('SELECT key AS Pengaturan, value AS Nilai, updated_at AS Diperbarui_Pada FROM settings');

  // 2. Create Workbook with Multiple Sheets
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products), 'Master_Barang');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materials), 'Stok_Bahan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(suppliers), 'Supplier');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(vendors), 'Vendor_Outsource');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(finishing), 'Variasi_Finishing');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactions), 'Transaksi');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(transactionItems), 'Detail_Transaksi');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materialPurchases), 'Pembelian_Bahan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(materialPurchaseItems), 'Detail_Pembelian_Bahan');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(users), 'Pengguna');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(settings), 'Pengaturan');

  // 3. Format Date Filename
  const now = new Date();
  const dateStr = now.toISOString().replace(/[-:]/g, '').replace('T', '_').split('.')[0];
  const timestampedPath = path.join(backupDir, `backup_full_data_${dateStr}.xlsx`);
  const latestPath = path.join(backupDir, `backup_full_latest.xlsx`);

  XLSX.writeFile(wb, timestampedPath);
  XLSX.writeFile(wb, latestPath);

  console.log(`✓ Berhasil membuat berkas backup Excel:`);
  console.log(`  - 📄 ${timestampedPath}`);
  console.log(`  - 📄 ${latestPath}`);

  return { timestampedPath, latestPath };
};

if (require.main === module) {
  exportFullBackup()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Gagal melakukan backup data:', err);
      process.exit(1);
    });
}

module.exports = { exportFullBackup };
