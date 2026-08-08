const bwipjs = require('bwip-js');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, ImageRun, TextRun, AlignmentType, WidthType, BorderStyle } = require('docx');
const ProductModel = require('../models/productModel');

function toImageBuffer(dataInput) {
  if (!dataInput) return null;
  if (Buffer.isBuffer(dataInput)) return dataInput;
  if (typeof dataInput === 'string') {
    const cleanBase64 = dataInput.replace(/^data:image\/\w+;base64,/, '');
    return Buffer.from(cleanBase64, 'base64');
  }
  return null;
}

const barcodeController = {
  generatePng: async (req, res, next) => {
    try {
      let { code } = req.query;
      if (!code || String(code).trim() === '') {
        code = 'PRD-001';
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
      try {
        const fallbackBuffer = await bwipjs.toBuffer({
          bcid: 'code128',
          text: 'PRD-001',
          scale: 3,
          height: 10,
          includetext: true,
          textxalign: 'center',
        });
        res.setHeader('Content-Type', 'image/png');
        return res.send(fallbackBuffer);
      } catch (err2) {
        next(error);
      }
    }
  },

  exportWord: async (req, res, next) => {
    try {
      // Support GET query parameters and POST body
      const productId = req.query?.product_id || req.query?.id || req.body?.product_id;
      const productIds = req.body?.product_ids || (req.query?.ids ? req.query.ids.split(',') : null);

      let products = [];

      if (productId) {
        const p = await ProductModel.getById(productId);
        if (p) products.push(p);
      } else if (Array.isArray(productIds) && productIds.length > 0) {
        for (const id of productIds) {
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
        let code = (p.code || '').toString().trim();
        if (!code) {
          code = `PRD-${p.id || Math.floor(Math.random() * 1000)}`;
        }

        let rawBuffer = null;
        try {
          rawBuffer = await bwipjs.toBuffer({
            bcid: 'code128',
            text: code,
            scale: 2,
            height: 10,
            includetext: false
          });
        } catch (err) {
          console.warn(`[BWIP-JS] Warning for code '${code}':`, err.message);
          try {
            const safeCode = `PRD${p.id || 100}`;
            rawBuffer = await bwipjs.toBuffer({
              bcid: 'code128',
              text: safeCode,
              scale: 2,
              height: 10,
              includetext: false
            });
            code = safeCode;
          } catch (err2) {
            rawBuffer = null;
          }
        }

        const pngBuffer = toImageBuffer(rawBuffer);
        const formattedPrice = `Rp ${Number(p.sell_price || 0).toLocaleString('id-ID')}`;
        const productName = (p.name || 'Barang').substring(0, 30);

        const cellChildren = [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'JUSTLENS PRINT',
                bold: true,
                size: 14,
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: productName,
                bold: true,
                size: 18
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
                  transformation: { width: 135, height: 35 }
                })
              ]
            })
          );
        } else {
          cellChildren.push(
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({
                  text: `[BARCODE: ${code}]`,
                  bold: true,
                  size: 16
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
                text: `${code}  •  `,
                size: 15,
                color: '475569'
              }),
              new TextRun({
                text: formattedPrice,
                bold: true,
                size: 18,
                color: '059669'
              })
            ]
          })
        );

        barcodeCells.push(
          new TableCell({
            width: { size: 30, type: WidthType.PERCENTAGE },
            margins: { top: 100, bottom: 100, left: 100, right: 100 },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
              right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' }
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
                margin: { top: 720, bottom: 720, left: 720, right: 720 }
              }
            },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'LABEL BARCODE PRODUK - JUSTLENS',
                    bold: true,
                    size: 24,
                    color: '1E293B'
                  })
                ]
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Siap Cetak ke Kertas Stiker Label Produk',
                    size: 16,
                    color: '64748B'
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

      const fileName = productId && products[0]?.code
        ? `Label_Barcode_${String(products[0].code).replace(/[^a-zA-Z0-9_-]/g, '')}.docx`
        : 'Label_Barcode_Produk_Justlens.docx';

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      return res.send(buffer);
    } catch (error) {
      console.error('Error generating barcode word document:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat dokumen Word label barcode: ' + error.message
      });
    }
  }
};

module.exports = barcodeController;
