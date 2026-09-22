import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import PosSlipForm from './components/PosSlipForm';
import PurchasingModule from './components/PurchasingModule';
import InventoryModule from './components/InventoryModule';
import ProductMasterModule from './components/ProductMasterModule';
import SummaryDashboard from './components/SummaryDashboard';
import SettingsModule from './components/SettingsModule';
import { 
  fetchHealth, 
  fetchProducts, 
  fetchIngredients, 
  fetchPurchases, 
  fetchSales, 
  fetchMutations, 
  saveProduct, 
  deleteProduct, 
  saveIngredient, 
  deleteIngredient, 
  createPurchase, 
  createSale, 
  deleteSale, 
  createMutation, 
  submitStockOpname, 
  triggerSync 
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleStatus, setGoogleStatus] = useState({ connected: false, lastSync: null });
  const [storeInfo, setStoreInfo] = useState(null);

  // App Data States
  const [products, setProducts] = useState([]);
  const [ingredients, setIngredients] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [sales, setSales] = useState([]);
  const [mutations, setMutations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initial Data Load
  const loadAllData = async () => {
    try {
      const [healthData, prodData, ingData, purData, saleData, mutData] = await Promise.all([
        fetchHealth(),
        fetchProducts(),
        fetchIngredients(),
        fetchPurchases(),
        fetchSales(),
        fetchMutations()
      ]);

      setGoogleStatus({
        connected: healthData.isGoogleConnected,
        lastSync: healthData.lastSyncTime
      });
      setStoreInfo(healthData.storeInfo);
      setProducts(prodData || []);
      setIngredients(ingData || []);
      setPurchases(purData || []);
      setSales(saleData || []);
      setMutations(mutData || []);
    } catch (err) {
      console.error('Failed to load app data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Trigger Manual Sync
  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await triggerSync();
      alert(res.message);
      await loadAllData();
    } catch (err) {
      alert('Sinkronisasi Google Sheets gagal: ' + err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  // Sales Handlers
  const handleSaleSaved = async (salePayload) => {
    const newSale = await createSale(salePayload);
    await loadAllData();
    return newSale;
  };

  const handleDeleteSale = async (id) => {
    await deleteSale(id);
    await loadAllData();
  };

  // Purchase Handlers
  const handlePurchaseSaved = async (purchasePayload) => {
    const newPurchase = await createPurchase(purchasePayload);
    await loadAllData();
    return newPurchase;
  };

  // Product Handlers
  const handleSaveProduct = async (productData) => {
    await saveProduct(productData);
    await loadAllData();
  };

  const handleDeleteProduct = async (id) => {
    await deleteProduct(id);
    await loadAllData();
  };

  // Ingredient & Mutation Handlers
  const handleSaveIngredient = async (ingData) => {
    await saveIngredient(ingData);
    await loadAllData();
  };

  const handleDeleteIngredient = async (id) => {
    await deleteIngredient(id);
    await loadAllData();
  };

  const handleRecordMutation = async (mutData) => {
    await createMutation(mutData);
    await loadAllData();
  };

  const handleStockOpname = async (opnameData) => {
    await submitStockOpname(opnameData);
    await loadAllData();
  };

  const handleUpdateStoreInfo = async (newInfo) => {
    setStoreInfo(newInfo);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#0c0b0a] text-stone-100 font-sans pb-12">
      
      {/* Navbar Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isSyncing={isSyncing}
        onSync={handleManualSync}
        googleStatus={googleStatus}
      />

      {/* Main Content Body */}
      <main className="flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
            <div className="w-12 h-12 rounded-full border-4 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-sm font-semibold text-stone-400">Memuat data Kedai Amud Kumis...</p>
          </div>
        ) : (
          <>
            {activeTab === 'pos' && (
              <PosSlipForm
                products={products}
                onSaleSaved={handleSaleSaved}
              />
            )}

            {activeTab === 'purchasing' && (
              <PurchasingModule
                ingredients={ingredients}
                purchases={purchases}
                onPurchaseSaved={handlePurchaseSaved}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryModule
                ingredients={ingredients}
                products={products}
                mutations={mutations}
                onSaveIngredient={handleSaveIngredient}
                onDeleteIngredient={handleDeleteIngredient}
                onRecordMutation={handleRecordMutation}
                onStockOpname={handleStockOpname}
              />
            )}

            {activeTab === 'products' && (
              <ProductMasterModule
                products={products}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
              />
            )}

            {activeTab === 'summary' && (
              <SummaryDashboard
                sales={sales}
                purchases={purchases}
                onDeleteSale={handleDeleteSale}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsModule
                onSyncComplete={loadAllData}
                storeInfo={storeInfo}
                onUpdateStoreInfo={handleUpdateStoreInfo}
              />
            )}
          </>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="mt-auto border-t border-stone-800/80 py-4 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>🍲 <strong>Kedai "Amud Kumis"</strong> — Hidangan Khas Jakarta (Sop Betawi & Sate)</span>
          <span>Sistem POS, Belanja Bahan & Inventory Terintegrasi Google Sheets</span>
        </div>
      </footer>

    </div>
  );
}
