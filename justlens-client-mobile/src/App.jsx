import React, { useState, useEffect } from 'react';
import MobileHeader from './components/MobileHeader';
import CameraScannerModal from './components/CameraScannerModal';
import MobileCart from './components/MobileCart';
import MobileLoginModal from './components/MobileLoginModal';
import MobileShiftModal from './components/MobileShiftModal';
import { getServerUrl, setServerUrl, checkServerHealth, syncMasterData } from './services/api';
import { Search, Camera, AlertCircle, RefreshCw, Store } from 'lucide-react';

export default function App() {
  const [serverUrlState, setServerUrlState] = useState(getServerUrl());
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState([]);
  
  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('justlens_cashier_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginOpen, setIsLoginOpen] = useState(!currentUser);

  // Modals state
  const [isScanCameraOpen, setIsScanCameraOpen] = useState(false);
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [inputIp, setInputIp] = useState(serverUrlState);

  // Loading & status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncError('');

    const health = await checkServerHealth();
    setIsConnected(health.success);

    try {
      const data = await syncMasterData();
      if (data.products) setProducts(data.products);
    } catch (err) {
      setSyncError(err.message || 'Gagal tersambung ke Server.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSync();
  }, [serverUrlState]);

  // Handle scanned barcode from Camera Scanner
  const handleScanSuccess = (barcodeCode) => {
    console.log('Barcode terdeteksi:', barcodeCode);
    const found = products.find(p => p.code && p.code.toLowerCase() === barcodeCode.toLowerCase());

    if (found) {
      addToCart(found);
    } else {
      alert(`Produk dengan Barcode [${barcodeCode}] tidak ditemukan di server.`);
    }
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const idx = prev.findIndex(item => item.product_id === product.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].qty + 1;
        updated[idx].qty = newQty;
        updated[idx].subtotal = newQty * updated[idx].price;
        return updated;
      } else {
        const price = Number(product.sell_price || 0);
        return [...prev, {
          product_id: product.id,
          name: product.name,
          category: product.category,
          is_outsource: product.is_outsource,
          is_metered: product.is_metered,
          vendor_cost_per_unit: Number(product.base_price || 0),
          qty: 1,
          price,
          subtotal: price
        }];
      }
    });
  };

  const handleUpdateCartQty = (idx, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(idx);
      return;
    }
    setCartItems(prev => {
      const updated = [...prev];
      updated[idx].qty = newQty;
      updated[idx].subtotal = newQty * updated[idx].price;
      return updated;
    });
  };

  const handleRemoveCartItem = (idx) => {
    setCartItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const handleSaveIp = () => {
    const updated = setServerUrl(inputIp);
    setServerUrlState(updated);
    setIsServerModalOpen(false);
  };

  const filteredProducts = products.filter(p =>
    (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.code && p.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-6">
      
      {/* Mobile Header */}
      <MobileHeader
        isConnected={isConnected}
        serverUrl={serverUrlState}
        currentUser={currentUser}
        onOpenScanCamera={() => setIsScanCameraOpen(true)}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onSyncData={handleSync}
        isSyncing={isSyncing}
        onOpenShiftModal={() => setIsShiftModalOpen(true)}
        onLogout={() => {
          localStorage.removeItem('justlens_jwt_token');
          localStorage.removeItem('justlens_cashier_user');
          setCurrentUser(null);
          setIsLoginOpen(true);
        }}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-md w-full mx-auto p-3 space-y-4">
        
        {syncError && (
          <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{syncError}</span>
            </div>
            <button
              onClick={() => setIsServerModalOpen(true)}
              className="px-2 py-1 bg-rose-900 text-rose-100 rounded-lg text-[10px] font-bold"
            >
              Atur IP
            </button>
          </div>
        )}

        {/* Product Search & Camera Scan Button */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Barang atau Kode Barcode..."
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={() => setIsScanCameraOpen(true)}
            className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 text-white rounded-xl shadow-md active:scale-95"
            title="Scan Barcode Kamera HP"
          >
            <Camera className="w-5 h-5" />
          </button>
        </div>

        {/* Product Grid / Catalog */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Katalog Produk Server</h2>
            <span className="text-[10px] text-slate-500">{filteredProducts.length} Produk</span>
          </div>

          <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="col-span-2 py-6 text-center text-slate-500 text-xs">
                Tidak ada produk ditemukan.
              </div>
            ) : (
              filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="p-2.5 bg-slate-950 border border-slate-800 hover:border-cyan-500/50 rounded-xl active:scale-95 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[9px] font-mono text-cyan-400 bg-cyan-950 px-1.5 py-0.5 rounded">
                      {p.code}
                    </span>
                    <p className="font-bold text-xs text-white line-clamp-2 mt-1">{p.name}</p>
                  </div>
                  <div className="mt-2 pt-1 border-t border-slate-900 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400">Stok: {p.stock}</span>
                    <span className="font-bold text-xs text-emerald-400">
                      Rp {Number(p.sell_price).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Cashier Mobile Cart */}
        <MobileCart
          cartItems={cartItems}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          currentUser={currentUser}
        />

      </main>

      {/* MODALS */}
      <MobileLoginModal
        isOpen={isLoginOpen || !currentUser}
        serverUrl={serverUrlState}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsLoginOpen(false);
        }}
      />

      <MobileShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        currentUser={currentUser}
      />

      <CameraScannerModal
        isOpen={isScanCameraOpen}
        onClose={() => setIsScanCameraOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* IP Server Modal */}
      {isServerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-2xl p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Store className="w-4 h-4 text-cyan-400" />
              Pengaturan IP Server Lokal
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Alamat IP & Port Server
              </label>
              <input
                type="text"
                value={inputIp}
                onChange={(e) => setInputIp(e.target.value)}
                placeholder="http://192.168.1.100:5000/api"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Gunakan IP Server lokal (misal: <code>http://192.168.1.100:5000/api</code>)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsServerModalOpen(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 text-xs font-bold rounded-xl"
              >
                Batal
              </button>
              <button
                onClick={handleSaveIp}
                className="flex-1 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-xl"
              >
                Simpan IP
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
