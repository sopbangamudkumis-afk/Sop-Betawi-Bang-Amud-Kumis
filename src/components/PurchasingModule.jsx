import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Save, 
  Calendar, 
  Store, 
  User, 
  Tag, 
  FileText, 
  Search, 
  Receipt,
  ArrowDownRight,
  TrendingDown
} from 'lucide-react';

const COMMON_UNITS = ['kg', 'gram', 'liter', 'ml', 'pcs', 'ikat', 'pack', 'kaleng', 'botol', 'tabung', 'bal', 'sak', 'butir'];
const COMMON_CATEGORIES = ['Daging & Jeroan', 'Kuah & Olahan', 'Bumbu & Rempah', 'Sayuran & Segar', 'Bahan Pokok', 'Minuman Jadi', 'Pelengkap', 'Operasional / Gas'];

export default function PurchasingModule({ ingredients, purchases, onPurchaseSaved }) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplier, setSupplier] = useState('Pasar Induk Kramat Jati');
  const [buyer, setBuyer] = useState('Bang Amud');
  const [notes, setNotes] = useState('');

  // Shopping Rows
  const [items, setItems] = useState([
    {
      id: 1,
      name: '',
      ingredientId: '',
      category: 'Daging & Jeroan',
      qty: '',
      unit: 'kg',
      unitPrice: '',
      subtotal: 0
    }
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedPurchaseDetail, setSelectedPurchaseDetail] = useState(null);

  // Add new shopping row
  const addRow = () => {
    setItems(prev => [
      ...prev,
      {
        id: Date.now(),
        name: '',
        ingredientId: '',
        category: 'Bumbu & Rempah',
        qty: '',
        unit: 'kg',
        unitPrice: '',
        subtotal: 0
      }
    ]);
  };

  // Remove row
  const removeRow = (id) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter(it => it.id !== id));
  };

  // Update row
  const updateRow = (id, field, value) => {
    setItems(prev => prev.map(it => {
      if (it.id !== id) return it;

      const updated = { ...it, [field]: value };

      // If user selected existing ingredient from dropdown
      if (field === 'ingredientId') {
        const found = ingredients.find(ing => ing.id === value);
        if (found) {
          updated.name = found.name;
          updated.category = found.category;
          updated.unit = found.unit;
        } else if (value === 'NEW') {
          updated.name = '';
          updated.ingredientId = '';
        }
      }

      // Re-calculate subtotal
      const qtyNum = parseFloat(updated.qty) || 0;
      const priceNum = parseFloat(updated.unitPrice) || 0;
      updated.subtotal = qtyNum * priceNum;

      return updated;
    }));
  };

  const grandTotal = items.reduce((acc, it) => acc + (it.subtotal || 0), 0);

  // Reset Form
  const resetForm = () => {
    setItems([
      {
        id: Date.now(),
        name: '',
        ingredientId: '',
        category: 'Daging & Jeroan',
        qty: '',
        unit: 'kg',
        unitPrice: '',
        subtotal: 0
      }
    ]);
    setNotes('');
  };

  // Submit Purchase
  const handleSubmit = async (e) => {
    e.preventDefault();
    const validItems = items.filter(it => it.name.trim() !== '' && Number(it.qty) > 0);

    if (validItems.length === 0) {
      alert('Harap masukkan setidaknya 1 bahan baku yang valid beserta jumlahnya!');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        date: new Date(date).toISOString(),
        supplier,
        buyer,
        notes,
        items: validItems.map(it => ({
          ingredientId: it.ingredientId || null,
          name: it.name.trim(),
          category: it.category,
          qty: Number(it.qty),
          unit: it.unit,
          unitPrice: Number(it.unitPrice) || 0,
          subtotal: it.subtotal
        }))
      };

      await onPurchaseSaved(payload);
      alert('Catatan belanja bahan baku berhasil disimpan & stok otomatis bertambah!');
      resetForm();
    } catch (err) {
      alert('Gagal menyimpan belanja: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter purchases
  const filteredPurchases = purchases.filter(p => 
    p.supplier?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.id?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.notes?.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.items || []).some(it => it.name.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const totalSpentAll = purchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pencatatan Pembelian Bahan Baku (Belanja Pasar)
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Purchasing
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Input fleksibel untuk bahan baku apa pun (daging, jeroan, bumbu, sayuran, susu, gas). Stok bahan akan otomatis bertambah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-stone-950 px-4 py-2 rounded-xl border border-stone-800">
          <TrendingDown className="w-4 h-4 text-red-400" />
          <div>
            <div className="text-[10px] text-stone-400 uppercase font-bold">Total Pengeluaran Belanja</div>
            <div className="text-sm font-mono font-bold text-red-400">
              Rp {totalSpentAll.toLocaleString('id-ID')}
            </div>
          </div>
        </div>
      </div>

      {/* FORM INPUT BELANJA */}
      <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-2xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="flex items-center justify-between border-b border-stone-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Receipt className="w-4 h-4 text-brand-400" />
              Form Input Belanja Harian
            </h3>
            <span className="text-xs text-stone-400">
              Bahan baru yang belum terdaftar akan otomatis didaftarkan ke Master Bahan Baku.
            </span>
          </div>

          {/* Header Belanja */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-400" />
                Tanggal Belanja
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase mb-1 flex items-center gap-1.5">
                <Store className="w-3.5 h-3.5 text-brand-400" />
                Tempat Belanja / Supplier / Pasar
              </label>
              <input
                type="text"
                placeholder="Misal: Pasar Induk Kramat Jati / Agen Susu"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-300 uppercase mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-brand-400" />
                Petugas / Yang Berbelanja
              </label>
              <input
                type="text"
                value={buyer}
                onChange={(e) => setBuyer(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* DYNAMIC SHOPPING ITEMS TABLE */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold text-brand-400 uppercase tracking-wider">
                Daftar Bahan Baku yang Dibeli ({items.length} Baris)
              </label>
              <button
                type="button"
                onClick={addRow}
                className="flex items-center gap-1 px-3 py-1 rounded-xl bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 border border-brand-500/40 text-xs font-bold transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                + Tambah Baris Bahan
              </button>
            </div>

            <div className="space-y-3">
              {items.map((it, idx) => (
                <div 
                  key={it.id}
                  className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 hover:border-stone-700 transition-all grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
                >
                  <div className="md:col-span-1 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-stone-800 text-stone-400 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                  </div>

                  {/* Dropdown or Free-text Name */}
                  <div className="md:col-span-4 space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">
                      Pilih dari Master atau Ketik Bahan Baru:
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={it.ingredientId || (it.name ? 'CUSTOM' : '')}
                        onChange={(e) => {
                          if (e.target.value === 'CUSTOM') {
                            updateRow(it.id, 'ingredientId', '');
                          } else {
                            updateRow(it.id, 'ingredientId', e.target.value);
                          }
                        }}
                        className="w-1/2 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-200 outline-none"
                      >
                        <option value="">-- Pilih dari Master --</option>
                        {ingredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name}</option>
                        ))}
                        <option value="CUSTOM">✍️ Ketik Baru...</option>
                      </select>

                      <input
                        type="text"
                        placeholder="Nama Bahan Baku..."
                        value={it.name}
                        onChange={(e) => updateRow(it.id, 'name', e.target.value)}
                        className="w-1/2 bg-stone-950 border border-brand-500/40 rounded-lg px-2 py-1.5 text-xs text-white font-bold outline-none"
                        required
                      />
                    </div>
                  </div>

                  {/* Qty & Unit */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Jumlah & Satuan:</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Qty"
                        value={it.qty}
                        onChange={(e) => updateRow(it.id, 'qty', e.target.value)}
                        className="w-1/2 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-white font-bold text-center outline-none"
                        required
                      />
                      <select
                        value={it.unit}
                        onChange={(e) => updateRow(it.id, 'unit', e.target.value)}
                        className="w-1/2 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-200 outline-none"
                      >
                        {COMMON_UNITS.map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Unit Price & Subtotal */}
                  <div className="md:col-span-3 space-y-1">
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Harga Satuan (Rp):</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Rp/satuan"
                        value={it.unitPrice}
                        onChange={(e) => updateRow(it.id, 'unitPrice', e.target.value)}
                        className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-white font-mono outline-none"
                      />
                      <div className="text-right whitespace-nowrap font-mono text-xs font-bold text-brand-400 w-24">
                        Rp {(it.subtotal || 0).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>

                  {/* Delete Button */}
                  <div className="md:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeRow(it.id)}
                      disabled={items.length === 1}
                      className="text-stone-500 hover:text-red-400 p-1.5 disabled:opacity-20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes & Grand Total Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center bg-stone-950 p-4 rounded-2xl border border-stone-800">
            <div className="sm:col-span-7">
              <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1">
                Catatan Pembelian (Opsional):
              </label>
              <input
                type="text"
                placeholder="Misal: Stok bahan awal pekan / Belanja mendadak"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none"
              />
            </div>

            <div className="sm:col-span-5 flex flex-col sm:items-end justify-center">
              <div className="text-xs text-stone-400 uppercase font-bold">Total Pembelian:</div>
              <div className="text-2xl font-black font-mono text-brand-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting || items.length === 0}
              className="px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-glow flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan...' : 'SIMPAN CATATAN BELANJA & TAMBAH STOK'}
            </button>
          </div>

        </form>
      </div>

      {/* RIWAYAT BELANJA / PURCHASING HISTORY */}
      <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">Riwayat Belanja Bahan Baku</h3>
            <p className="text-xs text-stone-400">Daftar semua transaksi belanja pasar yang telah dicatat.</p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari pasar / bahan..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white outline-none"
            />
          </div>
        </div>

        {/* Purchases Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-900/80 text-stone-400 uppercase font-bold border-b border-stone-800">
              <tr>
                <th className="p-3">No Faktur</th>
                <th className="p-3">Tanggal</th>
                <th className="p-3">Supplier / Pasar</th>
                <th className="p-3">Pembeli</th>
                <th className="p-3">Item Belanja</th>
                <th className="p-3 text-right">Total Belanja</th>
                <th className="p-3 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/60">
              {filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-6 text-center text-stone-500 italic">
                    Belum ada riwayat belanja yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-900/40 transition-colors">
                    <td className="p-3 font-mono font-bold text-brand-400">{p.id}</td>
                    <td className="p-3 text-stone-200">
                      {new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 font-medium text-white">{p.supplier || '-'}</td>
                    <td className="p-3 text-stone-300">{p.buyer || '-'}</td>
                    <td className="p-3 text-stone-300 max-w-xs truncate">
                      {p.items ? p.items.map(it => `${it.name} (${it.qty} ${it.unit})`).join(', ') : '-'}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-400">
                      Rp {(Number(p.totalAmount) || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => setSelectedPurchaseDetail(p)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold transition-all"
                      >
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedPurchaseDetail && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-start border-b border-stone-800 pb-3">
              <div>
                <span className="text-xs font-bold text-brand-400 font-mono">{selectedPurchaseDetail.id}</span>
                <h3 className="text-lg font-bold text-white">Rincian Belanja Bahan</h3>
                <p className="text-xs text-stone-400">
                  {selectedPurchaseDetail.supplier} • {new Date(selectedPurchaseDetail.date).toLocaleDateString('id-ID')}
                </p>
              </div>
              <button
                onClick={() => setSelectedPurchaseDetail(null)}
                className="text-stone-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {(selectedPurchaseDetail.items || []).map((it, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 rounded-xl bg-stone-900 border border-stone-800 text-xs">
                  <div>
                    <div className="font-bold text-stone-200">{it.name}</div>
                    <div className="text-[10px] text-stone-400">
                      {it.qty} {it.unit} @ Rp {(Number(it.unitPrice) || 0).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="font-mono font-bold text-white">
                    Rp {(Number(it.subtotal) || 0).toLocaleString('id-ID')}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center bg-stone-950 p-3 rounded-xl border border-stone-800 text-xs">
              <span className="font-bold text-stone-400">TOTAL BELANJA:</span>
              <span className="font-mono font-black text-base text-red-400">
                Rp {(Number(selectedPurchaseDetail.totalAmount) || 0).toLocaleString('id-ID')}
              </span>
            </div>

            {selectedPurchaseDetail.notes && (
              <div className="text-xs text-stone-400 bg-stone-900/60 p-2.5 rounded-xl">
                <span className="font-semibold text-stone-300">Catatan:</span> {selectedPurchaseDetail.notes}
              </div>
            )}

            <button
              onClick={() => setSelectedPurchaseDetail(null)}
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
