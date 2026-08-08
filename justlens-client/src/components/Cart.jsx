import React, { useState } from 'react';
import { ShoppingBag, Trash2, User, CreditCard, DollarSign, Calculator, ChevronRight, AlertCircle, FileCheck2, ArrowRight } from 'lucide-react';
import { createTransaction } from '../services/api';

export default function Cart({
  cartItems = [],
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onTransactionSuccess
}) {
  const [customerName, setCustomerName] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('Lunas'); // 'Lunas', 'DP'
  const [dpAmount, setDpAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Tunai'); // 'Tunai', 'QRIS', 'Transfer'
  const [orderStatus, setOrderStatus] = useState('Diproses'); // 'Desain', 'Kirim Vendor', 'Diproses', 'Siap Diambil', 'Selesai'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Calculate cart grand total
  const grandTotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);

  // Remaining payment if DP
  const numericDp = paymentStatus === 'DP' ? Math.min(grandTotal, Number(dpAmount || 0)) : grandTotal;
  const remainingBalance = grandTotal - numericDp;

  // Handle Quick DP percentage calculation
  const setDpPercentage = (percent) => {
    const calculated = Math.round((grandTotal * percent) / 100);
    setDpAmount(calculated);
  };

  const handleCheckout = async () => {
    setErrorMessage('');
    if (!customerName.trim()) {
      setErrorMessage('Nama pelanggan wajib diisi.');
      return;
    }
    if (cartItems.length === 0) {
      setErrorMessage('Keranjang belanja masih kosong.');
      return;
    }
    if (paymentStatus === 'DP' && (!dpAmount || Number(dpAmount) <= 0)) {
      setErrorMessage('Jumlah DP (Down Payment) harus lebih dari 0.');
      return;
    }
    if (cartItems.some((item) => !item.qty || Number(item.qty) < 1)) {
      setErrorMessage('Jumlah kuantitas item tidak boleh kurang dari 1.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customer_name: customerName.trim(),
      total_amount: grandTotal,
      dp_amount: paymentStatus === 'DP' ? Number(dpAmount) : grandTotal,
      payment_status: paymentStatus,
      order_status: orderStatus,
      items: cartItems.map((item) => ({
        product_id: item.product_id || null,
        finishing_option_id: item.finishing_option_id || null,
        width: item.width || 0,
        length: item.length || 0,
        qty: item.qty,
        price: item.price,
        subtotal: item.subtotal,
        vendor_cost: item.vendor_cost || 0,
        // Extra meta for receipt/spk display
        name: item.name,
        code: item.code,
        color_option: item.color_option,
        side_option: item.side_option,
        selected_finishing: item.selected_finishing,
        notes: item.notes,
      }))
    };

    try {
      const transactionData = await createTransaction(payload);
      setIsSubmitting(false);
      
      // Callback to show Print Modal & Reset Cart
      if (onTransactionSuccess) {
        onTransactionSuccess({
          ...transactionData,
          customer_name: customerName.trim(),
          payment_method: paymentMethod,
          items: cartItems, // retain rich items with descriptions
        });
      }

      // Reset form
      setCustomerName('');
      setDpAmount('');
      setPaymentStatus('Lunas');
      onClearCart();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Gagal memproses transaksi.');
    }
  };

  return (
    <div className="w-full lg:w-[380px] xl:w-[420px] bg-slate-900 border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden shrink-0">
      
      {/* Cart Header */}
      <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
        <div className="flex items-center space-x-2 text-white font-bold text-base">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <span>Keranjang Belanja</span>
          <span className="bg-cyan-950 text-cyan-400 text-xs px-2 py-0.5 rounded-full border border-cyan-800">
            {cartItems.length} Item
          </span>
        </div>
        {cartItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Kosongkan
          </button>
        )}
      </div>

      {/* Cart Item List */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[360px] min-h-[160px]">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2 text-center p-4">
            <ShoppingBag className="w-10 h-10 text-slate-700" />
            <p className="text-xs font-medium text-slate-400">Keranjang masih kosong</p>
            <p className="text-[11px] text-slate-600">Klik produk di samping untuk menambahkan item transaksi.</p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={index}
              className="bg-slate-950/80 border border-slate-800 p-3 rounded-xl space-y-2 relative group hover:border-slate-700 transition-colors"
            >
              {/* Product Header & Delete */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded border border-cyan-800/40">
                    {item.code}
                  </span>
                  <h4 className="font-semibold text-xs text-white mt-0.5">{item.name}</h4>
                  
                  {/* Details Badges */}
                  <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-slate-400">
                    {item.is_metered && (
                      <span className="bg-amber-950/70 text-amber-300 px-1.5 py-0.5 rounded border border-amber-800/40">
                        {item.length}m x {item.width}m ({item.area_m2.toFixed(2)}m²)
                      </span>
                    )}
                    {item.color_option && (
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {item.color_option}
                      </span>
                    )}
                    {item.side_option && (
                      <span className="bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded">
                        {item.side_option}
                      </span>
                    )}
                  </div>

                  {/* Finishing Tags */}
                  {item.selected_finishing && item.selected_finishing.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
                      {item.selected_finishing.map((fin) => (
                        <span key={fin.id} className="bg-purple-950/80 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800/40">
                          +{fin.name}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Note */}
                  {item.notes && (
                    <p className="text-[10px] text-slate-400 italic mt-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                      "{item.notes}"
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onRemoveItem(index)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                  title="Hapus Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quantity Controls & Price */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-xs">
                <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(index, Math.max(1, (Number(item.qty) || 1) - 1))}
                    disabled={Number(item.qty) <= 1}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-white rounded font-bold flex items-center justify-center text-xs transition-colors"
                    title="Kurangi kuantitas"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.qty}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        onUpdateQty(index, '');
                      } else {
                        const parsed = parseInt(val, 10);
                        onUpdateQty(index, isNaN(parsed) ? 1 : Math.max(1, parsed));
                      }
                    }}
                    onBlur={() => {
                      if (!item.qty || Number(item.qty) < 1 || isNaN(Number(item.qty))) {
                        onUpdateQty(index, 1);
                      }
                    }}
                    className="w-16 bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded px-1.5 py-0.5 text-center font-mono font-bold text-xs text-white outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => onUpdateQty(index, (Number(item.qty) || 0) + 1)}
                    className="w-5 h-5 bg-slate-800 hover:bg-slate-700 text-white rounded font-bold flex items-center justify-center text-xs transition-colors"
                    title="Tambah kuantitas"
                  >
                    +
                  </button>
                </div>

                <span className="font-bold text-emerald-400 font-mono">
                  Rp {(Number(item.subtotal) || 0).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer & Payment Form */}
      {cartItems.length > 0 && (
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 space-y-3">
          
          {/* Customer Name */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-slate-300 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-cyan-400" /> Nama Pelanggan *
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Cth: Bpk. Ahmad / CV Maju Jaya"
              className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-500 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Payment Status & DP */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('Lunas')}
                className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  paymentStatus === 'Lunas'
                    ? 'bg-emerald-950 border-emerald-500 text-emerald-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                Bayar Lunas
              </button>
              <button
                type="button"
                onClick={() => setPaymentStatus('DP')}
                className={`py-1.5 text-xs font-bold rounded-xl border transition-all ${
                  paymentStatus === 'DP'
                    ? 'bg-amber-950 border-amber-500 text-amber-300 shadow'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                DP (Uang Muka)
              </button>
            </div>

            {/* DP Input & Quick % */}
            {paymentStatus === 'DP' && (
              <div className="space-y-1.5 bg-slate-900 p-2.5 rounded-xl border border-amber-500/30 animate-in fade-in duration-150">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-amber-300 font-medium">Nominal DP:</span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={() => setDpPercentage(30)}
                      className="px-2 py-0.5 bg-slate-800 text-[10px] text-amber-300 rounded border border-amber-800"
                    >
                      30%
                    </button>
                    <button
                      type="button"
                      onClick={() => setDpPercentage(50)}
                      className="px-2 py-0.5 bg-slate-800 text-[10px] text-amber-300 rounded border border-amber-800"
                    >
                      50%
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  value={dpAmount}
                  onChange={(e) => setDpAmount(e.target.value)}
                  placeholder="Masukkan nominal DP (Rp)..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-400 rounded-lg px-3 py-1.5 text-xs text-white font-mono outline-none"
                />
                <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                  <span>Sisa Tagihan (Pelunasan):</span>
                  <span className="font-bold text-rose-400">
                    Rp {Math.max(0, remainingBalance).toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Payment Method & Initial Status */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Metode Pembayaran</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="Tunai">Tunai / Cash</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer Bank</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-slate-400 font-medium mb-1">Status Order SPK</label>
              <select
                value={orderStatus}
                onChange={(e) => setOrderStatus(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
              >
                <option value="Desain">Desain</option>
                <option value="Diproses">Diproses Operator</option>
                <option value="Kirim Vendor">Kirim Vendor Outsource</option>
                <option value="Siap Diambil">Siap Diambil</option>
                <option value="Selesai">Selesai</option>
              </select>
            </div>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="p-2.5 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-200 flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Calculation Summary */}
          <div className="pt-2 border-t border-slate-800 space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Total Tagihan:</span>
              <span className="font-bold text-white font-mono">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between text-xs text-slate-400">
              <span>Dibayar Sekarang:</span>
              <span className="font-bold text-emerald-400 font-mono">
                Rp {numericDp.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={isSubmitting}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <span>Memproses...</span>
            ) : (
              <>
                <FileCheck2 className="w-4 h-4" />
                <span>Proses Transaksi & Cetak</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
}
