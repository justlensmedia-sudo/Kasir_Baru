import React, { useState, useRef, useEffect } from 'react';
import { Search, Barcode, Layers, Box, Tag, Calculator, Plus, ExternalLink, Sparkles } from 'lucide-react';

export default function ProductCatalog({ products = [], onSelectProduct, isSyncing }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [barcodeScanInput, setBarcodeScanInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const barcodeInputRef = useRef(null);

  // Extract unique categories
  const categories = ['Semua', ...new Set(products.map((p) => p.category).filter(Boolean))];

  // Filter products by category, search term, or barcode
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'Semua' || product.category === selectedCategory;
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      product.name.toLowerCase().includes(searchLower) ||
      product.code.toLowerCase().includes(searchLower) ||
      product.category.toLowerCase().includes(searchLower);

    return matchesCategory && matchesSearch;
  });

  // Handle barcode submission (e.g. scanner sends Enter key)
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeScanInput.trim()) return;

    const matched = products.find(
      (p) => p.code.toLowerCase() === barcodeScanInput.trim().toLowerCase()
    );

    if (matched) {
      onSelectProduct(matched);
      setBarcodeScanInput('');
    } else {
      // Fallback search
      setSearchTerm(barcodeScanInput.trim());
      setBarcodeScanInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
      
      {/* Search & Barcode Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Barcode Quick Scan Input */}
          <form onSubmit={handleBarcodeSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-cyan-400">
              <Barcode className="w-4 h-4" />
            </div>
            <input
              ref={barcodeInputRef}
              type="text"
              value={barcodeScanInput}
              onChange={(e) => setBarcodeScanInput(e.target.value)}
              placeholder="Scan Barcode (cth: PRD-001, PRD-004)..."
              className="w-full bg-slate-950 border border-cyan-500/30 focus:border-cyan-400 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            <button
              type="submit"
              className="absolute inset-y-1 right-1 px-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[11px] font-medium transition-colors"
            >
              Scan
            </button>
          </form>

          {/* Search Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama produk, banner, jilid..."
              className="w-full bg-slate-950 border border-slate-700 focus:border-slate-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 outline-none transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1 shrink-0 mr-1">
            <Layers className="w-3.5 h-3.5" /> Kategori:
          </span>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-xl font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {isSyncing ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2">
            <Sparkles className="w-8 h-8 text-cyan-400 animate-spin" />
            <p className="text-xs">Menyinkronkan katalog produk dari server...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-400 space-y-2 bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6">
            <Box className="w-10 h-10 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">Tidak ada produk ditemukan</p>
            <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau kategori.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredProducts.map((product) => {
              const isMetered = Boolean(product.is_metered);
              const isOutsource = Boolean(product.is_outsource);

              return (
                <div
                  key={product.id}
                  onClick={() => onSelectProduct(product)}
                  className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 shadow-md hover:shadow-cyan-500/5 transition-all cursor-pointer flex flex-col justify-between group"
                >
                  <div className="space-y-2">
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-1 text-[10px]">
                      <span className="font-mono text-cyan-400 bg-cyan-950/70 border border-cyan-800/50 px-2 py-0.5 rounded-md">
                        {product.code}
                      </span>
                      <div className="flex items-center space-x-1">
                        {isMetered && (
                          <span className="bg-amber-950/80 text-amber-300 border border-amber-800/50 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium">
                            <Calculator className="w-3 h-3" /> Meteran (P x L)
                          </span>
                        )}
                        {isOutsource && (
                          <span className="bg-purple-950/80 text-purple-300 border border-purple-800/50 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-medium">
                            <ExternalLink className="w-3 h-3" /> Outsource
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title & Category */}
                    <div>
                      <h3 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors line-clamp-2">
                        {product.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Tag className="w-3 h-3 text-slate-500" />
                        {product.category}
                      </p>
                    </div>
                  </div>

                  {/* Price & Action Button */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Harga</span>
                      <span className="text-sm font-bold text-emerald-400">
                        Rp {Number(product.sell_price || 0).toLocaleString('id-ID')}
                        {isMetered ? <span className="text-[10px] text-slate-400 font-normal"> / m²</span> : ''}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="p-2 rounded-xl bg-slate-800 group-hover:bg-cyan-500 text-slate-300 group-hover:text-slate-950 font-bold transition-all shadow"
                    >
                      {isMetered ? <Calculator className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
