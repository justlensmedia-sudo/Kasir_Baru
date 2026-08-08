import React, { useState, useEffect } from 'react';
import { X, Printer, Calendar, DollarSign, Receipt, CheckCircle, Clock, CreditCard, ShieldAlert } from 'lucide-react';

export default function ShiftSummaryModal({ isOpen, onClose, serverUrl, currentUser }) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDailyReport(reportDate);
    }
  }, [isOpen, reportDate]);

  const fetchDailyReport = async (dateStr) => {
    setLoading(true);
    try {
      const baseUrl = serverUrl.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/reports/daily-shift?date=${dateStr}`);
      const result = await res.json();
      if (result.success) {
        setReportData(result.data);
      }
    } catch (err) {
      console.error('Gagal memuat laporan shift harian:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePrintThermal = () => {
    window.print();
  };

  const summary = reportData?.summary || {};
  const breakdown = reportData?.breakdown || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        {/* Header */}
        <div className="bg-slate-850 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Laporan Harian / Selesai Shift Kasir</h2>
              <p className="text-xs text-slate-400">Ringkasan total omset dan rincian transaksi harian</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Date Filter & Cashier Badge */}
        <div className="p-4 bg-slate-950/50 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-cyan-400" />
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="text-xs text-slate-300">
            Kasir Aktif: <span className="font-bold text-cyan-400">{currentUser?.name || 'Kasir'}</span> ({currentUser?.role || 'kasir'})
          </div>
        </div>

        {/* Report Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Memuat data laporan shift...</div>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium">Total Omset Harian</span>
                  <p className="text-lg font-bold text-emerald-400 mt-1">
                    Rp {Number(summary.total_revenue || 0).toLocaleString('id-ID')}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium">Total Transaksi</span>
                  <p className="text-lg font-bold text-cyan-400 mt-1">
                    {summary.total_transactions || 0} Transaksi
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3.5 rounded-xl">
                  <span className="text-[11px] text-slate-400 font-medium">Total Terbayar / DP</span>
                  <p className="text-lg font-bold text-amber-400 mt-1">
                    Rp {Number((summary.total_lunas_amount || 0) + (summary.total_dp_amount || 0)).toLocaleString('id-ID')}
                  </p>
                </div>
              </div>

              {/* Rincian Status Pembayaran */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-2">Rincian Pembayaran Kasir</h3>
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-850">
                  <span className="text-slate-400 flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Transaksi Lunas</span>
                  <span className="font-bold text-white">Rp {Number(summary.total_lunas_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1 border-b border-slate-850">
                  <span className="text-slate-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> DP Masuk</span>
                  <span className="font-bold text-amber-400">Rp {Number(summary.total_dp_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between items-center text-xs py-1">
                  <span className="text-slate-400 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Piutang / Belum Bayar</span>
                  <span className="font-bold text-rose-400">Rp {Number(summary.total_unpaid_amount || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-300">Daftar Transaksi Tanggal {reportDate}</h3>
                <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                  {(reportData?.transactions || []).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-xs">Belum ada transaksi pada tanggal ini.</div>
                  ) : (
                    (reportData?.transactions || []).map((t, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between text-xs hover:bg-slate-900/60">
                        <div>
                          <span className="font-mono font-bold text-cyan-400">{t.transaction_no}</span>
                          <span className="text-slate-300 ml-2">{t.customer_name}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-white">Rp {Number(t.total_amount || 0).toLocaleString('id-ID')}</span>
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] ${t.payment_status === 'Lunas' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
                            {t.payment_status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-850 border-t border-slate-800 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl">
            Tutup
          </button>
          <button
            onClick={handlePrintThermal}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center space-x-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Laporan Harian</span>
          </button>
        </div>
      </div>
    </div>
  );
}
