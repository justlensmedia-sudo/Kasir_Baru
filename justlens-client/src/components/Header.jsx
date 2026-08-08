import React, { useState, useEffect } from 'react';
import { Server, Wifi, WifiOff, RefreshCw, ClipboardList, Printer, Store } from 'lucide-react';

export default function Header({ 
  isConnected, 
  serverUrl, 
  onOpenServerModal, 
  onSyncData, 
  isSyncing,
  onOpenOrderTracker,
  activeOrderCount = 0,
  currentUser,
  onOpenShiftSummary,
  onLogout
}) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [logoUrl, setLogoUrl] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isConnected && serverUrl) {
      import('../services/api').then(({ getShopLogo }) => {
        getShopLogo().then((url) => setLogoUrl(url));
      });
    }
  }, [isConnected, serverUrl, isSyncing]);

  return (
    <header className="bg-slate-900 border-b border-slate-800 px-4 py-3 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Brand & Logo */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg text-white flex items-center justify-center overflow-hidden border border-cyan-400/30">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo Usaha"
                className="w-full h-full object-contain p-0.5 bg-slate-900/50"
                onError={() => setLogoUrl(null)}
              />
            ) : (
              <Store className="w-6 h-6" />
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Justlens <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-400 font-semibold border border-cyan-500/30">POS Kasir & Percetakan</span>
            </h1>
            <p className="text-xs text-slate-400">Kasir Express & Kalkulator Cetak Outdoor</p>
          </div>
        </div>

        {/* Server Connection Badge & Actions */}
        <div className="flex items-center flex-wrap gap-2 text-sm">
          
          {/* Active Cashier Badge */}
          {currentUser && (
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs text-slate-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="font-bold text-cyan-300">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">({currentUser.role})</span>
            </div>
          )}

          {/* Shift Report Button */}
          <button
            onClick={onOpenShiftSummary}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/80 text-xs font-medium transition-colors"
            title="Lihat Laporan Shift Harian"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shift Harian</span>
          </button>

          {/* Connection Status Button */}
          <button
            onClick={onOpenServerModal}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              isConnected
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300 hover:bg-rose-900/60'
            }`}
            title="Klik untuk mengubah Pengaturan IP Server"
          >
            {isConnected ? <Wifi className="w-4 h-4 text-emerald-400 animate-pulse" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
            <span className="truncate max-w-[140px]">
              {serverUrl.replace(/^https?:\/\//, '')}
            </span>
          </button>

          {/* Sync Master Data */}
          <button
            onClick={onSyncData}
            disabled={isSyncing}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors disabled:opacity-50"
            title="Sinkronkan data produk & finishing dari server"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync Data</span>
          </button>

          {/* Order Tracker SPK Button */}
          <button
            onClick={onOpenOrderTracker}
            className="relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all active:scale-95"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Daftar Order SPK</span>
            {activeOrderCount > 0 && (
              <span className="ml-1 bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full animate-bounce">
                {activeOrderCount}
              </span>
            )}
          </button>

          {/* Logout Button */}
          {currentUser && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors"
              title="Keluar dari akun kasir"
            >
              Logout
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
