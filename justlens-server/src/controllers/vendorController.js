const VendorModel = require('../models/vendorModel');

const vendorController = {
  getAll: async (req, res, next) => {
    try {
      const vendors = await VendorModel.getAll();
      res.json({ success: true, data: vendors });
    } catch (error) {
      next(error);
    }
  },

  getById: async (req, res, next) => {
    try {
      const vendor = await VendorModel.getById(req.params.id);
      if (!vendor) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }
      res.json({ success: true, data: vendor });
    } catch (error) {
      next(error);
    }
  },

  create: async (req, res, next) => {
    try {
      const { name, service_type, base_cost_per_m2 } = req.body;
      if (!name || !service_type) {
        return res.status(400).json({ success: false, message: 'Nama vendor dan jenis layanan wajib diisi.' });
      }

      const id = await VendorModel.create({ name, service_type, base_cost_per_m2 });
      const newVendor = await VendorModel.getById(id);
      res.status(201).json({ success: true, message: 'Vendor berhasil ditambahkan.', data: newVendor });
    } catch (error) {
      next(error);
    }
  },

  update: async (req, res, next) => {
    try {
      const { name, service_type, base_cost_per_m2 } = req.body;
      const { id } = req.params;

      const existing = await VendorModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }

      await VendorModel.update(id, { name, service_type, base_cost_per_m2 });
      const updatedVendor = await VendorModel.getById(id);
      res.json({ success: true, message: 'Vendor berhasil diperbarui.', data: updatedVendor });
    } catch (error) {
      next(error);
    }
  },

  delete: async (req, res, next) => {
    try {
      const { id } = req.params;
      const existing = await VendorModel.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Vendor tidak ditemukan.' });
      }

      await VendorModel.delete(id);
      res.json({ success: true, message: 'Vendor berhasil dihapus.' });
    } catch (error) {
      next(error);
    }
  },

  downloadExcel: async (req, res, next) => {
    try {
      const XLSX = require('xlsx');
      const FinishingModel = require('../models/finishingModel');
      
      const dbVendors = await VendorModel.getAll();
      const dbFinishing = await FinishingModel.getAll();

      let vendorRows = [];
      if (dbVendors && dbVendors.length > 0) {
        vendorRows = dbVendors.map((v) => ({
          ID_Vendor: v.id,
          Nama_Vendor: v.name,
          Jenis_Layanan: v.service_type,
          Biaya_Modal_m2: v.base_cost_per_m2 || 0
        }));
      } else {
        vendorRows = [
          { ID_Vendor: 1, Nama_Vendor: 'Vendor Print Pro', Jenis_Layanan: 'Digital Printing Banner Outdoor', Biaya_Modal_m2: 12000 },
          { ID_Vendor: 2, Nama_Vendor: 'Vendor Decal Stiker', Jenis_Layanan: 'Cetak Stiker High-Res', Biaya_Modal_m2: 35000 }
        ];
      }

      let finishingRows = [];
      if (dbFinishing && dbFinishing.length > 0) {
        finishingRows = dbFinishing.map((f) => ({
          ID_Finishing: f.id,
          Nama_Finishing: f.name,
          Harga_Finishing: f.price || 0
        }));
      } else {
        finishingRows = [
          { ID_Finishing: 1, Nama_Finishing: 'Jilid Ring Kawat', Harga_Finishing: 15000 },
          { ID_Finishing: 2, Nama_Finishing: 'Laminating Glossy A4', Harga_Finishing: 5000 }
        ];
      }

      const workbook = XLSX.utils.book_new();

      const wsVendor = XLSX.utils.json_to_sheet(vendorRows);
      wsVendor['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 35 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, wsVendor, 'Vendor_Outsource');

      const wsFinishing = XLSX.utils.json_to_sheet(finishingRows);
      wsFinishing['!cols'] = [{ wch: 14 }, { wch: 35 }, { wch: 18 }];
      XLSX.utils.book_append_sheet(workbook, wsFinishing, 'Finishing_Options');

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Pricelist_Vendor_Dan_Finishing_Justlens.xlsx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  },

  importExcel: async (req, res, next) => {
    try {
      const XLSX = require('xlsx');
      const FinishingModel = require('../models/finishingModel');

      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Harap unggah file Excel (.xlsx / .xls).' });
      }

      const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
      let createdVendors = 0, updatedVendors = 0;
      let createdFinishing = 0, updatedFinishing = 0;

      // 1. Process Sheet 1 or Vendors
      const vendorSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('vendor')) || workbook.SheetNames[0];
      if (vendorSheetName && workbook.Sheets[vendorSheetName]) {
        const vRows = XLSX.utils.sheet_to_json(workbook.Sheets[vendorSheetName]);
        for (const row of vRows) {
          const id = parseInt(row['ID_Vendor'] || row['id'] || 0, 10) || null;
          const name = String(row['Nama_Vendor'] || row['name'] || '').trim();
          const service_type = String(row['Jenis_Layanan'] || row['service_type'] || 'Custom Service').trim();
          const base_cost_per_m2 = parseFloat(row['Biaya_Modal_m2'] || row['base_cost_per_m2'] || 0) || 0;

          if (name) {
            const resV = await VendorModel.upsert({ id, name, service_type, base_cost_per_m2 });
            if (resV.status === 'created') createdVendors++;
            else if (resV.status === 'updated') updatedVendors++;
          }
        }
      }

      // 2. Process Sheet 2 or Finishing Options
      const finishingSheetName = workbook.SheetNames.find(s => s.toLowerCase().includes('finishing'));
      if (finishingSheetName && workbook.Sheets[finishingSheetName]) {
        const fRows = XLSX.utils.sheet_to_json(workbook.Sheets[finishingSheetName]);
        for (const row of fRows) {
          const id = parseInt(row['ID_Finishing'] || row['id'] || 0, 10) || null;
          const name = String(row['Nama_Finishing'] || row['name'] || '').trim();
          const price = parseFloat(row['Harga_Finishing'] || row['price'] || 0) || 0;

          if (name) {
            const resF = await FinishingModel.upsert({ id, name, price });
            if (resF.status === 'created') createdFinishing++;
            else if (resF.status === 'updated') updatedFinishing++;
          }
        }
      }

      res.json({
        success: true,
        message: `Berhasil mengimpor data Pricelist & Vendor: Vendor (${createdVendors} baru, ${updatedVendors} diperbarui), Finishing (${createdFinishing} baru, ${updatedFinishing} diperbarui).`,
        data: { createdVendors, updatedVendors, createdFinishing, updatedFinishing }
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = vendorController;
