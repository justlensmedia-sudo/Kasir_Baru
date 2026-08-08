# Dokumen Kebutuhan Sistem: Justlens System (POS Percetakan & Outsource)

Dokumen ini merupakan spesifikasi teknis untuk pengembangan ekosistem **Justlens System**, yang terbagi menjadi 2 aplikasi utama:
1. **Justlens Server (Backoffice & API)**
2. **Justlens Client (Frontend Kasir)**

---

## 1. Arsitektur System Overview

+-----------------------------------------------------------------+
|                    1. JUSTLENS SERVER                           |
|  - Management Stok, Bahan Baku, & ATK                           |
|  - Management Supplier & Vendor Outsource                       |
|  - Kalkulasi Harga Modal vs Harga Jual (Laba Kotor)             |
|  - Database Relasional & Endpoint REST API                      |
+-----------------------------------------------------------------+
                                |
                                | REST API (JSON) / WebSocket
                                v
+-----------------------------------------------------------------+
|                    2. JUSTLENS CLIENT                           |
|  - UI Khusus Kasir (Scan Barcode & Pencarian)                   |
|  - Kalkulator Percetakan (P x L, Lembaran, Tiered, Finishing)   |
|  - Penerbitan SPK, DP (Down Payment), & Pelunasan               |
|  - Cetak Struk Thermal & Tanda Terima                           |
+-----------------------------------------------------------------+

---

## 2. Spesifikasi Justlens Server (Backoffice & API)

### 2.1. Fitur Utama
* **Management Inventory & Stok:**
  * Stok In-House (Kertas HVS/A3/A4, Mika, Ring Jilid, Toner/Tinta, ATK).
  * Pemotongan stok otomatis untuk produk fisik & bahan baku.
  * Peringatan stok menipis (*low stock alert*).
* **Management Supplier & Vendor Outsource:**
  * Pendataan supplier bahan baku dan vendor digital printing besar (Banner/Spanduk/Stiker).
  * Recording harga modal vendor vs harga jual pelanggan untuk menghitung Laba Kotor secara presisi.
* **Master Price List & Pricing Engine:**
  * Setting harga lembaran (Hitam-Putih vs Warna, 1 Sisi vs Bolak-balik).
  * Setting harga bertingkat (*Tiered Pricing* berdasarkan volume).
  * Setting harga per meter persegi ($Panjang \times Lebar$).
  * Add-ons layanan finishing (Jilid, Laminating, Cutting).
* **REST API Endpoints:**
  * Auth: `/api/auth/login`
  * Master Data Sync: `GET /api/products/sync`, `GET /api/vendors`
  * Transaksi: `POST /api/transactions/create`, `GET /api/orders/status`
  * Laporan: `GET /api/reports/profit-loss`

### 2.2. Database Schema (PostgreSQL / SQLite)
* `users` (id, name, role, password_hash)
* `suppliers` (id, name, phone, address)
* `vendors` (id, name, service_type, base_cost_per_m2)
* `products` (id, code, name, category, is_outsource, is_metered, base_price, sell_price, stock)
* `finishing_options` (id, name, price)
* `transactions` (id, transaction_no, customer_name, total_amount, dp_amount, payment_status, order_status)
* `transaction_items` (id, transaction_id, product_id, width, length, qty, subtotal, vendor_cost)

---

## 3. Spesifikasi Justlens Client (Frontend Kasir)

### 3.1. Fitur Utama
* **Antarmuka Kasir Murni:**
  * Tampilan ringkas, intuitif, dan *responsive* hanya untuk transaksi kasir (tanpa menu kelola stok/supplier).
  * Pemindaian barcode barang ATK secara cepat.
  * Mode pencarian produk instan yang tersinkronkan dari server.
* **Kalkulator Percetakan Integratif:**
  * Input otomatis $Panjang \times Lebar$ untuk produk cetak outdoor/banner.
  * Pilihan variasi warna (B/W vs Color) dan opsi bolak-balik.
  * Opsi checkbox untuk layanan finishing (Jilid, Laminating, Cut).
* **Sistem Pembayaran & Work Order (SPK):**
  * Pencatatan DP (Down Payment) dan Pelunasan saat pengambilan barang.
  * Opsi pembayaran Tunai, QRIS, dan Transfer.
  * Pelacakan status pengerjaan (*Desain -> Kirim Vendor -> Diproses -> Siap Diambil*).
* **Pencetakan Nota/Struk:**
  * Cetak Struk Thermal (58mm/80mm) dan cetak SPK / Tanda Terima A4.

---

## 4. Tech Stack Recommendations
* [cite_start]**Server:** Node.js (Express) atau Laravel, Database SQLite/PostgreSQL[cite: 11, 25].
* [cite_start]**Client:** React.js / Vite + Tailwind CSS atau Flutter Desktop/Web[cite: 10, 28].