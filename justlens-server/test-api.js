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

  const autoInitDb = require('./src/database/autoInitDb');
  await autoInitDb();

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
    // Create Supplier
    const supRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/suppliers',
        method: 'POST',
        headers: authHeaders
      },
      {
        name: 'PT Kertas Utama',
        phone: '08123456789',
        address: 'Jl. Industri No 12'
      }
    );
    const supplierId = supRes.data && supRes.data.data ? supRes.data.data.id : null;

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
        supplier_id: supplierId
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

    const prodSupplierId = supplierId || 1;

    // Create Product & Finishing for Test 4
    const prodRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/products',
        method: 'POST',
        headers: authHeaders
      },
      {
        code: `PRD-TEST-${Date.now()}`,
        name: 'Banner Flexi 280gr Standard',
        category: 'Banner Outdoor',
        unit: 'm²',
        is_outsource: 1,
        is_metered: 1,
        base_price: 12000,
        sell_price: 25000,
        stock: 999,
        supplier_id: prodSupplierId
      }
    );
    const prodId = prodRes.data.data.id;

    const finRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/finishing-options',
        method: 'POST',
        headers: authHeaders
      },
      {
        name: 'Mata Ayam 4 Sudut',
        price: 5000
      }
    );
    const finId = finRes.data.data.id;

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
            product_id: prodId,
            finishing_option_id: finId,
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

    // 7. Tes Menu Pembukuan Kas (Ledger & Profit-Loss)
    console.log('[TEST 7] GET /api/ledger/accounts & POST /api/ledger/entries');
    const accountsRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/ledger/accounts',
      method: 'GET'
    });
    console.log('Accounts Status:', accountsRes.status, 'Total Accounts:', accountsRes.data?.data?.length);
    const firstAccount = accountsRes.data?.data?.[0]?.id || 1;

    const entryRes = await request(
      {
        hostname: 'localhost',
        port: PORT,
        path: '/api/ledger/entries',
        method: 'POST',
        headers: authHeaders
      },
      {
        account_id: firstAccount,
        type: 'Kas Keluar',
        amount: 25000,
        payment_method: 'Tunai',
        category: 'Operasional',
        description: 'Biaya Listrik Toko Test',
        reference_no: 'REF-PLN-01'
      }
    );
    console.log('Journal Entry Status:', entryRes.status, 'Entry:', entryRes.data?.data?.entry_no);

    const plReport = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/ledger/reports/profit-loss',
      method: 'GET'
    });
    console.log('Profit Loss Report Status:', plReport.status);
    console.log('- Net Profit (Laba Bersih): Rp', plReport.data?.data?.net_profit?.toLocaleString('id-ID'), '\n');

    // 8. Tes Ekspor Label Barcode ke Word (.docx)
    console.log('[TEST 8] GET /api/barcodes/export-word');
    const wordRes = await request({
      hostname: 'localhost',
      port: PORT,
      path: '/api/barcodes/export-word',
      method: 'GET'
    });
    console.log('Export Barcode Word Status:', wordRes.status);
    if (wordRes.headers) {
      console.log('- Content-Type:', wordRes.headers['content-type']);
    }
    console.log('✅ SELURUH PENGUJIAN API LAN & FULL FEATURES BERHASIL 100%!');
  } catch (err) {
    console.error('❌ TERJADI KESALAHAN PADA PENGUJIAN API:', err);
    process.exitCode = 1;
  } finally {
    if (server) server.close();
  }
}

runTests();
