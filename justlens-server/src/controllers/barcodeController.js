const bwipjs = require('bwip-js');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, TextRun, AlignmentType, WidthType, BorderStyle } = require('docx');
const ProductModel = require('../models/productModel');

const barcodeController = {
  generatePng: async (req, res, next) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ success: false, message: 'Query code wajib diisi.' });
      }

      const pngBuffer = await bwipjs.toBuffer({
        bcid: 'code128',
        text: String(code),
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      });

      res.setHeader('Content-Type', 'image/png');
      return res.send(pngBuffer);
    } catch (error) {
      next(error);
    }
  },

  exportWord: async (req, res, next) => {
    try {
      const { product_ids } = req.body;
      let products = [];

      if (Array.isArray(product_ids) && product_ids.length > 0) {
        for (const id of product_ids) {
          const p = await ProductModel.getById(id);
          if (p) products.push(p);
        }
      } else {
        products = await ProductModel.getAll();
      }

      if (!products || products.length === 0) {
        return res.status(400).json({ success: false, message: 'Tidak ada data barang untuk dibuatkan label barcode.' });
      }

      // Generate barcode PNG buffer for each product
      const barcodeCells = [];
      for (const p of products) {
        let pngBuffer;
        try {
          pngBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: String(p.code),
            scale: 2,
            height: 10,
            includetext: false
          });
        } catch (err) {
          pngBuffer = null;
        }

        const formattedPrice = `Rp ${Number(p.sell_price || 0).toLocaleString('id-ID')}`;

        const cellChildren = [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: String(p.name).substring(0, 26),
                bold: true,
                size: 18 // 9pt
              })
            ]
          })
        ];

        if (pngBuffer) {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new ImageRun({
                  data: pngBuffer,
                  transformation: { width: 140, height: 35 }
                })
              ]
            })
          );
        }

        cellChildren.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: `${p.code} - `,
                size: 16
              }),
              new TextRun({
                text: formattedPrice,
                bold: true,
                size: 18
              })
            ]
          })
        );

        barcodeCells.push(
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' }
            },
            children: cellChildren
          })
        );
      }

      // Group cells into 3 columns per row table
      const tableRows = [];
      const COLS_PER_ROW = 3;

      for (let i = 0; i < barcodeCells.length; i += COLS_PER_ROW) {
        const rowCells = barcodeCells.slice(i, i + COLS_PER_ROW);
        // Fill remaining columns if not full
        while (rowCells.length < COLS_PER_ROW) {
          rowCells.push(
            new TableCell({
              width: { size: 30, type: WidthType.PERCENTAGE },
              borders: {
                top: { style: BorderStyle.NONE },
                bottom: { style: BorderStyle.NONE },
                left: { style: BorderStyle.NONE },
                right: { style: BorderStyle.NONE }
              },
              children: [new Paragraph({ text: '' })]
            })
          );
        }

        tableRows.push(
          new TableRow({
            children: rowCells
          })
        );
      }

      const doc = new Document({
        sections: [
          {
            properties: {
              page: {
                margin: { top: 720, bottom: 720, left: 720, right: 720 } // ~0.5 inch
              }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'LABEL BARCODE PRODUK JUSTLENS',
                    bold: true,
                    size: 24
                  })
                ]
              }),
              new Paragraph({ text: '' }),
              new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: tableRows
              })
            ]
          }
        ]
      });

      const buffer = await Packer.toBuffer(doc);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', 'attachment; filename="Label_Barcode_Produk_Justlens.docx"');
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
};

module.exports = barcodeController;
