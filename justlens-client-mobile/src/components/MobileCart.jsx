import React, { useState } from 'react';
import { ShoppingBag, Trash2, Plus, Minus, Check, CreditCard, User, AlertCircle } from 'lucide-react';
import { createTransaction } from '../services/api';

export default function MobileCart({
  cartItems,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  currentUser
}) {
  const [customerName, setCustomerName] = useState('Pelanggan Umum');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [paymentStatus, setPaymentStatus] = useState('Lunas');
  const [dpAmount, setDpAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const totalAmount = cartItems.reduce((sum, item) => sum + (Number(item.subtotal) || 0), 0);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      setErrorMsg('Keranjang masih kosong!');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        customer_name: customerName || 'Pelanggan Umum',
        customer_phone: '',
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        dp_amount: paymentStatus === 'DP' ? Number(dpAmount) || 0 : 0,
        notes,
        created_by: currentUser?.name || 'Kasir Mobile',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          category: item.category || 'General',
          is_outsource: item.is_outsource ? 1 : 0,
          is_metered: item.is_metered ? 1 : 0,
          vendor_cost_per_unit: item.vendor_cost_per_unit || 0,
          width_cm: item.width_cm || 0,
          height_cm: item.height_cm || 0,
          qty: item.qty,
          unit_price: item.price,
          finishing_id: item.finishing_id || null,
          finishing_name: item.finishing_name || '',
          finishing_cost: item.finishing_cost || 0,
          subtotal: item.subtotal
        }))
      };

      const result = await createTransaction(payload);
      setSuccessMsg(`Transaksi Berhasil! No: ${result.data.transaction_no}`);
      onClearCart();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memproses checkout transaksi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-4">
      
      {/* Title */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <ShoppingBag className="w-5 h-5 text-cyan-400" />
          <h2 className="text-sm font-bold text-white">Keranjang Belanja Mobile</h2>
        </div>
        <span className="text-xs bg-cyan-500/20 text-cyan-400 font-bold px-2 py-0.5 rounded-full border border-cyan-500/30">
          {cartItems.length} Produk
        </span>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Cart Items List */}
      <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
        {cartItems.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-xs">
            Keranjang kosong. Klik barang atau gunakan <span className="text-cyan-400 font-semibold">Scan Barcode</span>.
          </div>
        ) : (
          cartItems.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs gap-2">
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white truncate">{item.name}</p>
                <p className="text-[11px] text-slate-400">
                  Rp {Number(item.price).toLocaleString('id-ID')}
                </p>
              </div>

              {/* Qty Controls */}
              <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => onUpdateQty(idx, item.qty - 1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="font-bold text-white px-1">{item.qty}</span>
                <button
                  onClick={() => onUpdateQty(idx, item.qty + 1)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right min-w-[70px]">
                <p className="font-bold text-cyan-400">
                  Rp {Number(item.subtotal).toLocaleString('id-ID')}
                </p>
              </div>

              {/* Delete Button */}
              <button
                onClick={() => onRemoveItem(idx)}
                className="p-1 text-rose-400 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Customer Info & Payment Details */}
      {cartItems.length > 0 && (
        <div className="space-y-3 pt-2 border-t border-slate-800">
          
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">Nama Pemesan</label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Nama Pemesan"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Metode</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
              >
                <option value="Tunai">Tunai</option>
                <option value="QRIS">QRIS</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Status Pembayaran</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2 py-1.5 text-xs text-white"
              >
                <option value="Lunas">Lunas</option>
                <option value="DP">DP / Panjar</option>
              </select>
            </div>
          </div>

          {paymentStatus === 'DP' && (
            <div>
              <label className="block text-[11px] font-semibold text-amber-400 mb-1">Nominal Uang DP (Rp)</label>
              <input
                type="number"
                value={dpAmount}
                onChange={(e) => setDpAmount(e.target.value)}
                placeholder="Masukkan nominal DP"
                className="w-full bg-slate-950 border border-amber-500/50 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-bold"
              />
            </div>
          )}

          {/* Grand Total */}
          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Total Tagihan:</span>
            <span className="text-base font-extrabold text-emerald-400">
              Rp {Number(totalAmount).toLocaleString('id-ID')}
            </span>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleCheckout}
            disabled={loading || cartItems.length === 0}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <CreditCard className="w-4 h-4" />
                <span>Bayar Transaksi Sekarang</span>
              </>
            )}
          </button>

        </div>
      )}

    </div>
  );
}
