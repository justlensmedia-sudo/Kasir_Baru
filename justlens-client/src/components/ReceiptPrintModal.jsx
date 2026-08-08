import React, { useState, useEffect } from 'react';
import { Printer, FileText, X, Check, Store, RefreshCw, AlertCircle } from 'lucide-react';

export default function ReceiptPrintModal({ isOpen, onClose, transaction, defaultType = 'thermal' }) {
  const [printType, setPrintType] = useState(defaultType); // 'thermal' or 'spk'
  const [paperWidth, setPaperWidth] = useState('58mm'); // '58mm' or '80mm'
  const [printers, setPrinters] = useState([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [isPrinting, setIsPrinting] = useState(false);
  const [printStatus, setPrintStatus] = useState(null);
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const serverUrl = localStorage.getItem('justlens_server_url') || 'http://localhost:5000/api';
    const rootUrl = serverUrl.replace(/\/api\/?$/, '');
    setLogoUrl(`${rootUrl}/uploads/logo.png`);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && window.electronAPI && window.electronAPI.getPrinters) {
      window.electronAPI.getPrinters().then((list) => {
        setPrinters(list || []);
        const defaultP = (list || []).find((p) => p.isDefault) || (list || [])[0];
        if (defaultP) setSelectedPrinter(defaultP.name);
      });
    }
  }, [isOpen]);

  if (!isOpen || !transaction) return null;

  const handlePrint = async () => {
    if (window.electronAPI && window.electronAPI.silentPrint) {
      setIsPrinting(true);
      setPrintStatus(null);
      try {
        const printElement = document.querySelector('.print-area');
        const htmlContent = printElement ? printElement.innerHTML : '';

        const result = await window.electronAPI.silentPrint({
          htmlContent,
          printerName: selectedPrinter,
          silent: true,
        });

        if (result && result.success) {
          setPrintStatus({ type: 'success', text: 'Struk berhasil dicetak langsung (Silent Print)!' });
          setTimeout(() => setPrintStatus(null), 4000);
        } else {
          setPrintStatus({ type: 'error', text: `Gagal mencetak: ${result?.error || 'Periksa koneksi printer'}` });
        }
      } catch (err) {
        setPrintStatus({ type: 'error', text: `Error: ${err.message}` });
      } finally {
        setIsPrinting(false);
      }
    } else {
      window.print();
    }
  };

  const isDp = transaction.payment_status === 'DP';
  const totalAmount = Number(transaction.total_amount || 0);
  const dpAmount = Number(transaction.dp_amount || 0);
  const remaining = totalAmount - dpAmount;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header (No Print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/40 no-print">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-base">
            <Printer className="w-5 h-5" />
            <span>Cetak Struk & Nota SPK</span>
          </div>

          <div className="flex items-center space-x-2">
            {/* Print Type Toggle */}
            <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex text-xs">
              <button
                onClick={() => setPrintType('thermal')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  printType === 'thermal'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Struk Thermal
              </button>
              <button
                onClick={() => setPrintType('spk')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  printType === 'spk'
                    ? 'bg-purple-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Nota SPK (Operator)
              </button>
            </div>

            {printType === 'thermal' && (
              <select
                value={paperWidth}
                onChange={(e) => setPaperWidth(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-white text-xs rounded-xl px-2.5 py-1.5 outline-none"
              >
                <option value="58mm">Thermal 58mm</option>
                <option value="80mm">Thermal 80mm</option>
              </select>
            )}

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable View Container */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/50 flex justify-center">
          
          {/* THERMAL RECEIPT VIEW */}
          {printType === 'thermal' && (
            <div
              className={`print-area bg-white text-black font-mono text-[11px] leading-tight p-4 shadow-xl border border-slate-300 rounded ${
                paperWidth === '58mm' ? 'w-[260px]' : 'w-[340px]'
              }`}
            >
              {/* Header */}
              <div className="text-center pb-3 mb-2 border-b border-dashed border-black flex flex-col items-center">
                {logoUrl && (
                  <img
                    src={logoUrl}
                    alt="Logo Usaha"
                    className="h-10 max-w-[120px] object-contain mb-1"
                    onError={() => setLogoUrl(null)}
                  />
                )}
                <h2 className="font-extrabold text-sm uppercase tracking-wide">JUSTLENS PERCETAKAN</h2>
                <p className="text-[10px]">Jl. Raya Grafika No. 88, Digital Printing</p>
                <p className="text-[10px]">Telp/WA: 0812-3456-7890</p>
              </div>

              {/* Transaction Info */}
              <div className="space-y-0.5 text-[10px] pb-2 border-b border-dashed border-black">
                <div className="flex justify-between">
                  <span>No TRX:</span>
                  <span className="font-bold">{transaction.transaction_no}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan:</span>
                  <span className="font-bold">{transaction.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span>{new Date(transaction.created_at || Date.now()).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-bold uppercase">{transaction.payment_status}</span>
                </div>
              </div>

              {/* Items List */}
              <div className="py-2 space-y-2 border-b border-dashed border-black">
                {transaction.items &&
                  transaction.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-bold uppercase">
                        {item.name || item.product_name || 'Produk'}
                      </div>
                      
                      {/* Dimensions / Specs */}
                      {(item.length > 0 || item.width > 0) && (
                        <div className="text-[9px] text-gray-700">
                          Ukuran: {item.length}m x {item.width}m ({(Number(item.length) * Number(item.width)).toFixed(2)} m²)
                        </div>
                      )}
                      
                      {item.color_option && (
                        <div className="text-[9px] text-gray-700">
                          Spec: {item.color_option} - {item.side_option}
                        </div>
                      )}

                      {/* Finishing list */}
                      {item.selected_finishing && item.selected_finishing.length > 0 && (
                        <div className="text-[9px] text-gray-700">
                          Finishing: {item.selected_finishing.map((f) => f.name).join(', ')}
                        </div>
                      )}

                      {item.notes && (
                        <div className="text-[9px] italic">
                          Ket: "{item.notes}"
                        </div>
                      )}

                      <div className="flex justify-between pt-0.5">
                        <span>
                          {item.qty} x Rp {Number(item.price).toLocaleString('id-ID')}
                        </span>
                        <span className="font-bold">
                          Rp {Number(item.subtotal).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              {/* Totals */}
              <div className="py-2 space-y-1 text-[11px] border-b border-dashed border-black">
                <div className="flex justify-between font-bold">
                  <span>TOTAL:</span>
                  <span>Rp {totalAmount.toLocaleString('id-ID')}</span>
                </div>

                <div className="flex justify-between">
                  <span>DIBAYAR ({transaction.payment_method || 'Tunai'}):</span>
                  <span className="font-bold">Rp {dpAmount.toLocaleString('id-ID')}</span>
                </div>

                {isDp ? (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>SISA (PIUTANG):</span>
                    <span>Rp {remaining.toLocaleString('id-ID')}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-gray-700">
                    <span>Kembali / Sisa:</span>
                    <span>Rp 0</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="text-center pt-3 text-[9px] text-gray-600 space-y-1">
                <p className="font-bold uppercase">Terima Kasih Atas Kepercayaan Anda</p>
                <p>Simpan Struk ini sebagai bukti pengambilan barang.</p>
                <p className="pt-1">=== Justlens POS System ===</p>
              </div>
            </div>
          )}

          {/* SPK WORK ORDER NOTA (A4 / LETTER VIEW) */}
          {printType === 'spk' && (
            <div className="print-area bg-white text-black p-6 rounded shadow-xl w-full max-w-xl border border-gray-300 font-sans text-xs space-y-4">
              
              {/* Header SPK */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-3">
                <div className="flex items-center space-x-3">
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo Usaha"
                      className="h-12 max-w-[120px] object-contain"
                      onError={() => setLogoUrl(null)}
                    />
                  )}
                  <div>
                    <h1 className="text-lg font-extrabold tracking-wide uppercase text-slate-900">LEMBAR SPK (WORK ORDER)</h1>
                    <p className="text-xs text-gray-600 font-medium">Instruksi Cetak & Pengerjaan Workshop</p>
                  </div>
                </div>
                <div className="text-right font-mono">
                  <span className="font-bold text-sm text-cyan-800 bg-cyan-50 px-2.5 py-1 rounded border border-cyan-200">
                    {transaction.transaction_no}
                  </span>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Tgl: {new Date(transaction.created_at || Date.now()).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Customer Info */}
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Nama Pelanggan:</span>
                  <span className="font-extrabold text-sm text-slate-900">{transaction.customer_name}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-gray-500 font-bold uppercase block">Status Pengerjaan:</span>
                  <span className="font-extrabold text-xs text-purple-700 bg-purple-100 px-2 py-0.5 rounded border border-purple-300 uppercase">
                    {transaction.order_status || 'Diproses'}
                  </span>
                </div>
              </div>

              {/* Specs Table */}
              <div>
                <h3 className="font-bold text-xs uppercase text-slate-800 mb-1.5">Detail Spesifikasi Pengerjaan:</h3>
                <table className="w-full border-collapse border border-gray-300 text-left text-xs">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-300 text-slate-700">
                      <th className="p-2 border border-gray-300">No</th>
                      <th className="p-2 border border-gray-300">Produk / Item</th>
                      <th className="p-2 border border-gray-300">Ukuran (P x L)</th>
                      <th className="p-2 border border-gray-300">Finishing / Specs</th>
                      <th className="p-2 border border-gray-300 text-center">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transaction.items &&
                      transaction.items.map((item, idx) => (
                        <tr key={idx} className="border-b border-gray-200">
                          <td className="p-2 border border-gray-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border border-gray-300 font-bold">
                            {item.name || item.product_name || 'Produk'}
                            {item.notes && (
                              <div className="text-[10px] text-red-600 font-normal italic mt-0.5">
                                Catatan: {item.notes}
                              </div>
                            )}
                          </td>
                          <td className="p-2 border border-gray-300 font-mono">
                            {item.length > 0 && item.width > 0
                              ? `${item.length}m x ${item.width}m (${(Number(item.length) * Number(item.width)).toFixed(2)}m²)`
                              : 'Satuan'}
                          </td>
                          <td className="p-2 border border-gray-300 text-[11px]">
                            <div>{item.color_option || 'Full Color'} - {item.side_option || '1 Sisi'}</div>
                            {item.selected_finishing && item.selected_finishing.length > 0 && (
                              <div className="font-semibold text-purple-800 mt-0.5">
                                Finishing: {item.selected_finishing.map((f) => f.name).join(', ')}
                              </div>
                            )}
                          </td>
                          <td className="p-2 border border-gray-300 text-center font-bold text-sm">
                            {item.qty}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Signatures & Notes */}
              <div className="grid grid-cols-2 gap-4 pt-6 text-center">
                <div className="space-y-12">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Petugas Kasir / Admin</p>
                  <p className="font-bold underline text-xs">( .................................... )</p>
                </div>
                <div className="space-y-12">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Operator Cetak / Vendor</p>
                  <p className="font-bold underline text-xs">( .................................... )</p>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer Actions (No Print) */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3.5 bg-slate-950/60 border-t border-slate-800 no-print gap-2">
          
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {printers.length > 0 && (
              <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1 text-xs">
                <Printer className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <select
                  value={selectedPrinter}
                  onChange={(e) => setSelectedPrinter(e.target.value)}
                  className="bg-transparent text-slate-200 outline-none cursor-pointer max-w-[180px] truncate text-xs"
                >
                  {printers.map((p, idx) => (
                    <option key={idx} value={p.name} className="bg-slate-900 text-white">
                      {p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {printStatus && (
              <div
                className={`text-xs px-3 py-1 rounded-xl flex items-center space-x-1.5 font-medium ${
                  printStatus.type === 'success'
                    ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-300'
                    : 'bg-rose-950 border border-rose-500/50 text-rose-300'
                }`}
              >
                {printStatus.type === 'success' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                )}
                <span>{printStatus.text}</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              {isPrinting ? (
                <RefreshCw className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Printer className="w-4 h-4" />
              )}
              <span>
                {window.electronAPI?.silentPrint ? 'Cetak Langsung (Silent)' : 'Cetak Sekarang'}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
