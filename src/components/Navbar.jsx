import React, { useState, useEffect } from 'react';
import { 
  ReceiptText, 
  ShoppingBag, 
  Boxes, 
  UtensilsCrossed, 
  BarChart3, 
  Settings, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  Database,
  Clock
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, isSyncing, onSync, googleStatus }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentTime.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const navItems = [
    { id: 'pos', label: 'Input Nota Penjualan', icon: ReceiptText, badge: 'Kasir' },
    { id: 'purchasing', label: 'Belanja Bahan', icon: ShoppingBag, badge: 'Beli' },
    { id: 'inventory', label: 'Inventory & Mutasi', icon: Boxes, badge: 'Stok' },
    { id: 'products', label: 'Master Menu', icon: UtensilsCrossed, badge: 'Menu' },
    { id: 'summary', label: 'Laporan & Summary', icon: BarChart3, badge: 'Rekap' },
    { id: 'settings', label: 'Google Sheets', icon: Settings, badge: 'Sync' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#161412]/90 backdrop-blur-md border-b border-stone-800 shadow-xl">
      {/* Top Banner with Brand & Status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
        
        {/* Brand */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-betawi-red flex items-center justify-center shadow-glow text-2xl">
            🍲
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                Kedai Amud Kumis
              </span>
              <span className="text-xs text-stone-400 hidden sm:inline">Jl. Limo Raya (Dekat UPN)</span>
            </div>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-1.5">
              SOP BETAWI <span className="text-brand-400">& SATE</span>
            </h1>
          </div>
        </div>

        {/* Right Info: Live Clock, GSheets Status & Sync */}
        <div className="flex items-center gap-3">
          {/* Clock Widget */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-stone-900/80 border border-stone-800 text-stone-300 text-xs">
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>{formattedDate}</span>
            <span className="text-stone-600">|</span>
            <span className="font-mono font-bold text-white">{formattedTime}</span>
          </div>

          {/* Google Sheets Connection Pill */}
          <div 
            onClick={() => setActiveTab('settings')}
            className={`cursor-pointer px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all hover:scale-105 ${
              googleStatus?.connected 
                ? 'bg-emerald-950/40 border-emerald-600/40 text-emerald-300' 
                : 'bg-amber-950/40 border-amber-600/40 text-amber-300'
            }`}
            title={googleStatus?.connected ? 'Terhubung ke Google Spreadsheet' : 'Klik untuk konfigurasi Google Sheets'}
          >
            {googleStatus?.connected ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Google Sheets Aktif</span>
                <span className="sm:hidden">GSheets</span>
              </>
            ) : (
              <>
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Local DB (Offline)</span>
                <span className="sm:hidden">Local</span>
              </>
            )}
          </div>

          {/* Quick Sync Button */}
          <button
            onClick={onSync}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-glow transition-all active:scale-95 disabled:opacity-50"
            title="Sinkronkan database lokal ke Google Sheets"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isSyncing ? 'Menyinkronkan...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-brand-600 to-brand-500 text-white shadow-lg shadow-brand-500/20'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-stone-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
