import React, { useState, useEffect } from 'react';
import { ClipboardList, X, Search, RefreshCw, CheckCircle2, Clock, Truck, Printer, FileText, Check, DollarSign } from 'lucide-react';
import { getOrders, updateOrderStatus } from '../services/api';

export default function OrderTrackerModal({ isOpen, onClose, onSelectPrint }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const data = await getOrders(statusFilter);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();
    }
  }, [isOpen, statusFilter]);

  if (!isOpen) return null;

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, { order_status: newStatus });
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Gagal memperbarui status order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handlePelunasan = async (order) => {
    if (!window.confirm(`Proses pelunasan transaksi ${order.transaction_no} untuk ${order.customer_name}?`)) return;
    setUpdatingId(order.id);
    try {
      await updateOrderStatus(order.id, {
        payment_status: 'Lunas',
        dp_amount: order.total_amount
      });
      await fetchOrders();
    } catch (err) {
      alert(err.message || 'Gagal memproses pelunasan.');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      (o.transaction_no && o.transaction_no.toLowerCase().includes(term)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(term))
    );
  });

  const statusBadge = (status) => {
    switch (status) {
      case 'Desain':
        return <span className="bg-purple-950 text-purple-300 border border-purple-800 px-2 py-0.5 rounded text-[10px] font-bold">🎨 Desain</span>;
      case 'Kirim Vendor':
        return <span className="bg-indigo-950 text-indigo-300 border border-indigo-800 px-2 py-0.5 rounded text-[10px] font-bold">🚚 Kirim Vendor</span>;
      case 'Diproses':
        return <span className="bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded text-[10px] font-bold">⚙️ Diproses</span>;
      case 'Siap Diambil':
        return <span className="bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded text-[10px] font-bold">📦 Siap Diambil</span>;
      case 'Selesai':
        return <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded text-[10px] font-bold">✅ Selesai</span>;
      default:
        return <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px]">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-base">
            <ClipboardList className="w-5 h-5" />
            <span>Pelacakan Order & SPK Work Orders</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/60 flex flex-wrap gap-2.5 items-center justify-between">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari TRX / Nama Pelanggan..."
              className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none"
            />
          </div>

          {/* Filter Status Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto text-xs">
            {['', 'Desain', 'Diproses', 'Kirim Vendor', 'Siap Diambil', 'Selesai'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                  statusFilter === st
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {st || 'Semua Status'}
              </button>
            ))}
            <button
              onClick={fetchOrders}
              disabled={isLoading}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg ml-1"
              title="Refresh Data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Orders List Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs">Memuat data order SPK...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-slate-500 space-y-2">
              <ClipboardList className="w-10 h-10 text-slate-700" />
              <p className="text-xs">Tidak ada data order transaksi ditemukan.</p>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isDp = order.payment_status === 'DP';
              const remaining = Number(order.total_amount || 0) - Number(order.dp_amount || 0);

              return (
                <div
                  key={order.id}
                  className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl space-y-3 hover:border-slate-700 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2">
                    <div>
                      <span className="font-mono text-cyan-400 font-bold text-sm">
                        {order.transaction_no}
                      </span>
                      <h4 className="font-bold text-white text-sm mt-0.5">
                        {order.customer_name}
                      </h4>
                      <span className="text-[10px] text-slate-500 block">
                        Tanggal: {new Date(order.created_at).toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Payment Status Badge */}
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                          isDp
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isDp ? `DP (Sisa Rp ${remaining.toLocaleString('id-ID')})` : 'LUNAS'}
                      </span>

                      {/* Order Status Badge */}
                      {statusBadge(order.order_status)}
                    </div>
                  </div>

                  {/* Items Summary Table */}
                  {order.items && order.items.length > 0 && (
                    <div className="bg-slate-900/60 p-2.5 rounded-lg text-xs space-y-1">
                      {order.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300 text-[11px]">
                          <span>
                            {it.product_name || it.name || 'Produk'} {it.qty}x ({it.width && it.length ? `${it.width}m x ${it.length}m` : 'Satuan'})
                          </span>
                          <span className="font-mono font-semibold">
                            Rp {Number(it.subtotal).toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actions & Status Changer Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
                    
                    {/* Status Dropdown */}
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400 text-[11px]">Ubah Status:</span>
                      <select
                        value={order.order_status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="bg-slate-900 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 outline-none focus:border-cyan-500"
                      >
                        <option value="Desain">Desain</option>
                        <option value="Diproses">Diproses Operator</option>
                        <option value="Kirim Vendor">Kirim Vendor Outsource</option>
                        <option value="Siap Diambil">Siap Diambil</option>
                        <option value="Selesai">Selesai</option>
                      </select>
                    </div>

                    {/* Buttons: Pelunasan & Print */}
                    <div className="flex items-center space-x-2">
                      {isDp && (
                        <button
                          onClick={() => handlePelunasan(order)}
                          disabled={updatingId === order.id}
                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-[11px] flex items-center space-x-1 transition-colors"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Pelunasan</span>
                        </button>
                      )}

                      <button
                        onClick={() => onSelectPrint(order, 'thermal')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-[11px] flex items-center space-x-1 border border-slate-700 transition-colors"
                      >
                        <Printer className="w-3 h-3" />
                        <span>Struk Thermal</span>
                      </button>

                      <button
                        onClick={() => onSelectPrint(order, 'spk')}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-purple-300 rounded-lg text-[11px] flex items-center space-x-1 border border-slate-700 transition-colors"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Nota SPK</span>
                      </button>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
