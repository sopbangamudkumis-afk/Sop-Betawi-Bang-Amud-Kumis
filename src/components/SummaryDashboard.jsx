import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Calendar, 
  Download, 
  CreditCard, 
  Wallet, 
  QrCode, 
  ArrowUpRight,
  Eye,
  Trash2,
  PieChart
} from 'lucide-react';
import { fetchSummary } from '../api';

export default function SummaryDashboard({ sales, purchases, onDeleteSale }) {
  const [range, setRange] = useState('all'); // 'today', 'week', 'month', 'all'
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchSummary(range);
      setSummaryData(data);
    } catch (err) {
      console.error('Failed to load summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, [range, sales, purchases]);

  // Export Sales to CSV
  const handleExportCSV = () => {
    if (!sales || sales.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor!');
      return;
    }

    const headers = ['No Nota', 'Waktu', 'No Meja', 'Tipe Pesanan', 'Kasir', 'Total Bayar', 'Metode Bayar', 'Item Pesanan'];
    const rows = sales.map(s => [
      s.id,
      new Date(s.date).toLocaleString('id-ID'),
      s.tableNo || '-',
      s.orderType || 'Dine-in',
      s.cashier || 'Kasir',
      s.totalAmount,
      s.paymentMethod || 'Tunai',
      (s.items || []).map(it => `${it.qty}x ${it.name}`).join('; ')
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Penjualan_Amud_Kumis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Laporan & Summary Analitik
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Omzet & Laba
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Pantau omzet penjualan kasir, total pengeluaran belanja pasar, dan estimasi laba kotor.
            </p>
          </div>
        </div>

        {/* Range Filter Buttons */}
        <div className="flex items-center gap-1.5 bg-stone-950 p-1.5 rounded-2xl border border-stone-800">
          {[
            { id: 'today', label: 'Hari Ini' },
            { id: 'week', label: '7 Hari' },
            { id: 'month', label: 'Bulan Ini' },
            { id: 'all', label: 'Semua' },
          ].map(btn => (
            <button
              key={btn.id}
              onClick={() => setRange(btn.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                range === btn.id
                  ? 'bg-brand-600 text-white shadow-glow'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Omzet Penjualan */}
        <div className="bg-gradient-to-br from-emerald-950/40 to-stone-900 p-5 rounded-3xl border border-emerald-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Total Omzet Penjualan</span>
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            Rp {(summaryData?.totalSalesRevenue || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-400">
            Dari <span className="font-bold text-emerald-400">{summaryData?.totalTransactions || 0}</span> nota transaksi
          </div>
        </div>

        {/* Total Belanja Bahan */}
        <div className="bg-gradient-to-br from-red-950/40 to-stone-900 p-5 rounded-3xl border border-red-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider">Total Belanja Bahan</span>
            <div className="p-2 rounded-xl bg-red-500/20 text-red-300">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            Rp {(summaryData?.totalPurchaseExpenses || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-400">
            Dari <span className="font-bold text-red-400">{summaryData?.purchaseCount || 0}</span> kali belanja pasar
          </div>
        </div>

        {/* Estimasi Laba Kotor */}
        <div className="bg-gradient-to-br from-amber-950/40 to-stone-900 p-5 rounded-3xl border border-amber-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-betawi-gold uppercase tracking-wider">Estimasi Laba Kotor</span>
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-black font-mono ${(summaryData?.grossProfit || 0) >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
            Rp {(summaryData?.grossProfit || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-400">
            Omzet dikurangi pengeluaran belanja bahan
          </div>
        </div>

        {/* Rata-rata per Nota */}
        <div className="bg-gradient-to-br from-blue-950/40 to-stone-900 p-5 rounded-3xl border border-blue-500/30 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Rata-rata Nilai / Nota</span>
            <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black font-mono text-white">
            Rp {(summaryData?.avgTransactionValue || 0).toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-stone-400">
            Rata-rata belanja per meja pelanggan
          </div>
        </div>

      </div>

      {/* TOP PRODUCTS & PAYMENT METHODS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products (8 cols) */}
        <div className="lg:col-span-8 bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-brand-400" />
              Menu Paling Laris (Porsian & Prasmanan)
            </h3>
            <span className="text-xs text-stone-400">Top 10 Menu Terbanyak Dipesan</span>
          </div>

          <div className="space-y-3">
            {(!summaryData?.topSellingProducts || summaryData.topSellingProducts.length === 0) ? (
              <div className="py-8 text-center text-stone-500 italic text-xs">
                Belum ada data penjualan pada rentang waktu ini.
              </div>
            ) : (
              summaryData.topSellingProducts.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-stone-900/60 border border-stone-800">
                  <div className="flex items-center gap-3 flex-1 pr-2">
                    <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-stone-100">{item.name}</div>
                      <div className="text-[11px] text-stone-400">
                        Terjual <span className="font-bold text-brand-400">{item.qty}</span> porsi / item
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono font-bold text-xs text-emerald-400 whitespace-nowrap">
                    Rp {(item.revenue || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Payment Methods Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
          <div className="border-b border-stone-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-400" />
              Metode Pembayaran
            </h3>
            <span className="text-xs text-stone-400">Distribusi omzet per metode bayar</span>
          </div>

          <div className="space-y-3">
            {Object.entries(summaryData?.paymentMethods || {}).map(([method, amount]) => {
              const percentage = summaryData?.totalSalesRevenue > 0 
                ? Math.round((amount / summaryData.totalSalesRevenue) * 100) 
                : 0;

              return (
                <div key={method} className="bg-stone-900/70 p-3.5 rounded-2xl border border-stone-800 space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-stone-200 flex items-center gap-1.5">
                      {method === 'Tunai' ? <Wallet className="w-3.5 h-3.5 text-emerald-400" /> : <QrCode className="w-3.5 h-3.5 text-brand-400" />}
                      {method}
                    </span>
                    <span className="font-mono font-bold text-white">
                      Rp {amount.toLocaleString('id-ID')}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-stone-950 h-2 rounded-full overflow-hidden border border-stone-800">
                    <div 
                      className="bg-gradient-to-r from-brand-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="text-right text-[10px] text-stone-400">{percentage}% dari total omzet</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* FULL SALES TRANSACTIONS TABLE */}
      <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Rekapitulasi Semua Nota Penjualan</h3>
            <p className="text-xs text-stone-400">Daftar lengkap seluruh transaksi nota kasir yang tercatat di database.</p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all self-start shadow-glow"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Data ke CSV / Excel
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 text-stone-400 uppercase font-bold border-b border-stone-800">
              <tr>
                <th className="p-3">No Nota</th>
                <th className="p-3">Waktu</th>
                <th className="p-3">Meja</th>
                <th className="p-3">Tipe</th>
                <th className="p-3">Kasir</th>
                <th className="p-3">Rincian Menu</th>
                <th className="p-3">Metode</th>
                <th className="p-3 text-right">Total Bayar</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {(!sales || sales.length === 0) ? (
                <tr>
                  <td colSpan="9" className="p-8 text-center text-stone-500 italic">
                    Belum ada data penjualan tercatat.
                  </td>
                </tr>
              ) : (
                sales.map((s) => (
                  <tr key={s.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-400">{s.id}</td>
                    <td className="p-3 text-stone-300">
                      {new Date(s.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-3 font-bold text-white">Meja {s.tableNo || '-'}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">
                        {s.orderType || 'Dine-in'}
                      </span>
                    </td>
                    <td className="p-3 text-stone-300">{s.cashier || '-'}</td>
                    <td className="p-3 text-stone-300 max-w-xs truncate">
                      {(s.items || []).map(it => `${it.qty}x ${it.name}`).join(', ')}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-200 text-[11px] font-semibold">
                        {s.paymentMethod || 'Tunai'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-400">
                      Rp {(Number(s.totalAmount) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedSaleDetail(s)}
                          className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Hapus nota penjualan "${s.id}"?`)) {
                              onDeleteSale(s.id);
                            }
                          }}
                          className="p-1 rounded-lg hover:bg-red-950/40 text-stone-500 hover:text-red-400"
                          title="Hapus Nota"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL NOTA MODAL */}
      {selectedSaleDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-400 font-mono">#{selectedSaleDetail.id}</span>
                <h3 className="text-lg font-bold text-white">Detail Nota Meja {selectedSaleDetail.tableNo}</h3>
                <p className="text-xs text-stone-400">
                  {new Date(selectedSaleDetail.date).toLocaleString('id-ID')} • {selectedSaleDetail.orderType} • Kasir: {selectedSaleDetail.cashier}
                </p>
              </div>
              <button
                onClick={() => setSelectedSaleDetail(null)}
                className="text-stone-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(selectedSaleDetail.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-start p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div className="flex-1 pr-2">
                    <div className="font-bold text-stone-200">{it.name}</div>
                    <div className="text-[10px] text-stone-400">
                      {it.qty}x @ Rp {(Number(it.price) || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white whitespace-nowrap">
                    Rp {(Number(it.subtotal) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs">
              <span className="font-bold text-stone-400">TOTAL JUMLAH:</span>
              <span className="font-mono font-black text-lg text-brand-400">
                Rp {(Number(selectedSaleDetail.totalAmount) || 0).toLocaleString('id-ID')}
              </span>
            </div>

            <div className="text-xs text-stone-400 bg-stone-900/60 p-2.5 rounded-xl flex justify-between items-center">
              <span>Metode Bayar: <strong className="text-white">{selectedSaleDetail.paymentMethod}</strong></span>
              <span>Status: <strong className="text-emerald-400">{selectedSaleDetail.status || 'Lunas'}</strong></span>
            </div>

            <button
              onClick={() => setSelectedSaleDetail(null)}
              className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
