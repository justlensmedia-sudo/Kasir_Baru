import React from 'react';
import { Camera, Store, RefreshCw, Wifi, WifiOff, Receipt, LogOut } from 'lucide-react';

export default function MobileHeader({
  isConnected,
  serverUrl,
  currentUser,
  onOpenScanCamera,
  onOpenServerModal,
  onSyncData,
  isSyncing,
  onOpenShiftModal,
  onLogout
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 p-3 sticky top-0 z-30 shadow-lg">
      <div className="flex items-center justify-between gap-2">
        
        {/* Brand */}
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight">Justlens Mobile</h1>
            <p className="text-[10px] text-slate-400">Kasir Android</p>
          </div>
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-1.5">
          
          {/* Scan Barcode Camera Button */}
          <button
            onClick={onOpenScanCamera}
            className="flex items-center space-x-1 px-2.5 py-1.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all"
          >
            <Camera className="w-4 h-4" />
            <span className="text-[11px]">Scan</span>
          </button>

          {/* Sync Button */}
          <button
            onClick={onSyncData}
            disabled={isSyncing}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl disabled:opacity-50"
            title="Sinkronkan data produk"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>

          {/* Shift Report Button */}
          <button
            onClick={onOpenShiftModal}
            className="p-1.5 bg-emerald-950/70 border border-emerald-500/40 text-emerald-400 rounded-xl"
            title="Laporan Shift Harian"
          >
            <Receipt className="w-4 h-4" />
          </button>

          {/* Server IP Config Button */}
          <button
            onClick={onOpenServerModal}
            className={`p-1.5 rounded-xl border ${
              isConnected ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400' : 'bg-rose-950/60 border-rose-500/40 text-rose-400'
            }`}
            title="Pengaturan IP Server"
          >
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          </button>

          {/* Logout Button */}
          {currentUser && (
            <button
              onClick={onLogout}
              className="p-1.5 bg-rose-950/60 border border-rose-500/30 text-rose-400 rounded-xl"
              title="Logout Kasir"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

      {/* Cashier Badge Subheader */}
      {currentUser && (
        <div className="mt-2 pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
          <div>
            Kasir: <span className="font-bold text-cyan-300">{currentUser.name}</span>
          </div>
          <div className="truncate max-w-[180px] font-mono text-[10px] text-slate-500">
            IP Server: {serverUrl.replace(/^https?:\/\//, '')}
          </div>
        </div>
      )}
    </header>
  );
}
