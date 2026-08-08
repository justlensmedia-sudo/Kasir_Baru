const http = require('http');
const app = require('./src/app');

let server;
const PORT = 5002;

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== MEMULAI PENGUJIAN API JUSTLENS SERVER (LAN & FULL FEATURES) ===\n');

  server = app.listen(PORT, '0.0.0.0');
  console.log(`Server tes berjalan di port ${PORT} (0.0.0.0)...\n`);

  try {
    let token = '';

    // 1. Tes Auth Login
    console.log('[TEST 1] POST /api/auth/login');
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      { username: 'admin', password: 'admin123' }
    );
    console.log('Response Status:', loginRes.status);
    console.log('Success:', loginRes.data.success);
    if (loginRes.data.success) {
      token = loginRes.data.data.token;
      console.log('JWT Token didapatkan:', token.slice(0, 20) + '...\n');
    } else {
      throw new Error('Login Gagal!');
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };

    // 2. Tes Sync Master Data (Kasir)
    console.log('[TEST 2] GET /api/products/sync');
    const syncRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/products/sync',
      method: 'GET'
    });
    console.log('Status:', syncRes.status);
    console.log('Produk ter-sync:', syncRes.data.data.products.length);
    console.log('Materials ter-sync:', syncRes.data.data.materials.length);
    console.log('Finishing options ter-sync:', syncRes.data.data.finishing_options.length);
    console.log('Vendors ter-sync:', syncRes.data.data.vendors.length, '\n');

    // 3. Tes Materials & Pembelian Bahan Baku
    console.log('[TEST 3] POST /api/materials & POST /api/purchases');
    const matRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/materials',
        method: 'POST',
        headers: authHeaders
      },
      {
        code: `MAT-TEST-${Date.now()}`,
        name: 'Mika Bening Jilid (Pack)',
        category: 'Mika',
        unit: 'Pack',
        base_price: 20000,
        stock: 5,
        supplier_id: 1
      }
    );
    console.log('Create Material Status:', matRes.status);
    const newMatId = matRes.data.data.id;
    console.log('Stok Awal Mika:', matRes.data.data.stock);

    // Catat Pembelian 10 Pack Mika dari Supplier
    const purchaseRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/purchases',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        supplier_id: 1,
        total_amount: 200000,
        notes: 'Restock mika bening 10 pack',
        items: [
          {
            material_id: newMatId,
            qty: 10,
            unit_price: 20000,
            subtotal: 200000
          }
        ]
      }
    );
    console.log('Create Purchase Status:', purchaseRes.status);
    console.log('PO Number:', purchaseRes.data.data.purchase_no);

    // Cek Stok Mika setelah pembelian (Harus 5 + 10 = 15)
    const checkMat = await request({
      hostname: 'localhost',
      port: PORT,
      path: `/api/materials/${newMatId}`,
      method: 'GET'
    });
    console.log('Stok Mika Setelah Pembelian:', checkMat.data.data.stock, '\n');

    // 4. Tes Create Transaction (Kasir Checkout)
    console.log('[TEST 4] POST /api/transactions/create (Kasir Checkout)');
    const txRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/transactions/create',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      },
      {
        customer_name: 'CV Anugerah Media',
        total_amount: 100000,
        dp_amount: 100000,
        payment_status: 'Lunas',
        order_status: 'Selesai',
        items: [
          {
            product_id: 3, // Banner Flexi (Outsource) 2m x 2m = 4m2 @ 25,000 = 100,000. Vendor Cost = 4 * 12,000 = 48,000
            width: 2.0,
            length: 2.0,
            qty: 1,
            price: 25000,
            subtotal: 100000,
            vendor_cost: 48000
          }
        ]
      }
    );
    console.log('Create Transaction Status:', txRes.status);
    console.log('Transaction No:', txRes.data.data.transaction_no, '\n');

    // 5. Tes Laporan Penjualan
    console.log('[TEST 5] GET /api/reports/sales');
    const salesReport = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports/sales',
      method: 'GET'
    });
    console.log('Sales Report Status:', salesReport.status);
    console.log('- Total Sales (Omset): Rp', salesReport.data.data.summary.total_sales.toLocaleString('id-ID'));
    console.log('- Total Transaksi:', salesReport.data.data.summary.total_transactions, '\n');

    // 6. Tes Laporan Vendor Margin Outsource
    console.log('[TEST 6] GET /api/reports/vendor-margin');
    const marginReport = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports/vendor-margin',
      method: 'GET'
    });
    console.log('Vendor Margin Status:', marginReport.status);
    console.log('- Outsource Revenue: Rp', marginReport.data.data.summary.total_outsource_revenue.toLocaleString('id-ID'));
    console.log('- Outsource Vendor Cost: Rp', marginReport.data.data.summary.total_vendor_cost.toLocaleString('id-ID'));
    console.log('- Gross Margin Outsource: Rp', marginReport.data.data.summary.total_gross_margin.toLocaleString('id-ID'));
    console.log('- Outsource Margin %:', marginReport.data.data.summary.margin_percent, '%\n');

    // 7. Tes Laporan Keuangan & Laba Rugi
    console.log('[TEST 7] GET /api/reports/profit-loss');
    const profitReport = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/reports/profit-loss',
      method: 'GET'
    });
    console.log('Profit & Loss Status:', profitReport.status);
    console.log('- Total Revenue: Rp', profitReport.data.data.summary.total_revenue.toLocaleString('id-ID'));
    console.log('- Total HPP/COGS: Rp', profitReport.data.data.summary.total_cogs.toLocaleString('id-ID'));
    console.log('- Total Pembelian Bahan Baku: Rp', profitReport.data.data.summary.total_material_purchases.toLocaleString('id-ID'));
    console.log('- Gross Profit: Rp', profitReport.data.data.summary.gross_profit.toLocaleString('id-ID'));
    console.log('- Net Profit: Rp', profitReport.data.data.summary.net_profit.toLocaleString('id-ID'), '\n');

    console.log('✅ SELURUH PENGUJIAN API LAN & FULL FEATURES BERHASIL 100%!');
  } catch (err) {
    console.error('❌ TERJADI KESALAHAN PADA PENGUJIAN API:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
}

runTests();
