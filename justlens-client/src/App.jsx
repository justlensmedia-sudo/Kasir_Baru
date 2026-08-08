import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ServerConfigModal from './components/ServerConfigModal';
import ProductCatalog from './components/ProductCatalog';
import PrintCalculatorModal from './components/PrintCalculatorModal';
import Cart from './components/Cart';
import OrderTrackerModal from './components/OrderTrackerModal';
import ReceiptPrintModal from './components/ReceiptPrintModal';
import LoginModal from './components/LoginModal';
import ShiftSummaryModal from './components/ShiftSummaryModal';
import { getServerUrl, checkServerHealth, syncMasterData, getOrders } from './services/api';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function App() {
  const [serverUrl, setServerUrlState] = useState(getServerUrl());
  const [isConnected, setIsConnected] = useState(false);
  const [products, setProducts] = useState([]);
  const [finishingOptions, setFinishingOptions] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [activeOrderCount, setActiveOrderCount] = useState(0);

  // User Auth State
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('justlens_cashier_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoginOpen, setIsLoginOpen] = useState(!currentUser);

  // Modals state
  const [isServerModalOpen, setIsServerModalOpen] = useState(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState(false);
  const [selectedProductForCalc, setSelectedProductForCalc] = useState(null);
  const [isOrderTrackerOpen, setIsOrderTrackerOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [isShiftSummaryOpen, setIsShiftSummaryOpen] = useState(false);
  const [transactionForPrint, setTransactionForPrint] = useState(null);
  const [defaultPrintType, setDefaultPrintType] = useState('thermal');

  // Loading & error states
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState('');

  // Initial load & Sync
  const handleSyncData = async () => {
    setIsSyncing(true);
    setSyncError('');

    // If first launch ever, open IP setup modal automatically
    const isFirstLaunch = !localStorage.getItem('justlens_ip_configured');
    if (isFirstLaunch) {
      setIsServerModalOpen(true);
    }

    // Check Health first
    const health = await checkServerHealth();
    setIsConnected(health.success);

    if (!health.success && !isFirstLaunch) {
      // Auto open modal if failed connection on startup
      setIsServerModalOpen(true);
    }

    try {
      const data = await syncMasterData();
      if (data.products) setProducts(data.products);
      if (data.finishing_options) setFinishingOptions(data.finishing_options);

      // Fetch active orders count
      const activeOrders = await getOrders();
      const inProgressCount = activeOrders.filter(
        (o) => o.order_status && o.order_status !== 'Selesai'
      ).length;
      setActiveOrderCount(inProgressCount);
    } catch (err) {
      console.error(err);
      setSyncError(err.message || 'Gagal tersambung ke Server API. Periksa Pengaturan IP Server.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    handleSyncData();
  }, [serverUrl]);

  // Handle Server URL save from modal
  const handleServerSaved = (newUrl) => {
    setServerUrlState(newUrl);
  };

  // Handle product selection from catalog
  const handleSelectProduct = (product) => {
    if (product.is_metered || finishingOptions.length > 0) {
      // Open Calculator Modal for metered / finishing items
      setSelectedProductForCalc(product);
      setIsCalculatorModalOpen(true);
    } else {
      // Add standard ATK item directly to cart
      const existingIdx = cartItems.findIndex(
        (item) => item.product_id === product.id && !item.is_metered
      );

      if (existingIdx >= 0) {
        handleUpdateCartQty(existingIdx, (Number(cartItems[existingIdx].qty) || 0) + 1);
      } else {
        const price = Number(product.sell_price || 0);
        const vendorCostPerUnit = Boolean(product.is_outsource) ? Number(product.base_price || 0) : 0;
        setCartItems((prev) => [
          ...prev,
          {
            product_id: product.id,
            code: product.code,
            name: product.name,
            category: product.category,
            is_metered: false,
            is_outsource: Boolean(product.is_outsource),
            length: 0,
            width: 0,
            area_m2: 0,
            qty: 1,
            price: price,
            unit_price: price,
            subtotal: price,
            vendor_cost: vendorCostPerUnit,
            unit_vendor_cost: vendorCostPerUnit,
            tiered_prices: product.tiered_prices || null,
          }
        ]);
      }
    }
  };

  // Add item from Printing Calculator
  const handleAddFromCalculator = (cartItem) => {
    const qty = Math.max(1, Number(cartItem.qty) || 1);
    const unitPrice = cartItem.price; // calculated unit price from modal
    const unitVendorCost = cartItem.is_outsource
      ? (qty > 0 ? (cartItem.vendor_cost / qty) : 0)
      : 0;

    setCartItems((prev) => [
      ...prev,
      {
        ...cartItem,
        unit_price: unitPrice,
        unit_vendor_cost: unitVendorCost,
      }
    ]);
  };

  // Cart operations
  const handleUpdateCartQty = (index, newQty) => {
    const isNumber = typeof newQty === 'number' || (typeof newQty === 'string' && newQty.trim() !== '');
    const parsedQty = isNumber ? parseInt(newQty, 10) : '';
    const validQty = parsedQty !== '' && !isNaN(parsedQty) ? Math.max(1, parsedQty) : '';

    setCartItems((prevItems) => {
      const updated = [...prevItems];
      const item = updated[index];
      if (!item) return prevItems;

      const numericQty = validQty === '' ? 0 : validQty;
      
      // Tiered Pricing / Diskon Grosir adjustment if available
      let unitPrice = item.unit_price !== undefined ? item.unit_price : item.price;
      if (item.tiered_prices && Array.isArray(item.tiered_prices) && item.tiered_prices.length > 0) {
        const sortedTiers = [...item.tiered_prices].sort((a, b) => b.min_qty - a.min_qty);
        const matchedTier = sortedTiers.find((tier) => numericQty >= tier.min_qty);
        if (matchedTier) {
          unitPrice = matchedTier.unit_price;
        }
      }

      const unitVendorCost = item.unit_vendor_cost !== undefined
        ? item.unit_vendor_cost
        : (item.qty > 0 ? item.vendor_cost / item.qty : 0);

      const subtotal = Math.round(unitPrice * numericQty);
      const vendor_cost = Math.round(unitVendorCost * numericQty);

      updated[index] = {
        ...item,
        qty: validQty,
        price: unitPrice,
        subtotal,
        vendor_cost,
        unit_vendor_cost: unitVendorCost,
        unit_price: unitPrice,
      };

      return updated;
    });
  };

  const handleRemoveCartItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Transaction success callback
  const handleTransactionSuccess = (txData) => {
    setTransactionForPrint(txData);
    setDefaultPrintType('thermal');
    setIsReceiptModalOpen(true);
    // Refresh active order count
    getOrders().then((orders) => {
      const count = orders.filter((o) => o.order_status && o.order_status !== 'Selesai').length;
      setActiveOrderCount(count);
    });
  };

  // Print trigger from Order Tracker
  const handleSelectPrintFromTracker = (order, type) => {
    setTransactionForPrint(order);
    setDefaultPrintType(type);
    setIsReceiptModalOpen(true);
  };

  // Auth Handlers
  const handleLoginSuccess = (userData) => {
    setCurrentUser(userData);
    setIsLoginOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('justlens_jwt_token');
    localStorage.removeItem('justlens_cashier_user');
    setCurrentUser(null);
    setIsLoginOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* App Header */}
      <Header
        isConnected={isConnected}
        serverUrl={serverUrl}
        onOpenServerModal={() => setIsServerModalOpen(true)}
        onSyncData={handleSyncData}
        isSyncing={isSyncing}
        onOpenOrderTracker={() => setIsOrderTrackerOpen(true)}
        activeOrderCount={activeOrderCount}
        currentUser={currentUser}
        onOpenShiftSummary={() => setIsShiftSummaryOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 flex flex-col lg:flex-row gap-4 overflow-hidden">
        
        {/* Left Side: Product Catalog & Search */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {syncError && (
            <div className="mb-3 p-3 bg-rose-950/80 border border-rose-500/50 rounded-2xl text-xs text-rose-200 flex items-center justify-between shadow">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{syncError}</span>
              </div>
              <button
                onClick={() => setIsServerModalOpen(true)}
                className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 text-rose-100 font-semibold rounded-xl text-[11px] shrink-0"
              >
                Atur IP Server
              </button>
            </div>
          )}

          <ProductCatalog
            products={products}
            onSelectProduct={handleSelectProduct}
            isSyncing={isSyncing}
          />
        </div>

        {/* Right Side: Cashier Cart & Payment Checkout */}
        <Cart
          cartItems={cartItems}
          onUpdateQty={handleUpdateCartQty}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onTransactionSuccess={handleTransactionSuccess}
        />

      </main>

      {/* MODALS */}
      <LoginModal
        isOpen={isLoginOpen || !currentUser}
        serverUrl={serverUrl}
        onLoginSuccess={handleLoginSuccess}
      />

      <ShiftSummaryModal
        isOpen={isShiftSummaryOpen}
        onClose={() => setIsShiftSummaryOpen(false)}
        serverUrl={serverUrl}
        currentUser={currentUser}
      />

      <ServerConfigModal
        isOpen={isServerModalOpen}
        onClose={() => setIsServerModalOpen(false)}
        currentUrl={serverUrl}
        onSaved={handleServerSaved}
      />

      <PrintCalculatorModal
        isOpen={isCalculatorModalOpen}
        onClose={() => setIsCalculatorModalOpen(false)}
        product={selectedProductForCalc}
        finishingOptions={finishingOptions}
        onAddToCart={handleAddFromCalculator}
      />

      <OrderTrackerModal
        isOpen={isOrderTrackerOpen}
        onClose={() => setIsOrderTrackerOpen(false)}
        onSelectPrint={handleSelectPrintFromTracker}
      />

      <ReceiptPrintModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        transaction={transactionForPrint}
        defaultType={defaultPrintType}
      />

    </div>
  );
}
