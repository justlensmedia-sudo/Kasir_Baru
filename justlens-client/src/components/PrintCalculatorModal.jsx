import React, { useState, useEffect } from 'react';
import { Calculator, X, Check, FileText, Palette, Scissors, Sparkles, Layers } from 'lucide-react';

export default function PrintCalculatorModal({
  isOpen,
  onClose,
  product,
  finishingOptions = [],
  onAddToCart
}) {
  if (!isOpen || !product) return null;

  const isMetered = Boolean(product.is_metered);
  const isOutsource = Boolean(product.is_outsource);

  // States
  const [length, setLength] = useState(isMetered ? 1.0 : 0);
  const [width, setWidth] = useState(isMetered ? 1.0 : 0);
  const [qty, setQty] = useState(1);
  const [colorOption, setColorOption] = useState('Full Color'); // Full Color, Black White
  const [sideOption, setSideOption] = useState('1 Sisi'); // 1 Sisi, 2 Sisi
  const [selectedFinishing, setSelectedFinishing] = useState([]);
  const [customNotes, setCustomNotes] = useState('');

  // Reset fields on open
  useEffect(() => {
    if (product) {
      setLength(isMetered ? 1.0 : 0);
      setWidth(isMetered ? 1.0 : 0);
      setQty(1);
      setColorOption('Full Color');
      setSideOption('1 Sisi');
      setSelectedFinishing([]);
      setCustomNotes('');
    }
  }, [product, isMetered]);

  // Area calculation in m2
  const areaM2 = isMetered ? Math.max(0.01, Number(length || 0) * Number(width || 0)) : 1;

  // Base price per m2 or unit
  const baseUnitPrice = Number(product.sell_price || 0);

  // Multiplier for color / sides
  let specMultiplier = 1;
  if (colorOption === 'Black White') specMultiplier *= 0.8;
  if (sideOption === '2 Sisi') specMultiplier *= 1.75;

  // Finishing total price per unit
  const finishingTotalCost = selectedFinishing.reduce((sum, finId) => {
    const fin = finishingOptions.find((f) => f.id === finId);
    return sum + (fin ? Number(fin.price || 0) : 0);
  }, 0);

  // Subtotal calculation per item line
  // If metered: (baseUnitPrice * areaM2 * specMultiplier + finishingTotalCost) * qty
  // If unit: (baseUnitPrice * specMultiplier + finishingTotalCost) * qty
  const unitCalculatedPrice = Math.round((baseUnitPrice * areaM2 * specMultiplier) + finishingTotalCost);
  const totalSubtotal = unitCalculatedPrice * Math.max(1, qty);

  // Vendor cost calculation for outsource
  const vendorCostPerM2 = Number(product.base_price || 0);
  const calculatedVendorCost = isOutsource
    ? Math.round(vendorCostPerM2 * (isMetered ? areaM2 : 1) * Math.max(1, qty))
    : 0;

  const toggleFinishing = (finId) => {
    setSelectedFinishing((prev) =>
      prev.includes(finId) ? prev.filter((id) => id !== finId) : [...prev, finId]
    );
  };

  const handleAdd = () => {
    const cartItem = {
      product_id: product.id,
      code: product.code,
      name: product.name,
      category: product.category,
      is_metered: isMetered,
      is_outsource: isOutsource,
      length: isMetered ? Number(length) : 0,
      width: isMetered ? Number(width) : 0,
      area_m2: isMetered ? areaM2 : 0,
      color_option: colorOption,
      side_option: sideOption,
      selected_finishing: selectedFinishing.map((id) => finishingOptions.find((f) => f.id === id)).filter(Boolean),
      finishing_option_id: selectedFinishing[0] || null, // Primary finishing ID for DB compatibility
      notes: customNotes.trim(),
      qty: Math.max(1, Number(qty)),
      price: unitCalculatedPrice,
      subtotal: totalSubtotal,
      vendor_cost: calculatedVendorCost,
    };

    onAddToCart(cartItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-base">
            <Calculator className="w-5 h-5" />
            <span>Kalkulator Cetak & Finishing</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          
          {/* Product Header Card */}
          <div className="bg-slate-950/70 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800/50">
                {product.code}
              </span>
              <h4 className="font-bold text-white text-sm mt-1">{product.name}</h4>
              <p className="text-xs text-slate-400">{product.category}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block">Harga Acuan</span>
              <span className="text-sm font-extrabold text-emerald-400">
                Rp {baseUnitPrice.toLocaleString('id-ID')}
                {isMetered ? ' / m²' : ''}
              </span>
            </div>
          </div>

          {/* Metered Input Section (Panjang x Lebar) */}
          {isMetered && (
            <div className="bg-slate-800/50 border border-amber-500/30 p-4 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <Calculator className="w-4 h-4" /> Dimensi Cetak Meteran ($Panjang \times Lebar$)
                </label>
                <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                  {areaM2.toFixed(2)} m²
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Panjang (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-medium mb-1">Lebar (Meter)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={width}
                    onChange={(e) => setWidth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Specification Options (Color & Sides) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-cyan-400" /> Warna
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setColorOption('Full Color')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    colorOption === 'Full Color'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Color
                </button>
                <button
                  type="button"
                  onClick={() => setColorOption('Black White')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    colorOption === 'Black White'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  B / W
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-cyan-400" /> Cetak Sisi
              </label>
              <div className="grid grid-cols-2 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setSideOption('1 Sisi')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sideOption === '1 Sisi'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  1 Sisi
                </button>
                <button
                  type="button"
                  onClick={() => setSideOption('2 Sisi')}
                  className={`py-1.5 text-xs font-medium rounded-lg transition-all ${
                    sideOption === '2 Sisi'
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  2 Sisi
                </button>
              </div>
            </div>
          </div>

          {/* Finishing Services Checkboxes */}
          {finishingOptions.length > 0 && (
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
                <Scissors className="w-3.5 h-3.5 text-amber-400" /> Layanan Finishing Tambahan
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {finishingOptions.map((fin) => {
                  const isChecked = selectedFinishing.includes(fin.id);
                  return (
                    <div
                      key={fin.id}
                      onClick={() => toggleFinishing(fin.id)}
                      className={`p-2.5 rounded-xl border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isChecked
                          ? 'bg-amber-950/60 border-amber-500/50 text-amber-200 shadow'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-amber-500 border-amber-400 text-slate-950'
                              : 'border-slate-700'
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <span className="font-medium text-white">{fin.name}</span>
                      </div>
                      <span className="font-semibold text-emerald-400 text-[11px]">
                        +Rp {Number(fin.price).toLocaleString('id-ID')}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Qty & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Jumlah (Qty)</label>
              <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-sm text-white font-bold outline-none"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" /> Catatan Khusus Pengerjaan
              </label>
              <input
                type="text"
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Cth: Ring mata ayam 4 sudut / Potong pas gambar..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-slate-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          {/* Price Calculation Summary Box */}
          <div className="bg-slate-950 border border-cyan-500/30 p-3.5 rounded-xl space-y-1.5">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Perhitungan Luas:</span>
              <span className="font-mono text-white">
                {isMetered ? `${length}m x ${width}m = ${areaM2.toFixed(2)} m²` : 'Satuan'}
              </span>
            </div>
            {selectedFinishing.length > 0 && (
              <div className="flex justify-between text-xs text-slate-400">
                <span>Total Finishing:</span>
                <span className="text-amber-400">
                  +Rp {finishingTotalCost.toLocaleString('id-ID')}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <span className="text-xs font-bold text-slate-300">Estimasi Subtotal:</span>
              <span className="text-lg font-extrabold text-emerald-400">
                Rp {totalSubtotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-5 py-3.5 bg-slate-950/60 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all flex items-center space-x-1.5"
          >
            <Sparkles className="w-4 h-4" />
            <span>Tambahkan ke Keranjang</span>
          </button>
        </div>

      </div>
    </div>
  );
}
