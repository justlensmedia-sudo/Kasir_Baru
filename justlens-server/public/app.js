/* ==========================================================================
   JUSTLENS BACKOFFICE DASHBOARD - JAVASCRIPT APP LOGIC & API INTEGRATION
   ========================================================================== */

const API_BASE = '/api';

// Global Application State
const state = {
  token: localStorage.getItem('justlens_jwt_token') || '',
  suppliers: [],
  barangInHouse: [],
  vendors: [],
  productsOutsource: [],
  transactions: [],
  activeTab: 'overview'
};

// Page Title Mapping
const pageTitles = {
  overview: { title: 'Dashboard Overview', subtitle: 'Ringkasan statistik & performa sistem Justlens' },
  supplier: { title: 'Menu Supplier', subtitle: 'Kelola data master supplier & pemasok bahan baku' },
  barang: { title: 'Menu Barang (In-House)', subtitle: 'Kelola stok kertas, ATK, dan produk cetak mandiri' },
  vendor: { title: 'Menu Vendor Outsource', subtitle: 'Kelola mitra cetak luar, spanduk, banner & margin HPP' },
  laporan: { title: 'Menu Laporan Transaksi & Keuangan', subtitle: 'Riwayat transaksi penjualan dan analisis Laba Kotor' },
  pembukuan: { title: 'Menu Pembukuan Kas & Laba Rugi', subtitle: 'Pencatatan Gaji Karyawan, Listrik/Utilitas, Kas Masuk/Keluar & Laba Bersih Toko' },
  excel: { title: 'Kelola Data via Excel', subtitle: 'Ekspor data master & impor massal via file Excel (.xlsx)' },
  users: { title: 'Kelola Akun Kasir & User', subtitle: 'Manajemen akun login kasir, reset password, dan status akses' },
  logs: { title: 'Audit Log Aktivitas User', subtitle: 'Rekam jejak aktivitas kerja kasir, login, dan transaksi real-time' },
  pengaturan: { title: 'Pengaturan & Backup System', subtitle: 'Branding logo usaha, sinkronisasi GitHub, dan manajemen database' }
};

// Helper: Handle Excel Form Submissions
async function handleExcelImportSubmit(event, endpointUrl, buttonId) {
  event.preventDefault();
  const form = event.target;
  const fileInput = form.querySelector('input[type="file"]');
  const btn = document.getElementById(buttonId);

  if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
    showToast('Harap pilih file Excel terlebih dahulu.', 'danger');
    return;
  }

  const formData = new FormData();
  formData.append('file', fileInput.files[0]);

  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Mengimpor...';

  try {
    const headers = {};
    if (state.token) {
      headers['Authorization'] = `Bearer ${state.token}`;
    }

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers,
      body: formData
    });

    const result = await response.json();
    btn.disabled = false;
    btn.innerHTML = originalText;

    if (response.ok && result.success) {
      showToast(result.message || 'Berhasil mengimpor data via Excel!');
      form.reset();
      // Reload dashboard data
      loadDashboardOverview();
      loadSuppliersData();
      loadBarangData();
      loadVendorsData();
    } else {
      showToast(result.message || 'Gagal mengimpor file Excel.', 'danger');
    }
  } catch (error) {
    btn.disabled = false;
    btn.innerHTML = originalText;
    showToast('Error saat mengunggah file Excel: ' + error.message, 'danger');
  }
}

// Helper: Format Rupiah
function formatRupiah(amount) {
  const num = parseInt(amount) || 0;
  return 'Rp ' + num.toLocaleString('id-ID');
}

// Helper: Toast Notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Helper: HTTP Request with JWT Authorization
async function apiRequest(url, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  
  if (state.token) {
    headers['Authorization'] = `Bearer ${state.token}`;
  }

  const config = { method, headers };
  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(API_BASE + url, config);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || 'Terjadi kesalahan pada server');
    }
    return data;
  } catch (err) {
    console.error(`API Error [${method} ${url}]:`, err);
    throw err;
  }
}

// Alias for fetchAPI (used in Pembukuan / Ledger module)
const fetchAPI = apiRequest;

// Auto-Authentication Handler
async function autoLogin() {
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    const data = await res.json();
    if (data.success && data.data?.token) {
      state.token = data.data.token;
      localStorage.setItem('justlens_jwt_token', state.token);
      console.log('Autentikasi admin berhasil.');
    }
  } catch (err) {
    console.warn('Gagal autologin default admin:', err);
  }
}

// Check Server Health Status
async function checkServerHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    const data = await res.json();
    const badge = document.getElementById('serverStatusBadge');
    if (data.status === 'OK') {
      badge.innerHTML = `<span class="dot dot-online"></span><span class="status-text">Server Connected</span>`;
    }
  } catch (e) {
    const badge = document.getElementById('serverStatusBadge');
    badge.innerHTML = `<span class="dot" style="background:red"></span><span class="status-text text-danger">Server Offline</span>`;
  }
}

// Tab Navigation Handler
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update Nav Links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.dataset.tab === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });

  // Update Tab Pages
  document.querySelectorAll('.tab-page').forEach(page => {
    page.classList.remove('active');
  });
  const activePage = document.getElementById(`tab-${tabId}`);
  if (activePage) activePage.classList.add('active');

  // Update Header Titles
  if (pageTitles[tabId]) {
    document.getElementById('pageTitle').textContent = pageTitles[tabId].title;
    document.getElementById('pageSubtitle').textContent = pageTitles[tabId].subtitle;
  }

  // Refresh tab data
  refreshCurrentTabData();
}

// Refresh Current Tab Data
async function refreshCurrentTabData() {
  switch (state.activeTab) {
    case 'overview':
      await loadOverviewData();
      break;
    case 'supplier':
      await loadSuppliers();
      break;
    case 'barang':
      await loadBarangInHouse();
      break;
    case 'vendor':
      await loadVendorsAndOutsource();
      break;
    case 'laporan':
      await loadReports();
      break;
    case 'pembukuan':
      await loadPembukuanData();
      break;
  }
}

// Modal Helpers
function openModal(id) {
  document.getElementById(id).classList.add('active');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('active');
}

/* ==========================================================================
   1. DASHBOARD OVERVIEW
   ========================================================================== */
async function loadOverviewData() {
  try {
    const [profitRes, salesRes, suppliersData, vendorsData] = await Promise.all([
      apiRequest('/reports/profit-loss'),
      apiRequest('/reports/sales'),
      apiRequest('/suppliers'),
      apiRequest('/vendors')
    ]);

    const profitSummary = profitRes.data?.summary || {};
    const salesSummary = salesRes.data?.summary || {};

    document.getElementById('ovTotalRevenue').textContent = formatRupiah(profitSummary.total_revenue || 0);
    document.getElementById('ovTxCount').textContent = `${salesSummary.total_transactions || 0} Transaksi Sukses`;

    document.getElementById('ovGrossProfit').textContent = formatRupiah(profitSummary.gross_profit || 0);
    document.getElementById('ovProfitMargin').textContent = `Margin Laba: ${profitSummary.profit_margin_percent || 0}%`;

    document.getElementById('ovSupplierCount').textContent = suppliersData.data?.length || 0;
    document.getElementById('ovVendorCount').textContent = vendorsData.data?.length || 0;

    // Render Recent Transactions
    const recentTx = salesRes.data?.recent_transactions || [];
    const tbody = document.getElementById('ovRecentTxTable');
    if (recentTx.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Belum ada transaksi recorded.</td></tr>`;
      return;
    }

    tbody.innerHTML = recentTx.map(tx => `
      <tr>
        <td><strong>${tx.transaction_no}</strong></td>
        <td>${tx.customer_name}</td>
        <td><strong>${formatRupiah(tx.total_amount)}</strong></td>
        <td><span class="badge ${tx.payment_status === 'Lunas' ? 'badge-success' : 'badge-warning'}">${tx.payment_status}</span></td>
        <td><span class="badge badge-info">${tx.order_status}</span></td>
      </tr>
    `).join('');

  } catch (err) {
    console.error('Gagal memuat overview:', err);
  }
}

/* ==========================================================================
   2. MENU SUPPLIER (CRUD)
   ========================================================================== */
async function loadSuppliers() {
  try {
    const res = await apiRequest('/suppliers');
    state.suppliers = res.data || [];
    renderSupplierTable();
  } catch (err) {
    showToast('Gagal memuat data supplier', 'error');
  }
}

function renderSupplierTable() {
  const query = document.getElementById('supplierSearch').value.toLowerCase();
  const filtered = state.suppliers.filter(s => 
    (s.name && s.name.toLowerCase().includes(query)) ||
    (s.phone && s.phone.toLowerCase().includes(query)) ||
    (s.address && s.address.toLowerCase().includes(query))
  );

  document.getElementById('supplierBadgeCount').textContent = `${filtered.length} Supplier`;
  const tbody = document.getElementById('supplierTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Tidak ada data supplier ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map((s, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${s.name}</strong></td>
      <td>${s.phone ? `<i class="fa-solid fa-phone text-muted mr-1"></i> ${s.phone}` : '-'}</td>
      <td>${s.address || '-'}</td>
      <td><small class="text-muted">${new Date(s.created_at).toLocaleDateString('id-ID')}</small></td>
      <td class="text-center">
        <button class="btn btn-icon btn-edit" onclick="openModalSupplier(${s.id})" title="Edit Supplier">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-icon btn-delete" onclick="deleteSupplier(${s.id})" title="Hapus Supplier">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openModalSupplier(supplierId = null) {
  const form = document.getElementById('formSupplier');
  form.reset();

  if (supplierId) {
    const supplier = state.suppliers.find(s => s.id === supplierId);
    if (supplier) {
      document.getElementById('modalSupplierTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Edit Supplier #${supplier.id}`;
      document.getElementById('supplierId').value = supplier.id;
      document.getElementById('supplierName').value = supplier.name;
      document.getElementById('supplierPhone').value = supplier.phone || '';
      document.getElementById('supplierAddress').value = supplier.address || '';
    }
  } else {
    document.getElementById('modalSupplierTitle').innerHTML = `<i class="fa-solid fa-truck-field"></i> Form Tambah Supplier Baru`;
    document.getElementById('supplierId').value = '';
  }
  openModal('modalSupplier');
}

async function handleSupplierSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('supplierId').value;
  const body = {
    name: document.getElementById('supplierName').value.trim(),
    phone: document.getElementById('supplierPhone').value.trim(),
    address: document.getElementById('supplierAddress').value.trim()
  };

  try {
    if (id) {
      await apiRequest(`/suppliers/${id}`, 'PUT', body);
      showToast('Data Supplier berhasil diperbarui!');
    } else {
      await apiRequest('/suppliers', 'POST', body);
      showToast('Supplier baru berhasil ditambahkan!');
    }
    closeModal('modalSupplier');
    await loadSuppliers();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan supplier', 'error');
  }
}

async function deleteSupplier(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus supplier ini?')) return;
  try {
    await apiRequest(`/suppliers/${id}`, 'DELETE');
    showToast('Supplier berhasil dihapus.');
    await loadSuppliers();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus supplier', 'error');
  }
}

/* ==========================================================================
   3. MENU BARANG (IN-HOUSE)
   ========================================================================== */
async function loadBarangInHouse() {
  try {
    const res = await apiRequest('/products');
    // Filter only in-house products (is_outsource === 0)
    state.barangInHouse = (res.data || []).filter(p => p.is_outsource === 0);
    renderBarangTable();
  } catch (err) {
    showToast('Gagal memuat barang in-house', 'error');
  }
}

function renderBarangTable() {
  const query = document.getElementById('barangSearch').value.toLowerCase();
  const filtered = state.barangInHouse.filter(b => 
    (b.code && b.code.toLowerCase().includes(query)) ||
    (b.name && b.name.toLowerCase().includes(query)) ||
    (b.category && b.category.toLowerCase().includes(query))
  );

  document.getElementById('barangBadgeCount').textContent = `${filtered.length} Barang In-House`;
  const tbody = document.getElementById('barangTableBody');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Tidak ada barang in-house ditemukan.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(b => {
    const isLowStock = b.stock <= 10;
    const stockBadge = isLowStock 
      ? `<span class="badge badge-danger"><i class="fa-solid fa-triangle-exclamation"></i> Menipis (${b.stock})</span>`
      : `<span class="badge badge-success"><i class="fa-solid fa-check"></i> Aman (${b.stock})</span>`;
    const supplierText = b.supplier_name ? `<span class="badge badge-outline"><i class="fa-solid fa-truck-field mr-1"></i> ${b.supplier_name}</span>` : '<span class="text-muted">-</span>';

    return `
      <tr>
        <td><code>${b.code}</code></td>
        <td><strong>${b.name}</strong><br>${supplierText}</td>
        <td><span class="badge badge-secondary">${b.category}</span></td>
        <td><strong>${b.stock}</strong></td>
        <td>${formatRupiah(b.base_price)}</td>
        <td><strong class="text-success">${formatRupiah(b.sell_price)}</strong></td>
        <td>${stockBadge}</td>
        <td class="text-center">
          <button class="btn btn-icon btn-info" onclick="previewBarcode('${b.code}', '${b.name.replace(/'/g, "\\'")}', ${b.sell_price}, ${b.id})" title="Preview Barcode">
            <i class="fa-solid fa-barcode"></i>
          </button>
          <button class="btn btn-icon btn-edit" onclick="openModalBarang(${b.id})" title="Edit Barang">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-icon btn-delete" onclick="deleteBarang(${b.id})" title="Hapus Barang">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function populateSupplierDropdown(selectId, selectedId = null) {
  const select = document.getElementById(selectId);
  if (!select) return;
  
  if (!state.suppliers || state.suppliers.length === 0) {
    try {
      const res = await apiRequest('/suppliers');
      state.suppliers = res.data || [];
    } catch (e) {}
  }

  let html = '<option value="">-- Pilih Supplier Wajib --</option>';
  state.suppliers.forEach(s => {
    const isSelected = selectedId && parseInt(selectedId) === parseInt(s.id) ? 'selected' : '';
    html += `<option value="${s.id}" ${isSelected}>${s.name}</option>`;
  });
  select.innerHTML = html;
}

async function openModalBarang(barangId = null) {
  const form = document.getElementById('formBarang');
  form.reset();

  if (barangId) {
    const barang = state.barangInHouse.find(b => b.id === barangId);
    if (barang) {
      document.getElementById('modalBarangTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Edit Barang #${barang.code}`;
      document.getElementById('barangId').value = barang.id;
      document.getElementById('barangCode').value = barang.code;
      document.getElementById('barangCategory').value = barang.category;
      document.getElementById('barangName').value = barang.name;
      document.getElementById('barangBaseUnit').value = barang.base_unit || 'lembar';
      document.getElementById('barangPurchaseUnit').value = barang.purchase_unit || 'rim';
      document.getElementById('barangConversionRatio').value = barang.conversion_ratio || 500;
      document.getElementById('barangStock').value = barang.stock;
      document.getElementById('barangBasePrice').value = barang.base_price;
      document.getElementById('barangSellPrice').value = barang.sell_price;
      document.getElementById('barangIsDiscountable').checked = barang.is_discountable !== 0;
      document.getElementById('barangMaxDiscountPercent').value = barang.max_discount_percent || 0;
      await populateSupplierDropdown('barangSupplier', barang.supplier_id);
    }
  } else {
    document.getElementById('modalBarangTitle').innerHTML = `<i class="fa-solid fa-box-open"></i> Form Input Barang Baru (In-House)`;
    document.getElementById('barangId').value = '';
    document.getElementById('barangCode').value = 'PRD-' + Math.floor(100 + Math.random() * 900);
    document.getElementById('barangBaseUnit').value = 'lembar';
    document.getElementById('barangPurchaseUnit').value = 'rim';
    document.getElementById('barangConversionRatio').value = 500;
    document.getElementById('barangIsDiscountable').checked = true;
    document.getElementById('barangMaxDiscountPercent').value = 0;
    await populateSupplierDropdown('barangSupplier', null);
  }
  openModal('modalBarang');
}

async function handleBarangSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('barangId').value;
  const supplierVal = document.getElementById('barangSupplier').value;

  if (!supplierVal) {
    showToast('Supplier Utama Wajib Dipilih!', 'error');
    return;
  }

  const body = {
    code: document.getElementById('barangCode').value.trim(),
    category: document.getElementById('barangCategory').value,
    name: document.getElementById('barangName').value.trim(),
    base_unit: document.getElementById('barangBaseUnit').value.trim() || 'lembar',
    purchase_unit: document.getElementById('barangPurchaseUnit').value.trim() || 'rim',
    conversion_ratio: parseFloat(document.getElementById('barangConversionRatio').value) || 500,
    is_discountable: document.getElementById('barangIsDiscountable').checked ? 1 : 0,
    max_discount_percent: parseFloat(document.getElementById('barangMaxDiscountPercent').value) || 0,
    is_outsource: 0,
    is_metered: 0,
    stock: parseInt(document.getElementById('barangStock').value) || 0,
    base_price: parseInt(document.getElementById('barangBasePrice').value) || 0,
    sell_price: parseInt(document.getElementById('barangSellPrice').value) || 0,
    supplier_id: parseInt(supplierVal, 10)
  };

  try {
    if (id) {
      await apiRequest(`/products/${id}`, 'PUT', body);
      showToast('Barang In-House berhasil diperbarui!');
    } else {
      await apiRequest('/products', 'POST', body);
      showToast('Barang In-House baru berhasil ditambahkan!');
    }
    closeModal('modalBarang');
    await loadBarangInHouse();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan data barang', 'error');
  }
}

async function deleteBarang(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus barang ini?')) return;
  try {
    await apiRequest(`/products/${id}`, 'DELETE');
    showToast('Barang berhasil dihapus.');
    await loadBarangInHouse();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus barang', 'error');
  }
}

/* ==========================================================================
   4. MENU VENDOR OUTSOURCE (CRUD & PRODUCTS)
   ========================================================================== */
async function loadVendorsAndOutsource() {
  try {
    const [vendorsRes, productsRes] = await Promise.all([
      apiRequest('/vendors'),
      apiRequest('/products')
    ]);

    state.vendors = vendorsRes.data || [];
    state.productsOutsource = (productsRes.data || []).filter(p => p.is_outsource === 1);

    renderVendorTable();
    renderOutsourceProductTable();
  } catch (err) {
    showToast('Gagal memuat data vendor outsource', 'error');
  }
}

function renderVendorTable() {
  const tbody = document.getElementById('vendorTableBody');
  if (state.vendors.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4">Belum ada vendor outsource terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.vendors.map((v, idx) => `
    <tr>
      <td>${idx + 1}</td>
      <td><strong>${v.name}</strong></td>
      <td><span class="badge badge-info">${v.service_type}</span></td>
      <td><strong class="text-danger">${formatRupiah(v.base_cost_per_m2)} / m²</strong></td>
      <td class="text-center">
        <button class="btn btn-icon btn-edit" onclick="openModalVendor(${v.id})" title="Edit Vendor">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button class="btn btn-icon btn-delete" onclick="deleteVendor(${v.id})" title="Hapus Vendor">
          <i class="fa-solid fa-trash"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function openModalVendor(vendorId = null) {
  const form = document.getElementById('formVendor');
  form.reset();

  if (vendorId) {
    const vendor = state.vendors.find(v => v.id === vendorId);
    if (vendor) {
      document.getElementById('modalVendorTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Edit Vendor #${vendor.id}`;
      document.getElementById('vendorId').value = vendor.id;
      document.getElementById('vendorName').value = vendor.name;
      document.getElementById('vendorServiceType').value = vendor.service_type;
      document.getElementById('vendorBaseCost').value = vendor.base_cost_per_m2;
    }
  } else {
    document.getElementById('modalVendorTitle').innerHTML = `<i class="fa-solid fa-industry"></i> Form Input Vendor Cetak Luar Baru`;
    document.getElementById('vendorId').value = '';
  }
  openModal('modalVendor');
}

async function handleVendorSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('vendorId').value;
  const body = {
    name: document.getElementById('vendorName').value.trim(),
    service_type: document.getElementById('vendorServiceType').value.trim(),
    base_cost_per_m2: parseInt(document.getElementById('vendorBaseCost').value) || 0
  };

  try {
    if (id) {
      await apiRequest(`/vendors/${id}`, 'PUT', body);
      showToast('Data vendor berhasil diperbarui!');
    } else {
      await apiRequest('/vendors', 'POST', body);
      showToast('Vendor outsource baru berhasil ditambahkan!');
    }
    closeModal('modalVendor');
    await loadVendorsAndOutsource();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan vendor', 'error');
  }
}

async function deleteVendor(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus vendor outsource ini?')) return;
  try {
    await apiRequest(`/vendors/${id}`, 'DELETE');
    showToast('Vendor berhasil dihapus.');
    await loadVendorsAndOutsource();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus vendor', 'error');
  }
}

function renderOutsourceProductTable() {
  const tbody = document.getElementById('outsourceProductTableBody');
  if (state.productsOutsource.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">Belum ada produk outsource terdaftar.</td></tr>`;
    return;
  }

  tbody.innerHTML = state.productsOutsource.map(p => {
    const margin = (p.sell_price || 0) - (p.base_price || 0);
    const marginPercent = p.sell_price > 0 ? Math.round((margin / p.sell_price) * 100) : 0;

    return `
      <tr>
        <td><code>${p.code}</code></td>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-secondary">${p.category}</span></td>
        <td><span class="text-danger">${formatRupiah(p.base_price)} / m²</span></td>
        <td><span class="text-success">${formatRupiah(p.sell_price)} / m²</span></td>
        <td><strong class="text-primary">+${formatRupiah(margin)}</strong> <small class="text-muted">(${marginPercent}%)</small></td>
        <td class="text-center">
          <button class="btn btn-icon btn-edit" onclick="openModalOutsourceProduct(${p.id})" title="Edit Produk Outsource">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-icon btn-delete" onclick="deleteOutsourceProduct(${p.id})" title="Hapus Produk Outsource">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

async function openModalOutsourceProduct(productId = null) {
  const form = document.getElementById('formOutsourceProduct');
  form.reset();

  let selectedSupplierId = null;
  if (productId) {
    const p = state.productsOutsource.find(item => item.id === productId);
    if (p) {
      document.getElementById('modalOutsourceProductTitle').innerHTML = `<i class="fa-solid fa-pen"></i> Edit Produk Outsource #${p.code}`;
      document.getElementById('outsourceProductId').value = p.id;
      document.getElementById('outsourceProductCode').value = p.code;
      document.getElementById('outsourceProductCategory').value = p.category;
      document.getElementById('outsourceProductName').value = p.name;
      document.getElementById('outsourceBasePrice').value = p.base_price;
      document.getElementById('outsourceSellPrice').value = p.sell_price;
      selectedSupplierId = p.supplier_id;
    }
  } else {
    document.getElementById('modalOutsourceProductTitle').innerHTML = `<i class="fa-solid fa-tags"></i> Form Input Produk Cetak Outsource`;
    document.getElementById('outsourceProductId').value = '';
    document.getElementById('outsourceProductCode').value = 'PRD-OUT-' + Math.floor(100 + Math.random() * 900);
  }

  await populateSupplierDropdown('outsourceProductSupplier', selectedSupplierId);
  openModal('modalOutsourceProduct');
}

async function handleOutsourceProductSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('outsourceProductId').value;
  const supplierVal = document.getElementById('outsourceProductSupplier').value;

  if (!supplierVal) {
    showToast('Supplier Utama Wajib Dipilih!', 'error');
    return;
  }

  const body = {
    code: document.getElementById('outsourceProductCode').value.trim(),
    category: document.getElementById('outsourceProductCategory').value,
    name: document.getElementById('outsourceProductName').value.trim(),
    is_outsource: 1,
    is_metered: 1,
    stock: 999,
    base_price: parseInt(document.getElementById('outsourceBasePrice').value) || 0,
    sell_price: parseInt(document.getElementById('outsourceSellPrice').value) || 0,
    supplier_id: parseInt(supplierVal, 10)
  };

  try {
    if (id) {
      await apiRequest(`/products/${id}`, 'PUT', body);
      showToast('Produk Outsource berhasil diperbarui!');
    } else {
      await apiRequest('/products', 'POST', body);
      showToast('Produk Outsource baru berhasil ditambahkan!');
    }
    closeModal('modalOutsourceProduct');
    await loadVendorsAndOutsource();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan produk outsource', 'error');
  }
}

async function deleteOutsourceProduct(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus produk outsource ini?')) return;
  try {
    await apiRequest(`/products/${id}`, 'DELETE');
    showToast('Produk outsource berhasil dihapus.');
    await loadVendorsAndOutsource();
  } catch (err) {
    showToast(err.message || 'Gagal menghapus produk outsource', 'error');
  }
}

/* ==========================================================================
   5. MENU LAPORAN (TRANSACTIONS & GROSS PROFIT)
   ========================================================================== */
async function loadReports() {
  const startDate = document.getElementById('reportStartDate').value;
  const endDate = document.getElementById('reportEndDate').value;

  let queryParams = '';
  if (startDate && endDate) {
    queryParams = `?startDate=${startDate}&endDate=${endDate}`;
  }

  try {
    const [profitRes, salesRes, marginRes, txRes] = await Promise.all([
      apiRequest(`/reports/profit-loss${queryParams}`),
      apiRequest(`/reports/sales${queryParams}`),
      apiRequest(`/reports/vendor-margin${queryParams}`),
      apiRequest('/transactions')
    ]);

    const profitSummary = profitRes.data?.summary || {};
    const salesSummary = salesRes.data?.summary || {};
    const marginItems = marginRes.data?.items || [];
    const transactions = txRes.data || [];

    // Financial Cards
    document.getElementById('repTotalRevenue').textContent = formatRupiah(profitSummary.total_revenue || 0);
    document.getElementById('repTotalTxCount').textContent = `${profitSummary.total_transactions || 0} Transaksi Recorded`;

    document.getElementById('repTotalCogs').textContent = formatRupiah(profitSummary.total_cogs || 0);
    document.getElementById('repGrossProfit').textContent = formatRupiah(profitSummary.gross_profit || 0);
    document.getElementById('repMarginPercent').textContent = `Margin Laba: ${profitSummary.profit_margin_percent || 0}%`;

    // Render Transactions History Table
    renderTransactionHistoryTable(transactions);

    // Render Vendor Margin Report Table
    renderVendorMarginTable(marginItems);

  } catch (err) {
    showToast('Gagal memuat laporan transaksi & laba kotor', 'error');
  }
}

function resetReportFilter() {
  document.getElementById('reportStartDate').value = '';
  document.getElementById('reportEndDate').value = '';
  loadReports();
}

function renderTransactionHistoryTable(transactions) {
  const tbody = document.getElementById('transactionHistoryTableBody');
  if (!transactions || transactions.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-4">Belum ada riwayat transaksi.</td></tr>`;
    return;
  }

  tbody.innerHTML = transactions.map(tx => `
    <tr>
      <td><strong>${tx.transaction_no}</strong></td>
      <td><small class="text-muted">${new Date(tx.created_at).toLocaleString('id-ID')}</small></td>
      <td>${tx.customer_name}</td>
      <td><strong class="text-success">${formatRupiah(tx.total_amount)}</strong></td>
      <td>${formatRupiah(tx.dp_amount || 0)}</td>
      <td><span class="badge ${tx.payment_status === 'Lunas' ? 'badge-success' : 'badge-warning'}">${tx.payment_status}</span></td>
      <td><span class="badge badge-info">${tx.order_status}</span></td>
      <td class="text-center">
        <button class="btn btn-outline-primary btn-sm" onclick="viewTransactionDetail(${tx.id})">
          <i class="fa-solid fa-eye"></i> Detail
        </button>
      </td>
    </tr>
  `).join('');
}

async function viewTransactionDetail(txId) {
  try {
    const res = await apiRequest(`/transactions/${txId}`);
    const tx = res.data;
    if (!tx) return;

    const modalBody = document.getElementById('modalTransactionBody');
    const itemsHtml = (tx.items || []).map((item, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td><strong>${item.product_name || 'Finishing / Custom'}</strong></td>
        <td>${item.width > 0 ? `${item.width}m x ${item.length}m` : '-'}</td>
        <td>${item.qty}</td>
        <td>${formatRupiah(item.price)}</td>
        <td><strong class="text-success">${formatRupiah(item.subtotal)}</strong></td>
      </tr>
    `).join('');

    modalBody.innerHTML = `
      <div class="mb-4">
        <div class="form-row">
          <div class="col-6">
            <p><strong>No Transaksi:</strong> ${tx.transaction_no}</p>
            <p><strong>Pelanggan:</strong> ${tx.customer_name}</p>
            <p><strong>Waktu:</strong> ${new Date(tx.created_at).toLocaleString('id-ID')}</p>
          </div>
          <div class="col-6 text-right">
            <p><strong>Total Transaksi:</strong> <span class="text-success font-weight-bold" style="font-size: 18px">${formatRupiah(tx.total_amount)}</span></p>
            <p><strong>DP Terbayar:</strong> ${formatRupiah(tx.dp_amount || 0)}</p>
            <p><strong>Status Bayar / Order:</strong> <span class="badge badge-success">${tx.payment_status}</span> <span class="badge badge-info">${tx.order_status}</span></p>
          </div>
        </div>
      </div>
      <h4 class="mb-2"><i class="fa-solid fa-list-check"></i> Rincian Item Transaksi</h4>
      <div class="table-responsive">
        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Nama Produk / Layanan</th>
              <th>Ukuran</th>
              <th>Qty</th>
              <th>Harga Unit</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
    `;

    openModal('modalTransactionDetail');
  } catch (err) {
    showToast('Gagal memuat detail transaksi', 'error');
  }
}

function renderVendorMarginTable(items) {
  const tbody = document.getElementById('vendorMarginReportBody');
  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">Belum ada transaksi produk outsource.</td></tr>`;
    return;
  }

  tbody.innerHTML = items.map(item => `
    <tr>
      <td><strong>${item.product_name}</strong> <small class="text-muted">(${item.product_code})</small></td>
      <td><strong>${item.total_qty}</strong></td>
      <td><span class="text-success">${formatRupiah(item.total_revenue)}</span></td>
      <td><span class="text-danger">${formatRupiah(item.total_vendor_cost)}</span></td>
      <td><strong class="text-primary">+${formatRupiah(item.gross_margin)}</strong></td>
      <td><span class="badge badge-success">${item.margin_percent}%</span></td>
    </tr>
  `).join('');
}

/* ==========================================================================
   DYNAMIC CATEGORY MANAGEMENT
   ========================================================================== */
function getCategories(target) {
  const key = target === 'outsource' ? 'justlens_cat_outsource' : 'justlens_cat_inhouse';
  const defaults = target === 'outsource' 
    ? ['Banner Outdoor', 'Banner Indoor', 'Stiker Decal', 'Brosur Offset']
    : ['Bahan Baku', 'ATK', 'Cetak Lembaran', 'Jilid'];
  const saved = JSON.parse(localStorage.getItem(key) || '[]');
  return Array.from(new Set([...defaults, ...saved]));
}

function updateCategoryDropdowns() {
  const inhouseSelect = document.getElementById('barangCategory');
  if (inhouseSelect) {
    const cats = getCategories('inhouse');
    const currentVal = inhouseSelect.value;
    inhouseSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    if (cats.includes(currentVal)) inhouseSelect.value = currentVal;
  }

  const outsourceSelect = document.getElementById('outsourceProductCategory');
  if (outsourceSelect) {
    const cats = getCategories('outsource');
    const currentVal = outsourceSelect.value;
    outsourceSelect.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
    if (cats.includes(currentVal)) outsourceSelect.value = currentVal;
  }
}

function openModalCategory(target = 'inhouse') {
  document.getElementById('formCategory').reset();
  document.getElementById('categoryTarget').value = target;
  const titleText = target === 'outsource' ? 'Form Tambah Kategori Produk Outsource' : 'Form Tambah Kategori Barang In-House';
  document.getElementById('modalCategoryTitle').innerHTML = `<i class="fa-solid fa-folder-plus"></i> ${titleText}`;
  openModal('modalCategory');
}

function handleCategorySubmit(e) {
  e.preventDefault();
  const name = document.getElementById('categoryName').value.trim();
  const target = document.getElementById('categoryTarget').value || 'inhouse';

  if (!name) return;

  const key = target === 'outsource' ? 'justlens_cat_outsource' : 'justlens_cat_inhouse';
  const existing = getCategories(target);
  if (!existing.includes(name)) {
    existing.push(name);
    localStorage.setItem(key, JSON.stringify(existing));
  }

  updateCategoryDropdowns();

  if (target === 'inhouse') {
    const select = document.getElementById('barangCategory');
    if (select) select.value = name;
  } else {
    const select = document.getElementById('outsourceProductCategory');
    if (select) select.value = name;
  }

  closeModal('modalCategory');
  showToast(`Kategori baru '${name}' berhasil ditambahkan!`);
}

/* ==========================================================================
   FINANCIAL REPORT EXPORT (EXCEL & CSV)
   ========================================================================== */
async function exportFinancialReportToExcel() {
  const startDate = document.getElementById('reportStartDate').value || 'Semua Waktu';
  const endDate = document.getElementById('reportEndDate').value || 'Semua Waktu';
  const queryParams = (startDate !== 'Semua Waktu' && endDate !== 'Semua Waktu') ? `?startDate=${startDate}&endDate=${endDate}` : '';

  try {
    showToast('Menyiapkan Laporan Keuangan Excel...', 'info');
    const [profitRes, salesRes, marginRes, txRes] = await Promise.all([
      apiRequest(`/reports/profit-loss${queryParams}`),
      apiRequest(`/reports/sales${queryParams}`),
      apiRequest(`/reports/vendor-margin${queryParams}`),
      apiRequest('/transactions')
    ]);

    const profitSummary = profitRes.data?.summary || {};
    const transactions = txRes.data || [];
    const marginItems = marginRes.data?.items || [];

    let excelHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Laporan Keuangan</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        <meta charset="UTF-8">
        <style>
          th { background-color: #4f46e5; color: #ffffff; font-weight: bold; border: 1px solid #cccccc; }
          td { border: 1px solid #dddddd; }
          .title { font-size: 18px; font-weight: bold; color: #1e293b; }
          .subtitle { font-size: 12px; color: #64748b; }
          .metric-header { background-color: #eef2ff; font-weight: bold; }
          .number { text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <p class="title">JUSTLENS SYSTEM - LAPORAN KEUANGAN & LABA KOTOR</p>
        <p class="subtitle">Periode: ${startDate} s/d ${endDate} | Tanggal Cetak: ${new Date().toLocaleString('id-ID')}</p>
        <br/>
        <table>
          <tr><th colspan="2" class="metric-header">RINGKASAN PERFORMANSA KEUANGAN</th></tr>
          <tr><td class="bold">Total Transaksi Recorded</td><td class="number">${profitSummary.total_transactions || 0} Transaksi</td></tr>
          <tr><td class="bold">Total Omset Penjualan (Revenue)</td><td class="number">Rp ${(profitSummary.total_revenue || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td class="bold">Total HPP & Vendor Cost (COGS)</td><td class="number">Rp ${(profitSummary.total_cogs || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td class="bold">Total Pembelian Bahan Baku</td><td class="number">Rp ${(profitSummary.total_material_purchases || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td class="bold">Total Laba Kotor (Gross Profit)</td><td class="number">Rp ${(profitSummary.gross_profit || 0).toLocaleString('id-ID')}</td></tr>
          <tr><td class="bold">Margin Laba Kotor (%)</td><td class="number">${profitSummary.profit_margin_percent || 0}%</td></tr>
        </table>
        <br/><br/>
        <h3>1. TABEL RIWAYAT TRANSAKSI PENJUALAN</h3>
        <table>
          <thead>
            <tr>
              <th>No. Transaksi</th>
              <th>Waktu & Tanggal</th>
              <th>Nama Pelanggan</th>
              <th>Total Transaksi (Rp)</th>
              <th>DP Terbayar (Rp)</th>
              <th>Status Pembayaran</th>
              <th>Status Pesanan</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.map(tx => `
              <tr>
                <td>${tx.transaction_no}</td>
                <td>${new Date(tx.created_at).toLocaleString('id-ID')}</td>
                <td>${tx.customer_name}</td>
                <td class="number">${tx.total_amount}</td>
                <td class="number">${tx.dp_amount || 0}</td>
                <td>${tx.payment_status}</td>
                <td>${tx.order_status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <br/><br/>
        <h3>2. LAPORAN DETAIL MARGIN PRODUK OUTSOURCE VENDOR</h3>
        <table>
          <thead>
            <tr>
              <th>Kode Produk</th>
              <th>Nama Produk Outsource</th>
              <th>Total Qty Terjual</th>
              <th>Total Omset (Rp)</th>
              <th>Total Modal Vendor (Rp)</th>
              <th>Laba Kotor Outsource (Rp)</th>
              <th>Margin (%)</th>
            </tr>
          </thead>
          <tbody>
            ${marginItems.map(item => `
              <tr>
                <td>${item.product_code}</td>
                <td>${item.product_name}</td>
                <td class="number">${item.total_qty}</td>
                <td class="number">${item.total_revenue}</td>
                <td class="number">${item.total_vendor_cost}</td>
                <td class="number">${item.gross_margin}</td>
                <td class="number">${item.margin_percent}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `Laporan_Keuangan_Justlens_${dateStr}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Laporan Keuangan Excel berhasil di-export!');
  } catch (err) {
    showToast('Gagal mengexport laporan keuangan ke Excel', 'error');
  }
}

async function exportFinancialReportToCSV() {
  try {
    showToast('Menyiapkan file CSV Transaksi...', 'info');
    const txRes = await apiRequest('/transactions');
    const transactions = txRes.data || [];

    let csvContent = 'No. Transaksi,Waktu & Tanggal,Nama Pelanggan,Total Transaksi (Rp),DP Terbayar (Rp),Status Bayar,Status Order\n';
    transactions.forEach(tx => {
      const time = new Date(tx.created_at).toLocaleString('id-ID').replace(/,/g, '');
      const cust = `"${(tx.customer_name || '').replace(/"/g, '""')}"`;
      csvContent += `${tx.transaction_no},${time},${cust},${tx.total_amount},${tx.dp_amount || 0},${tx.payment_status},${tx.order_status}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    a.download = `Riwayat_Transaksi_Justlens_${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Data Transaksi CSV berhasil di-export!');
  } catch (err) {
    showToast('Gagal mengexport data ke CSV', 'error');
  }
}

/* ==========================================================================
   PENGATURAN SYSTEM, BRANDING LOGO, EXCEL IMPORT & GIT BACKUP
   ========================================================================== */

// Fetch Settings & Update Logo Display
async function loadSystemSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings`);
    if (res.ok) {
      const result = await res.json();
      if (result.success && result.data) {
        const logoUrl = result.data.logo_url;
        if (logoUrl) {
          // Update sidebar brand logo
          const brandLogo = document.querySelector('.brand-logo');
          if (brandLogo) {
            brandLogo.innerHTML = `<img src="${logoUrl}" alt="Logo" style="width:100%;height:100%;object-fit:contain;border-radius:8px;" />`;
          }
          // Update preview in Pengaturan tab
          const previewImg = document.getElementById('logoPreviewImg');
          const defaultIcon = document.getElementById('logoDefaultIcon');
          if (previewImg && defaultIcon) {
            previewImg.src = logoUrl;
            previewImg.style.display = 'block';
            defaultIcon.style.display = 'none';
          }
        }
      }
    }
  } catch (err) {
    console.warn('Failed to load system settings:', err);
  }
}

function previewSelectedLogo(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('logoPreviewImg');
      const defaultIcon = document.getElementById('logoDefaultIcon');
      if (previewImg && defaultIcon) {
        previewImg.src = e.target.result;
        previewImg.style.display = 'block';
        defaultIcon.style.display = 'none';
      }
    };
    reader.readAsDataURL(file);
  }
}

async function handleLogoUploadSubmit(e) {
  e.preventDefault();
  const fileInput = document.getElementById('logoFileInput');
  if (!fileInput || !fileInput.files[0]) {
    showToast('Harap pilih file logo terlebih dahulu.', 'error');
    return;
  }

  const btn = document.getElementById('btnUploadLogo');
  if (btn) btn.disabled = true;

  try {
    const formData = new FormData();
    formData.append('logo', fileInput.files[0]);

    const res = await fetch(`${API_BASE}/settings/upload-logo`, {
      method: 'POST',
      body: formData
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengunggah logo');
    }

    showToast(result.message || 'Logo usaha berhasil diperbarui!');
    await loadSystemSettings();
  } catch (err) {
    showToast(err.message || 'Gagal mengunggah logo', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Download Excel Template
function downloadTemplateExcel() {
  window.location.href = `${API_BASE}/products/template-excel`;
  showToast('Mengunduh Template Excel (.xlsx)...');
}

function openModalImportExcel() {
  document.getElementById('formImportExcel').reset();
  openModal('modalImportExcel');
}

async function handleExcelImportSubmit(e, endpointUrl = null, buttonId = null) {
  e.preventDefault();
  const form = e.target;
  const fileInput = form.querySelector('input[type="file"]') || document.getElementById('excelFileInput');
  const targetEndpoint = endpointUrl || `${API_BASE}/products/import-excel`;
  const targetBtn = buttonId ? document.getElementById(buttonId) : document.getElementById('btnSubmitImportExcel');

  if (!fileInput || !fileInput.files || !fileInput.files[0]) {
    showToast('Harap pilih file Excel (.xlsx) terlebih dahulu.', 'error');
    return;
  }

  const selectedFile = fileInput.files[0];
  console.log(`[Excel Import] File terbaca: ${selectedFile.name} (${selectedFile.size} bytes, type: ${selectedFile.type})`);
  showToast(`File terpilih: ${selectedFile.name}. Mengunggah...`);

  if (targetBtn) {
    targetBtn.disabled = true;
    targetBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses...';
  }

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);

    const token = localStorage.getItem('justlens_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const url = targetEndpoint.startsWith('http') ? targetEndpoint : (targetEndpoint.startsWith('/api') ? targetEndpoint : `${API_BASE}${targetEndpoint}`);

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: formData
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal mengimpor file Excel');
    }

    console.log('[Excel Import] Berhasil:', result);
    showToast(result.message || 'Import Excel Berhasil!');
    if (document.getElementById('modalImportExcel')) closeModal('modalImportExcel');
    if (typeof loadBarang === 'function') await loadBarang();
    if (typeof loadSuppliers === 'function') await loadSuppliers();
    if (typeof loadVendorsAndOutsource === 'function') await loadVendorsAndOutsource();
    form.reset();
  } catch (err) {
    console.error('[Excel Import] Error:', err);
    showToast(err.message || 'Gagal mengimpor Excel', 'error');
  } finally {
    if (targetBtn) {
      targetBtn.disabled = false;
      targetBtn.innerHTML = '<i class="fa-solid fa-file-arrow-up"></i> Import / Upload Excel';
    }
  }
}

// Trigger Git Backup
async function triggerGitBackup() {
  const btn = document.getElementById('btnGitBackup');
  const statusDiv = document.getElementById('gitBackupStatus');

  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Memproses Backup...';
  }

  if (statusDiv) {
    statusDiv.innerHTML = '<span class="text-info"><i class="fa-solid fa-circle-notch fa-spin"></i> Menghubungkan ke repositori GitHub...</span>';
  }

  try {
    const res = await fetch(`${API_BASE}/settings/backup-git`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal melakukan backup Git');
    }

    showToast(result.message);
    if (statusDiv) {
      statusDiv.innerHTML = `<span class="text-success" style="color:#10b981;"><i class="fa-solid fa-check-circle"></i> ${result.message}</span>`;
    }
  } catch (err) {
    showToast(err.message || 'Gagal backup ke GitHub', 'error');
    if (statusDiv) {
      statusDiv.innerHTML = `<span class="text-danger" style="color:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i> ${err.message}</span>`;
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> Backup Source Code & Database';
    }
  }
}

// Open Selective Reset Modal
function openSelectiveResetModal() {
  const form = document.getElementById('formSelectiveReset');
  if (form) form.reset();
  openModal('modalSelectiveReset');
}

// Handle Selective Reset Form Submission
async function handleSelectiveResetSubmit(e) {
  if (e) e.preventDefault();

  const resetTransactions = document.getElementById('resetTransactions')?.checked || false;
  const resetJournals = document.getElementById('resetJournals')?.checked || false;
  const resetProducts = document.getElementById('resetProducts')?.checked || false;
  const resetSuppliersVendors = document.getElementById('resetSuppliersVendors')?.checked || false;
  const resetLogs = document.getElementById('resetLogs')?.checked || false;
  const password = document.getElementById('adminPasswordConfirm')?.value || '';

  if (!resetTransactions && !resetJournals && !resetProducts && !resetSuppliersVendors && !resetLogs) {
    showToast('Harap pilih setidaknya satu opsi data yang akan dibersihkan.', 'error');
    return;
  }

  if (!password) {
    showToast('Harap masukkan password Admin untuk konfirmasi keamanan.', 'error');
    return;
  }

  const btn = document.getElementById('btnSubmitSelectiveReset');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/settings/selective-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password,
        reset_transactions: resetTransactions,
        reset_journals: resetJournals,
        reset_products: resetProducts,
        reset_suppliers_vendors: resetSuppliersVendors,
        reset_logs: resetLogs
      })
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal melakukan pembersihan database selektif');
    }

    showToast(result.message);
    closeModal('modalSelectiveReset');
    await refreshCurrentTabData();
  } catch (err) {
    showToast(err.message || 'Terjadi kesalahan saat mereset database', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

// Trigger Database Reset (Full Reset Fallback)
async function triggerDatabaseReset() {
  const confirmFirst = confirm("PERINGATAN KELOLA DATABASE:\n\nApakah Anda yakin ingin mengosongkan SELURUH data sisa (transaksi, stok, supplier, dan vendor)?\n\nData akun Pengguna (Admin/Kasir) TETAP DIPERTAHANKAN.");
  if (!confirmFirst) return;

  const btn = document.getElementById('btnResetDb');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/settings/reset-database`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const result = await res.json();
    if (!res.ok || !result.success) {
      throw new Error(result.message || 'Gagal membersihkan database');
    }

    showToast(result.message);
    await refreshCurrentTabData();
  } catch (err) {
    showToast(err.message || 'Gagal reset database', 'error');
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ==========================================================================
   8. MANAJEMEN AKUN KASIR / USER & AUDIT LOGS
   ========================================================================== */
async function loadUsersData() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" class="text-center">Memuat akun kasir...</td></tr>';

  try {
    const res = await apiRequest('/users');
    const users = res.data || [];

    if (users.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">Belum ada akun kasir terdaftar.</td></tr>';
      return;
    }

    tbody.innerHTML = users.map(u => {
      const statusBadge = u.is_active === 1
        ? `<span class="badge badge-success"><i class="fa-solid fa-check-circle"></i> Aktif</span>`
        : `<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Nonaktif</span>`;
      const roleBadge = u.role === 'admin'
        ? `<span class="badge badge-primary"><i class="fa-solid fa-user-shield"></i> Admin</span>`
        : `<span class="badge badge-secondary"><i class="fa-solid fa-user"></i> Kasir</span>`;

      return `
        <tr>
          <td>#${u.id}</td>
          <td><strong>${u.name}</strong></td>
          <td><code>${u.username}</code></td>
          <td>${roleBadge}</td>
          <td>${statusBadge}</td>
          <td><small class="text-muted">${new Date(u.created_at).toLocaleDateString('id-ID')}</small></td>
          <td class="text-center">
            <button class="btn btn-icon btn-edit" onclick="openModalUser(${u.id})" title="Edit Akun">
              <i class="fa-solid fa-pen"></i>
            </button>
            <button class="btn btn-icon btn-warning" onclick="openModalResetPassword(${u.id}, '${u.name.replace(/'/g, "\\'")}')" title="Reset Password">
              <i class="fa-solid fa-key"></i>
            </button>
            <button class="btn btn-icon ${u.is_active === 1 ? 'btn-delete' : 'btn-success'}" onclick="toggleUserStatus(${u.id})" title="${u.is_active === 1 ? 'Nonaktifkan' : 'Aktifkan'}">
              <i class="fa-solid ${u.is_active === 1 ? 'fa-user-slash' : 'fa-user-check'}"></i>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Gagal memuat akun pengguna: ${err.message}</td></tr>`;
  }
}

function openModalUser(userId = null) {
  const form = document.getElementById('formUser');
  if (form) form.reset();

  const pwdGroup = document.getElementById('userPasswordGroup');
  const pwdInput = document.getElementById('userPassword');

  if (userId) {
    document.getElementById('modalUserTitle').innerHTML = `<i class="fa-solid fa-user-pen"></i> Edit Akun Kasir #${userId}`;
    document.getElementById('userId').value = userId;
    if (pwdGroup) pwdGroup.style.display = 'none';
    if (pwdInput) pwdInput.required = false;

    apiRequest(`/users/${userId}`).then(res => {
      if (res.data) {
        document.getElementById('userFullName').value = res.data.name;
        document.getElementById('userUsername').value = res.data.username;
        document.getElementById('userRole').value = res.data.role;
        document.getElementById('userStatus').value = res.data.is_active;
      }
    });
  } else {
    document.getElementById('modalUserTitle').innerHTML = `<i class="fa-solid fa-user-plus"></i> Form Tambah Akun Kasir Baru`;
    document.getElementById('userId').value = '';
    if (pwdGroup) pwdGroup.style.display = 'block';
    if (pwdInput) pwdInput.required = true;
  }
  openModal('modalUser');
}

async function handleUserSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('userId').value;
  const body = {
    name: document.getElementById('userFullName').value.trim(),
    username: document.getElementById('userUsername').value.trim(),
    role: document.getElementById('userRole').value,
    is_active: parseInt(document.getElementById('userStatus').value, 10)
  };

  if (!id) {
    body.password = document.getElementById('userPassword').value;
  }

  try {
    if (id) {
      await apiRequest(`/users/${id}`, 'PUT', body);
      showToast('Akun pengguna berhasil diperbarui!');
    } else {
      await apiRequest('/users', 'POST', body);
      showToast('Akun kasir baru berhasil ditambahkan!');
    }
    closeModal('modalUser');
    await loadUsersData();
  } catch (err) {
    showToast(err.message || 'Gagal menyimpan akun', 'error');
  }
}

function openModalResetPassword(id, name) {
  document.getElementById('resetUserId').value = id;
  document.getElementById('resetUserTargetText').textContent = `Reset password untuk pengguna '${name}'`;
  document.getElementById('newPassword').value = '';
  openModal('modalResetPassword');
}

async function handleResetPasswordSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('resetUserId').value;
  const password = document.getElementById('newPassword').value;

  try {
    await apiRequest(`/users/${id}/reset-password`, 'PUT', { password });
    showToast('Password akun berhasil direset!');
    closeModal('modalResetPassword');
  } catch (err) {
    showToast(err.message || 'Gagal mereset password', 'error');
  }
}

async function toggleUserStatus(id) {
  try {
    const res = await apiRequest(`/users/${id}/toggle-status`, 'PUT');
    showToast(res.message || 'Status akun berhasil diubah!');
    await loadUsersData();
  } catch (err) {
    showToast(err.message || 'Gagal mengubah status akun', 'error');
  }
}

async function loadActivityLogs() {
  const tbody = document.getElementById('logTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" class="text-center">Memuat rekam jejak log...</td></tr>';

  try {
    const res = await apiRequest('/logs?limit=100');
    const logs = res.data || [];

    if (logs.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="text-center">Belum ada catatan aktivitas.</td></tr>';
      return;
    }

    tbody.innerHTML = logs.map(l => {
      let actBadge = '<span class="badge badge-secondary">' + l.activity + '</span>';
      if (l.activity.includes('Login')) actBadge = '<span class="badge badge-primary"><i class="fa-solid fa-sign-in-alt"></i> Login</span>';
      else if (l.activity.includes('Transaksi')) actBadge = '<span class="badge badge-success"><i class="fa-solid fa-receipt"></i> Transaksi</span>';
      else if (l.activity.includes('Batal')) actBadge = '<span class="badge badge-danger"><i class="fa-solid fa-ban"></i> Batal</span>';

      return `
        <tr>
          <td>#${l.id}</td>
          <td><small class="text-muted">${new Date(l.created_at).toLocaleString('id-ID')}</small></td>
          <td><strong><i class="fa-solid fa-user mr-1 text-muted"></i> ${l.user_name}</strong></td>
          <td>${actBadge}</td>
          <td><small>${l.details || '-'}</small></td>
        </tr>
      `;
    }).join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Gagal memuat log aktivitas: ${err.message}</td></tr>`;
  }
}

/* ==========================================================================
   9. GENERATOR BARCODE & EKSPOR WORD (.docx)
   ========================================================================== */
function previewBarcode(code, name, price, id = null) {
  state.previewProductId = id;
  document.getElementById('barcodeProductName').textContent = name;
  document.getElementById('barcodeProductPrice').textContent = formatRupiah(price);
  document.getElementById('barcodeCodeDisplay').textContent = code;
  document.getElementById('barcodeImagePreview').src = `${API_BASE}/barcodes/generate?code=${encodeURIComponent(code)}`;
  openModal('modalBarcode');
}

function exportBarcodeWord(productId = null) {
  try {
    showToast('Sedang mengunduh file Microsoft Word (.docx)...');
    let url = `${API_BASE}/barcodes/export-word`;
    if (productId) {
      url += `?product_id=${productId}`;
    }
    window.location.href = url;
  } catch (err) {
    showToast('Gagal ekspor barcode ke Word: ' + err.message, 'error');
  }
}

function exportCurrentBarcodeWord() {
  if (!state.previewProductId) {
    exportBarcodeWord(null);
    return;
  }
  exportBarcodeWord(state.previewProductId);
}

/* ==========================================================================
   MENU PEMBUKUAN LOGIC (KAS MASUK, KAS KELUAR, LABA RUGI OTOMATIS)
   ========================================================================== */
async function loadPembukuanData() {
  try {
    // 1. Fetch Profit Loss Report
    const plRes = await fetchAPI('/ledger/reports/profit-loss');
    if (plRes && plRes.success && plRes.data) {
      const { revenue, cogs, expenses, net_profit } = plRes.data;
      document.getElementById('plTotalRevenue').textContent = formatRupiah(revenue.total_revenue);
      document.getElementById('plSalesCount').textContent = `${revenue.transaction_count} Transaksi Kasir`;
      document.getElementById('plTotalHpp').textContent = formatRupiah(cogs.total_hpp);
      document.getElementById('plTotalExpenses').textContent = formatRupiah(expenses.total_expenses);
      
      const netProfitElem = document.getElementById('plNetProfit');
      netProfitElem.textContent = formatRupiah(net_profit);
      if (net_profit < 0) {
        netProfitElem.style.color = '#ef4444';
      } else {
        netProfitElem.style.color = '#10b981';
      }
    }

    // 2. Fetch Journal Entries Table
    const typeFilter = document.getElementById('filterLedgerType')?.value || '';
    const paymentFilter = document.getElementById('filterLedgerPayment')?.value || '';

    let url = '/ledger/entries?';
    if (typeFilter) url += `type=${encodeURIComponent(typeFilter)}&`;
    if (paymentFilter) url += `payment_method=${encodeURIComponent(paymentFilter)}&`;

    const entriesRes = await fetchAPI(url);
    const tbody = document.getElementById('ledgerJournalTableBody');
    if (!tbody) return;

    if (entriesRes && entriesRes.success && Array.isArray(entriesRes.data)) {
      const entries = entriesRes.data;
      if (entries.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-muted">Belum ada transaksi kas yang dicatat. Klik "+ Input Kas Masuk" atau "- Input Kas Keluar" untuk memulai.</td></tr>`;
        return;
      }

      tbody.innerHTML = entries.map(item => {
        const isIncome = item.type === 'Kas Masuk';
        const badgeClass = isIncome ? 'badge-success' : 'badge-danger';
        const amountColor = isIncome ? 'color: #10b981; font-weight: 700;' : 'color: #ef4444; font-weight: 700;';
        const formattedDate = item.entry_date ? new Date(item.entry_date).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

        return `
          <tr>
            <td><code>${item.entry_no || '-'}</code></td>
            <td>${formattedDate}</td>
            <td><strong>${item.account_name || 'Kas'}</strong> <small class="text-muted">(${item.account_code || ''})</small></td>
            <td><span class="badge ${badgeClass}">${item.type}</span></td>
            <td style="${amountColor}">${isIncome ? '+' : '-'}${formatRupiah(item.amount)}</td>
            <td><span class="badge badge-secondary">${item.payment_method || 'Tunai'}</span></td>
            <td>${item.description || '-'} ${item.reference_no ? `<br><small class="text-muted">Ref: ${item.reference_no}</small>` : ''}</td>
            <td>${item.created_by || 'Admin'}</td>
            <td class="text-center">
              <button class="btn btn-sm btn-outline-danger" onclick="deleteJournalEntry(${item.id})" title="Hapus Transaksi Kas Ini">
                <i class="fa-solid fa-trash"></i>
              </button>
            </td>
          </tr>
        `;
      }).join('');
    } else {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center py-4 text-danger">Gagal memuat jurnal pembukuan.</td></tr>`;
    }
  } catch (err) {
    console.error('Error loadPembukuanData:', err);
    showToast('Gagal memuat data pembukuan: ' + err.message, 'danger');
  }
}

async function openModalJournalEntry(type = 'Kas Keluar') {
  document.getElementById('journalType').value = type;
  const titleElem = document.getElementById('modalJournalTitle');
  if (titleElem) {
    titleElem.innerHTML = type === 'Kas Masuk' 
      ? `<i class="fa-solid fa-plus-circle" style="color:#10b981;"></i> Form Input Kas Masuk (Pemasukan)` 
      : `<i class="fa-solid fa-minus-circle" style="color:#ef4444;"></i> Form Input Kas Keluar (Pengeluaran / Beban)`;
  }

  // Populate Accounts dropdown
  try {
    const res = await fetchAPI('/ledger/accounts');
    const select = document.getElementById('journalAccountId');
    if (select && res && res.success) {
      select.innerHTML = '<option value="">-- Pilih Kategori Akun --</option>' + 
        res.data.map(acc => `<option value="${acc.id}">[${acc.code}] ${acc.name} (${acc.type})</option>`).join('');
    }
  } catch (e) {
    console.warn('Gagal memuat kategori akun:', e);
  }

  // Set default date to today
  const dateInput = document.getElementById('journalDate');
  if (dateInput) {
    dateInput.value = new Date().toISOString().slice(0, 10);
  }

  document.getElementById('journalAmount').value = '';
  document.getElementById('journalDescription').value = '';
  document.getElementById('journalReferenceNo').value = '';

  openModal('modalJournalEntry');
}

async function handleJournalEntrySubmit(event) {
  event.preventDefault();
  const type = document.getElementById('journalType').value;
  const account_id = document.getElementById('journalAccountId').value;
  const payment_method = document.getElementById('journalPaymentMethod').value;
  const amount = parseFloat(document.getElementById('journalAmount').value) || 0;
  const entry_date = document.getElementById('journalDate').value;
  const description = document.getElementById('journalDescription').value;
  const reference_no = document.getElementById('journalReferenceNo').value;

  if (!account_id || !amount || amount <= 0 || !description) {
    showToast('Harap lengkapi akun, nominal, dan keterangan transaksi.', 'danger');
    return;
  }

  const btn = document.getElementById('btnSubmitJournal');
  const originalText = btn.innerHTML;
  btn.disabled = true;
  btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Menyimpan...';

  try {
    const res = await fetchAPI('/ledger/entries', 'POST', {
      type,
      account_id,
      payment_method,
      amount,
      entry_date,
      description,
      reference_no
    });

    btn.disabled = false;
    btn.innerHTML = originalText;

    if (res && res.success) {
      showToast(`Berhasil mencatat transaksi ${type}!`);
      closeModal('modalJournalEntry');
      await loadPembukuanData();
    } else {
      showToast(res.message || 'Gagal menyimpan transaksi kas.', 'danger');
    }
  } catch (err) {
    btn.disabled = false;
    btn.innerHTML = originalText;
    showToast('Error saat menyimpan jurnal: ' + err.message, 'danger');
  }
}

async function deleteJournalEntry(id) {
  if (!confirm('Apakah Anda yakin ingin menghapus transaksi kas ini dari pembukuan?')) return;

  try {
    const res = await fetchAPI(`/ledger/entries/${id}`, 'DELETE');
    if (res && res.success) {
      showToast('Transaksi kas berhasil dihapus!');
      await loadPembukuanData();
    } else {
      showToast(res.message || 'Gagal menghapus transaksi.', 'danger');
    }
  } catch (err) {
    showToast('Error menghapus transaksi: ' + err.message, 'danger');
  }
}

/* ==========================================================================
   INIT & EVENT LISTENERS
   ========================================================================== */
document.addEventListener('DOMContentLoaded', async () => {
  // Navigation event listeners
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.dataset.tab;
      switchTab(tabId);
    });
  });

  // Refresh Button listener
  document.getElementById('btnRefreshData').addEventListener('click', () => {
    refreshCurrentTabData();
    showToast('Data berhasil diperbarui!');
  });

  // Initial Auth & Data Load
  await autoLogin();
  await checkServerHealth();
  updateCategoryDropdowns();
  await loadSystemSettings();
  await refreshCurrentTabData();
});

