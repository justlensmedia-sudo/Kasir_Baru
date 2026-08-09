const ProductModel = require('../models/productModel');
const MaterialModel = require('../models/materialModel');
const FinishingModel = require('../models/finishingModel');
const VendorModel = require('../models/vendorModel');
const SupplierModel = require('../models/supplierModel');
const XLSX = require('xlsx');

const productController = {
  getAll: async (req, res, next) => {
    try {
      const { category } = req.query;
      const products = await ProductModel.getAll(category);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const product = await ProductModel.getById(req.params.id);
      if (!product) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }
      res.json({ success: true, data: product });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id } = req.body;

      if (!code || !name || !category) {
        return res.status(400).json({ success: false, message: 'Kode, nama produk, dan kategori wajib diisi.' });
      }

      if (!supplier_id) {
        return res.status(400).json({ success: false, message: 'Supplier ID wajib diisi dan terdaftar di database.' });
      }

      const supplier = await SupplierModel.getById(supplier_id);
      if (!supplier) {
        return res.status(400).json({ success: false, message: `Supplier dengan ID '${supplier_id}' tidak terdaftar di database.` });
      }

      const existingCode = await ProductModel.getByCode(code);
      if (existingCode) {
        return res.status(400).json({ success: false, message: `Kode produk '${code}' sudah digunakan.` });
      }

      const id = await ProductModel.create({
        code,
        name,
        category,
        unit: unit || 'Pcs',
        base_unit: base_unit || 'lembar',
        purchase_unit: purchase_unit || 'rim',
        conversion_ratio: conversion_ratio !== undefined ? Number(conversion_ratio) : 500,
        tiered_pricing: tiered_pricing || null,
        is_discountable: is_discountable !== undefined ? (is_discountable ? 1 : 0) : 1,
        max_discount_percent: max_discount_percent !== undefined ? Number(max_discount_percent) : 0,
        is_outsource,
        is_metered,
        base_price,
        sell_price,
        stock,
        supplier_id
      });

      const newProduct = await ProductModel.getById(id);
      res.status(201).json({ success: true, message: 'Produk berhasil ditambahkan.', data: newProduct });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { code, name, category, unit, base_unit, purchase_unit, conversion_ratio, tiered_pricing, is_discountable, max_discount_percent, is_outsource, is_metered, base_price, sell_price, stock, supplier_id } = req.body;

      const existing = await ProductModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }

      const targetSupplierId = supplier_id !== undefined ? supplier_id : existing.supplier_id;
      if (!targetSupplierId) {
        return res.status(400).json({ success: false, message: 'Supplier ID wajib diisi dan terdaftar di database.' });
      }
      const supplier = await SupplierModel.getById(targetSupplierId);
      if (!supplier) {
        return res.status(400).json({ success: false, message: `Supplier dengan ID '${targetSupplierId}' tidak terdaftar di database.` });
      }

      if (code && code !== existing.code) {
        const checkCode = await ProductModel.getByCode(code);
        if (checkCode) {
          return res.status(400).json({ success: false, message: `Kode produk '${code}' sudah digunakan.` });
        }
      }

      await ProductModel.update(id, {
        code: code || existing.code,
        name: name || existing.name,
        category: category || existing.category,
        unit: unit || existing.unit || 'Pcs',
        base_unit: base_unit || existing.base_unit || 'lembar',
        purchase_unit: purchase_unit || existing.purchase_unit || 'rim',
        conversion_ratio: conversion_ratio !== undefined ? Number(conversion_ratio) : (existing.conversion_ratio || 500),
        tiered_pricing: tiered_pricing !== undefined ? tiered_pricing : existing.tiered_pricing,
        is_discountable: is_discountable !== undefined ? (is_discountable ? 1 : 0) : (existing.is_discountable !== undefined ? existing.is_discountable : 1),
        max_discount_percent: max_discount_percent !== undefined ? Number(max_discount_percent) : (existing.max_discount_percent || 0),
        is_outsource: is_outsource !== undefined ? is_outsource : existing.is_outsource,
        is_metered: is_metered !== undefined ? is_metered : existing.is_metered,
        base_price: base_price !== undefined ? base_price : existing.base_price,
        sell_price: sell_price !== undefined ? sell_price : existing.sell_price,
        stock: stock !== undefined ? stock : existing.stock,
        supplier_id: targetSupplierId
      });

      const updatedProduct = await ProductModel.getById(id);
      res.json({ success: true, message: 'Produk berhasil diperbarui.', data: updatedProduct });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await ProductModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
      }

      await ProductModel.delete(id);
      res.json({ success: true, message: 'Produk berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  },

  getLowStock: async (req, res, next) => {
    try {
      const threshold = req.query.threshold ? parseInt(req.query.threshold) : 10;
      const products = await ProductModel.getLowStock(threshold);
      res.json({ success: true, data: products });
    } catch (error) {
      next(error);
    }
  },

  downloadTemplateExcel: async (req, res, next) => {
    try {
      const dbProducts = await ProductModel.getAll();
      let excelRows = [];

      if (dbProducts && dbProducts.length > 0) {
        excelRows = dbProducts.map((p) => ({
          Kode_Barcode: p.code,
          Nama_Barang: p.name,
          Kategori: p.category,
          Harga_Modal: p.base_price || 0,
          Harga_Jual: p.sell_price || 0,
          Stok_Awal: p.stock || 0,
          Satuan: p.unit || 'Pcs',
          Satuan_Dasar: p.base_unit || 'lembar',
          Satuan_Beli: p.purchase_unit || 'rim',
          Rasio_Konversi: p.conversion_ratio || 500,
          Dapat_Diskon: p.is_discountable ? 1 : 0,
          Max_Diskon_Persen: p.max_discount_percent || 0,
          ID_Supplier: p.supplier_id || '',
          Nama_Supplier: p.supplier_name || ''
        }));
      } else {
        excelRows = [
          {
            Kode_Barcode: 'PRD-001',
            Nama_Barang: 'Kertas HVS A4 80gsm (Rim)',
            Kategori: 'Cetak Lembaran',
            Harga_Modal: 35000,
            Harga_Jual: 55000,
            Stok_Awal: 50,
            Satuan: 'Rim',
            Satuan_Dasar: 'lembar',
            Satuan_Beli: 'rim',
            Rasio_Konversi: 500,
            Dapat_Diskon: 1,
            Max_Diskon_Persen: 10,
            ID_Supplier: 1,
            Nama_Supplier: 'PT Paper Indah'
          }
        ];
      }

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 38 },
        { wch: 22 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 },
        { wch: 14 },
        { wch: 14 },
        { wch: 15 },
        { wch: 14 },
        { wch: 18 },
        { wch: 14 },
        { wch: 25 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Master_Barang');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Data_Master_Barang_Justlens.xlsx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  importExcel: async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Harap unggah file Excel (.xlsx / .xls).' });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      if (!rows || rows.length === 0) {
        return res.status(400).json({ success: false, message: 'File Excel kosong atau format tidak sesuai.' });
      }

      let createdCount = 0;
      let updatedCount = 0;
      const errors = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const code = String(row['Kode_Barcode'] || row['code'] || row['Kode'] || '').trim();
        const name = String(row['Nama_Barang'] || row['name'] || row['Nama'] || '').trim();
        const category = String(row['Kategori'] || row['category'] || 'Umum').trim();
        const base_price = parseFloat(row['Harga_Modal'] || row['base_price'] || 0) || 0;
        const sell_price = parseFloat(row['Harga_Jual'] || row['sell_price'] || 0) || 0;
        const stock = parseFloat(row['Stok_Awal'] || row['stock'] || 0) || 0;
        const unit = String(row['Satuan'] || row['unit'] || 'Pcs').trim();
        const base_unit = String(row['Satuan_Dasar'] || row['base_unit'] || 'lembar').trim();
        const purchase_unit = String(row['Satuan_Beli'] || row['purchase_unit'] || 'rim').trim();
        const conversion_ratio = parseFloat(row['Rasio_Konversi'] || row['conversion_ratio'] || 500) || 500;
        const is_discountable = row['Dapat_Diskon'] !== undefined ? (parseInt(row['Dapat_Diskon'], 10) === 0 ? 0 : 1) : 1;
        const max_discount_percent = parseFloat(row['Max_Diskon_Persen'] || row['max_discount_percent'] || 0) || 0;
        const supplier_id = parseInt(row['ID_Supplier'] || row['supplier_id'] || 0, 10) || null;

        if (!code || !name) {
          errors.push(`Baris ${i + 2}: Kode_Barcode dan Nama_Barang wajib diisi.`);
          continue;
        }

        if (!supplier_id) {
          errors.push(`Baris ${i + 2}: ID_Supplier wajib diisi (Mandatory Relation).`);
          continue;
        }

        const supplier = await SupplierModel.getById(supplier_id);
        if (!supplier) {
          errors.push(`Baris ${i + 2}: Supplier dengan ID '${supplier_id}' tidak ditemukan di database.`);
          continue;
        }

        const catLower = category.toLowerCase();
        const is_outsource = catLower.includes('banner') || catLower.includes('outsource') || catLower.includes('spanduk') || catLower.includes('stiker') ? 1 : 0;
        const is_metered = catLower.includes('banner') || catLower.includes('spanduk') || catLower.includes('m2') ? 1 : 0;

        const result = await ProductModel.upsertByCode({
          code,
          name,
          category,
          unit,
          base_unit,
          purchase_unit,
          conversion_ratio,
          is_discountable,
          max_discount_percent,
          is_outsource,
          is_metered,
          base_price,
          sell_price,
          stock,
          supplier_id
        });

        if (result.status === 'created') createdCount++;
        else if (result.status === 'updated') updatedCount++;
      }

      res.json({
        success: true,
        message: `Berhasil mengimpor barang via Excel: ${createdCount} produk baru ditambahkan, ${updatedCount} produk diperbarui.`,
        data: { createdCount, updatedCount, errors }
      });
    } catch (error) {
      next(error);
    }
  },

  // Endpoint khusus sync Kasir (GET /api/products/sync)
  sync: async (req, res, next) => {
    try {
      const products = await ProductModel.getAll();
      const materials = await MaterialModel.getAll();
      const finishingOptions = await FinishingModel.getAll();
      const vendors = await VendorModel.getAll();

      const { get } = require('../config/database');
      const logoRow = await get("SELECT value FROM settings WHERE key = 'logo_url'");
      const logo_url = logoRow ? logoRow.value : '/uploads/logo.png';

      res.json({
        success: true,
        message: 'Master data berhasil disinkronisasi.',
        data: {
          products,
          materials,
          finishing_options: finishingOptions,
          vendors,
          logo_url,
          synced_at: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = productController;
