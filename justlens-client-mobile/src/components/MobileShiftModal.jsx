import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle, Clock, ShieldAlert } from 'lucide-react';
import { getDailyShiftReport } from '../services/api';

export default function MobileShiftModal({ isOpen, onClose, currentUser }) {
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchReport(reportDate);
    }
  }, [isOpen, reportDate]);

  const fetchReport = async (dateStr) => {
    setLoading(true);
    try {
      const data = await getDailyShiftReport(dateStr);
      setReportData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const summary = reportData?.summary || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in">
        
        {/* Header */}
        <div className="p-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-white">Laporan Shift Harian</h3>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Pilih Tanggal:</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white"
            />
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-400 text-xs">Memuat laporan...</div>
          ) : (
            <>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <span className="text-[11px] text-slate-400">Total Omset Penjualan</span>
                <p className="text-xl font-bold text-emerald-400 mt-1">
                  Rp {Number(summary.total_revenue || 0).toLocaleString('id-ID')}
                </p>
                <p className="text-[11px] text-cyan-400 mt-0.5">{summary.total_transactions || 0} Transaksi</p>
              </div>

              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span className="text-slate-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> Lunas</span>
                  <span className="font-bold text-white">Rp {Number(summary.total_lunas_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between border-b border-slate-850 pb-1">
                  <span className="text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-amber-400" /> DP Masuk</span>
                  <span className="font-bold text-amber-400">Rp {Number(summary.total_dp_amount || 0).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 flex items-center gap-1"><ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Belum Bayar</span>
                  <span className="font-bold text-rose-400">Rp {Number(summary.total_unpaid_amount || 0).toLocaleString('id-ID')}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-850 border-t border-slate-800">
          <button onClick={onClose} className="w-full py-2 bg-slate-800 text-slate-200 text-xs font-bold rounded-xl">
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
