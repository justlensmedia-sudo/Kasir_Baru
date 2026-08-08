const ProductModel = require('../models/productModel');
const MaterialModel = require('../models/materialModel');
const FinishingModel = require('../models/finishingModel');
const VendorModel = require('../models/vendorModel');
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
      const { code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock } = req.body;

      if (!code || !name || !category) {
        return res.status(400).json({ success: false, message: 'Kode, nama produk, dan kategori wajib diisi.' });
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
        is_outsource,
        is_metered,
        base_price,
        sell_price,
        stock
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
      const { code, name, category, unit, is_outsource, is_metered, base_price, sell_price, stock } = req.body;

      const existing = await ProductModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Produk tidak ditemukan.' });
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
        is_outsource: is_outsource !== undefined ? is_outsource : existing.is_outsource,
        is_metered: is_metered !== undefined ? is_metered : existing.is_metered,
        base_price: base_price !== undefined ? base_price : existing.base_price,
        sell_price: sell_price !== undefined ? sell_price : existing.sell_price,
        stock: stock !== undefined ? stock : existing.stock
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
      const templateData = [
        {
          Kode_Barcode: 'PRD-001',
          Nama_Barang: 'Kertas HVS A4 80gsm (Rim)',
          Kategori: 'Cetak Lembaran',
          Harga_Modal: 35000,
          Harga_Jual: 55000,
          Stok_Awal: 50,
          Satuan: 'Rim'
        },
        {
          Kode_Barcode: 'PRD-OUT-001',
          Nama_Barang: 'Banner Flexi 280gr Standard',
          Kategori: 'Banner Outdoor',
          Harga_Modal: 12000,
          Harga_Jual: 25000,
          Stok_Awal: 999,
          Satuan: 'm²'
        },
        {
          Kode_Barcode: 'PRD-ATK-001',
          Nama_Barang: 'Pulpen Gel Hitam 0.5mm',
          Kategori: 'ATK',
          Harga_Modal: 2500,
          Harga_Jual: 5000,
          Stok_Awal: 24,
          Satuan: 'Pcs'
        }
      ];

      const worksheet = XLSX.utils.json_to_sheet(templateData);
      worksheet['!cols'] = [
        { wch: 18 },
        { wch: 35 },
        { wch: 20 },
        { wch: 15 },
        { wch: 15 },
        { wch: 12 },
        { wch: 12 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Produk');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Template_Import_Barang_Justlens.xlsx"');
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

        if (!code || !name) {
          errors.push(`Baris ${i + 2}: Kode_Barcode dan Nama_Barang wajib diisi.`);
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
          is_outsource,
          is_metered,
          base_price,
          sell_price,
          stock
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
