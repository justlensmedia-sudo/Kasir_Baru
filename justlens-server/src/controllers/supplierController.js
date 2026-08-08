const SupplierModel = require('../models/supplierModel');

const supplierController = {
  getAll: async (req, res, next) => {
    try {
      const suppliers = await SupplierModel.getAll();
      res.json({ success: true, data: suppliers });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const supplier = await SupplierModel.getById(req.params.id);
      if (!supplier) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }
      res.json({ success: true, data: supplier });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, phone, address } = req.body;
      if (!name) {
        return res.status(400).json({ success: false, message: 'Nama supplier wajib diisi.' });
      }

      const id = await SupplierModel.create({ name, phone, address });
      const newSupplier = await SupplierModel.getById(id);
      res.status(201).json({ success: true, message: 'Supplier berhasil ditambahkan.', data: newSupplier });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, phone, address } = req.body;
      const { id } = req.params;

      const existing = await SupplierModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }

      await SupplierModel.update(id, { name, phone, address });
      const updatedSupplier = await SupplierModel.getById(id);
      res.json({ success: true, message: 'Supplier berhasil diperbarui.', data: updatedSupplier });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await SupplierModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Supplier tidak ditemukan.' });
      }

      await SupplierModel.delete(id);
      res.json({ success: true, message: 'Supplier berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  },

  downloadExcel: async (req, res, next) => {
    try {
      const XLSX = require('xlsx');
      const dbSuppliers = await SupplierModel.getAll();
      let excelRows = [];

      if (dbSuppliers && dbSuppliers.length > 0) {
        excelRows = dbSuppliers.map((s) => ({
          ID_Supplier: s.id,
          Nama_Supplier: s.name,
          No_Telepon: s.phone || '',
          Alamat: s.address || ''
        }));
      } else {
        excelRows = [
          {
            ID_Supplier: 1,
            Nama_Supplier: 'PT Paper Utama',
            No_Telepon: '081234567890',
            Alamat: 'Jl. Industri Paper No. 45, Jakarta'
          },
          {
            ID_Supplier: 2,
            Nama_Supplier: 'CV Tinta Cemerlang',
            No_Telepon: '089876543210',
            Alamat: 'Jl. Grafika No. 12, Bandung'
          }
        ];
      }

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      worksheet['!cols'] = [
        { wch: 12 },
        { wch: 32 },
        { wch: 18 },
        { wch: 45 }
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data_Supplier');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Data_Supplier_Justlens.xlsx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  importExcel: async (req, res, next) => {
    try {
      const XLSX = require('xlsx');
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
        const id = parseInt(row['ID_Supplier'] || row['id'] || 0, 10) || null;
        const name = String(row['Nama_Supplier'] || row['name'] || row['Nama'] || '').trim();
        const phone = String(row['No_Telepon'] || row['phone'] || row['Telepon'] || '').trim();
        const address = String(row['Alamat'] || row['address'] || '').trim();

        if (!name) {
          errors.push(`Baris ${i + 2}: Nama_Supplier wajib diisi.`);
          continue;
        }

        const result = await SupplierModel.upsert({ id, name, phone, address });
        if (result.status === 'created') createdCount++;
        else if (result.status === 'updated') updatedCount++;
      }

      res.json({
        success: true,
        message: `Berhasil mengimpor data Supplier: ${createdCount} baru ditambahkan, ${updatedCount} diperbarui.`,
        data: { createdCount, updatedCount, errors }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = supplierController;
