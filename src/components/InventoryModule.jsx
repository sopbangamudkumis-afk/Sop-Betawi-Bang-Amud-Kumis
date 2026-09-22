import React, { useState } from 'react';
import { 
  Boxes, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  SlidersHorizontal, 
  ClipboardCheck, 
  RotateCcw,
  Sparkles,
  PackageCheck
} from 'lucide-react';

export default function InventoryModule({ 
  ingredients, 
  products, 
  mutations, 
  onSaveIngredient, 
  onDeleteIngredient,
  onRecordMutation,
  onStockOpname
}) {
  const [activeTab, setActiveTab] = useState('ingredients'); // 'ingredients' | 'mutations' | 'stockOpname'
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals
  const [showAddIngModal, setShowAddIngModal] = useState(false);
  const [showMutationModal, setShowMutationModal] = useState(false);
  const [showOpnameModal, setShowOpnameModal] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState(null);

  // New Ingredient Form State
  const [ingForm, setIngForm] = useState({
    name: '',
    category: 'Daging & Jeroan',
    unit: 'kg',
    stock: '',
    minStock: '5'
  });

  // Manual Mutation Form State
  const [mutationForm, setMutationForm] = useState({
    ingredientId: '',
    type: 'Keluar',
    source: 'Pemakaian Dapur',
    qty: '',
    unit: 'kg',
    notes: ''
  });

  // Stock Opname Form State
  const [opnameForm, setOpnameForm] = useState({
    ingredientId: '',
    actualStock: '',
    notes: ''
  });

  const categories = ['ALL', ...new Set(ingredients.map(i => i.category))];

  // Filter Ingredients
  const filteredIngredients = ingredients.filter(i => {
    const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          i.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || i.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Count Low Stock
  const lowStockItems = ingredients.filter(i => Number(i.stock) <= Number(i.minStock));

  // Handle Ingredient Save (Create / Edit)
  const handleSaveIngredient = async (e) => {
    e.preventDefault();
    try {
      await onSaveIngredient({
        ...(editingIngredient || {}),
        name: ingForm.name.trim(),
        category: ingForm.category,
        unit: ingForm.unit,
        stock: Number(ingForm.stock) || 0,
        minStock: Number(ingForm.minStock) || 0
      });
      setShowAddIngModal(false);
      setEditingIngredient(null);
      setIngForm({ name: '', category: 'Daging & Jeroan', unit: 'kg', stock: '', minStock: '5' });
    } catch (err) {
      alert('Gagal menyimpan bahan baku: ' + err.message);
    }
  };

  // Handle Manual Mutation (In/Out/Waste)
  const handleRecordMutation = async (e) => {
    e.preventDefault();
    if (!mutationForm.ingredientId || !mutationForm.qty) {
      alert('Pilih bahan baku dan masukkan jumlah!');
      return;
    }
    const ing = ingredients.find(i => i.id === mutationForm.ingredientId);
    try {
      await onRecordMutation({
        ingredientId: mutationForm.ingredientId,
        itemName: ing ? ing.name : 'Bahan',
        type: mutationForm.type,
        source: mutationForm.source,
        qty: Number(mutationForm.qty),
        unit: mutationForm.unit || (ing ? ing.unit : 'pcs'),
        notes: mutationForm.notes
      });
      setShowMutationModal(false);
      setMutationForm({ ingredientId: '', type: 'Keluar', source: 'Pemakaian Dapur', qty: '', unit: 'kg', notes: '' });
      alert('Mutasi stok berhasil dicatat!');
    } catch (err) {
      alert('Gagal mencatat mutasi: ' + err.message);
    }
  };

  // Handle Stock Opname
  const handleStockOpname = async (e) => {
    e.preventDefault();
    if (!opnameForm.ingredientId || opnameForm.actualStock === '') {
      alert('Pilih bahan baku dan masukkan stok fisik aktual!');
      return;
    }
    try {
      await onStockOpname({
        ingredientId: opnameForm.ingredientId,
        actualStock: Number(opnameForm.actualStock),
        notes: opnameForm.notes
      });
      setShowOpnameModal(false);
      setOpnameForm({ ingredientId: '', actualStock: '', notes: '' });
      alert('Stok opname berhasil disesuaikan!');
    } catch (err) {
      alert('Gagal stok opname: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Manajemen Inventory & Mutasi Stok
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Stok In / Out
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Pantau sisa stok bahan mentah, catat pemakaian harian dapur, barang masuk, dan stok opname.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              setEditingIngredient(null);
              setIngForm({ name: '', category: 'Daging & Jeroan', unit: 'kg', stock: '', minStock: '5' });
              setShowAddIngModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow"
          >
            <Plus className="w-3.5 h-3.5" />
            + Tambah Bahan Baku
          </button>

          <button
            onClick={() => setShowMutationModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all"
          >
            <ArrowDownLeft className="w-3.5 h-3.5 text-red-400" />
            Catat Pemakaian / Mutasi
          </button>

          <button
            onClick={() => setShowOpnameModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-yellow-300 text-xs font-bold transition-all"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            Stok Opname
          </button>
        </div>
      </div>

      {/* Low Stock Warning Alert (if any) */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl flex items-start gap-3 text-xs">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">Peringatan: {lowStockItems.length} Bahan Baku Menipis / Mencapai Batas Minimum!</span>
            <p className="text-stone-300">
              {lowStockItems.map(i => `${i.name} (Sisa ${i.stock} ${i.unit})`).join(' • ')}
            </p>
          </div>
        </div>
      )}

      {/* Sub-Tabs: Bahan Baku vs Log Mutasi */}
      <div className="flex items-center gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ingredients'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          📦 Stok Bahan Baku ({ingredients.length})
        </button>

        <button
          onClick={() => setActiveTab('mutations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'mutations'
              ? 'bg-brand-600 text-white shadow-glow'
              : 'bg-stone-900 text-stone-400 hover:text-white'
          }`}
        >
          🔄 Riwayat Mutasi Barang ({mutations.length})
        </button>
      </div>

      {/* TAB 1: STOK BAHAN BAKU */}
      {activeTab === 'ingredients' && (
        <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
          
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Cari bahan baku (daging, jeroan, rempah)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-stone-400 whitespace-nowrap">Kategori:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-brand-500/20 border border-brand-500 text-brand-300'
                      : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Table of Ingredients */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 text-stone-400 uppercase font-bold border-b border-stone-800">
                <tr>
                  <th className="p-3">ID Bahan</th>
                  <th className="p-3">Nama Bahan Baku</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Satuan</th>
                  <th className="p-3 text-right">Stok Saat Ini</th>
                  <th className="p-3 text-right">Batas Min.</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredIngredients.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="p-8 text-center text-stone-500 italic">
                      Tidak ada bahan baku yang cocok.
                    </td>
                  </tr>
                ) : (
                  filteredIngredients.map((ing) => {
                    const isLow = Number(ing.stock) <= Number(ing.minStock);
                    return (
                      <tr key={ing.id} className="hover:bg-stone-900/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-brand-400">{ing.id}</td>
                        <td className="p-3 font-bold text-white">{ing.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-stone-800 text-stone-300 text-[11px]">
                            {ing.category}
                          </span>
                        </td>
                        <td className="p-3 font-medium text-stone-300">{ing.unit}</td>
                        <td className="p-3 text-right font-mono font-bold text-sm text-stone-100">
                          {Number(ing.stock).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-right font-mono text-stone-400">
                          {Number(ing.minStock).toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-center">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                              <AlertTriangle className="w-3 h-3" />
                              Menipis
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3" />
                              Aman
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingIngredient(ing);
                                setIngForm({
                                  name: ing.name,
                                  category: ing.category,
                                  unit: ing.unit,
                                  stock: String(ing.stock),
                                  minStock: String(ing.minStock)
                                });
                                setShowAddIngModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 text-[11px] font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Hapus bahan baku "${ing.name}"?`)) {
                                  onDeleteIngredient(ing.id);
                                }
                              }}
                              className="p-1 rounded-lg hover:bg-red-950/40 text-stone-500 hover:text-red-400"
                              title="Hapus"
                            >
                              ✕
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: RIWAYAT MUTASI BARANG */}
      {activeTab === 'mutations' && (
        <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
          <div className="flex justify-between items-center border-b border-stone-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">Log Mutasi Barang Masuk - Keluar</h3>
              <p className="text-xs text-stone-400">Pencatatan riwayat setiap barang yang masuk (belanja) dan keluar (dapur/waste/opname).</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-900/80 text-stone-400 uppercase font-bold border-b border-stone-800">
                <tr>
                  <th className="p-3">ID Mutasi</th>
                  <th className="p-3">Waktu</th>
                  <th className="p-3">Jenis Mutasi</th>
                  <th className="p-3">Sumber / Referensi</th>
                  <th className="p-3">Nama Barang</th>
                  <th className="p-3 text-right">Jumlah</th>
                  <th className="p-3">Keterangan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {mutations.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-stone-500 italic">
                      Belum ada riwayat mutasi stok.
                    </td>
                  </tr>
                ) : (
                  mutations.map((m) => {
                    const isMasuk = m.type === 'Masuk';
                    return (
                      <tr key={m.id} className="hover:bg-stone-900/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-stone-400">{m.id}</td>
                        <td className="p-3 text-stone-300">
                          {new Date(m.date).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            isMasuk 
                              ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' 
                              : m.type === 'Stok Opname'
                                ? 'bg-blue-950/50 text-blue-300 border-blue-500/40'
                                : 'bg-red-950/50 text-red-300 border-red-500/40'
                          }`}>
                            {isMasuk ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                            {m.type}
                          </span>
                        </td>
                        <td className="p-3 text-stone-300 font-medium">{m.source || '-'}</td>
                        <td className="p-3 font-bold text-white">{m.itemName}</td>
                        <td className={`p-3 text-right font-mono font-bold ${isMasuk ? 'text-emerald-400' : 'text-red-400'}`}>
                          {isMasuk ? `+${m.qty}` : `-${m.qty}`} {m.unit}
                        </td>
                        <td className="p-3 text-stone-400 max-w-xs truncate">{m.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT INGREDIENT */}
      {showAddIngModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingIngredient ? 'Edit Bahan Baku' : 'Tambah Master Bahan Baku Baru'}
              </h3>
              <button
                onClick={() => setShowAddIngModal(false)}
                className="text-stone-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveIngredient} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Nama Bahan Baku:</label>
                <input
                  type="text"
                  placeholder="Contoh: Daging Sapi Gandik / Jeruk Limau"
                  value={ingForm.name}
                  onChange={(e) => setIngForm({ ...ingForm, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Kategori:</label>
                  <select
                    value={ingForm.category}
                    onChange={(e) => setIngForm({ ...ingForm, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Daging & Jeroan">Daging & Jeroan</option>
                    <option value="Kuah & Olahan">Kuah & Olahan</option>
                    <option value="Bumbu & Rempah">Bumbu & Rempah</option>
                    <option value="Sayuran & Segar">Sayuran & Segar</option>
                    <option value="Bahan Pokok">Bahan Pokok</option>
                    <option value="Minuman Jadi">Minuman Jadi</option>
                    <option value="Pelengkap">Pelengkap</option>
                    <option value="Operasional / Gas">Operasional / Gas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Satuan:</label>
                  <input
                    type="text"
                    placeholder="kg, gram, liter, pcs, kaleng..."
                    value={ingForm.unit}
                    onChange={(e) => setIngForm({ ...ingForm, unit: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Stok Awal Saat Ini:</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={ingForm.stock}
                    onChange={(e) => setIngForm({ ...ingForm, stock: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Batas Minimum Stok:</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="5"
                    value={ingForm.minStock}
                    onChange={(e) => setIngForm({ ...ingForm, minStock: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddIngModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Simpan Bahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL MUTATION (KELUAR / MASUK / WASTE) */}
      {showMutationModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white">Catat Pemakaian / Mutasi Barang</h3>
              <button
                onClick={() => setShowMutationModal(false)}
                className="text-stone-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRecordMutation} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Pilih Bahan Baku:</label>
                <select
                  value={mutationForm.ingredientId}
                  onChange={(e) => {
                    const found = ingredients.find(i => i.id === e.target.value);
                    setMutationForm({
                      ...mutationForm,
                      ingredientId: e.target.value,
                      unit: found ? found.unit : 'pcs'
                    });
                  }}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                >
                  <option value="">-- Pilih Bahan --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stok: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Jenis Mutasi:</label>
                  <select
                    value={mutationForm.type}
                    onChange={(e) => setMutationForm({ ...mutationForm, type: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Keluar">Keluar (Pemakaian)</option>
                    <option value="Masuk">Masuk (Penambahan)</option>
                    <option value="Waste / Rusak">Waste / Rusak / Basi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Sumber / Alasan:</label>
                  <select
                    value={mutationForm.source}
                    onChange={(e) => setMutationForm({ ...mutationForm, source: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Pemakaian Dapur">Pemakaian Dapur</option>
                    <option value="Perebusan Daging">Perebusan Daging / Kuah</option>
                    <option value="Bahan Basi / Susut">Bahan Basi / Penyusutan</option>
                    <option value="Koreksi Masuk">Koreksi Penambahan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Jumlah ({mutationForm.unit || 'Satuan'}):
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  placeholder="Jumlah pemakaian..."
                  value={mutationForm.qty}
                  onChange={(e) => setMutationForm({ ...mutationForm, qty: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Catatan Tambahan:</label>
                <input
                  type="text"
                  placeholder="Contoh: Pemakaian kuah sop siang"
                  value={mutationForm.notes}
                  onChange={(e) => setMutationForm({ ...mutationForm, notes: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMutationModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Simpan Mutasi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: STOCK OPNAME */}
      {showOpnameModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white">Stok Opname / Cek Fisik</h3>
              <button
                onClick={() => setShowOpnameModal(false)}
                className="text-stone-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleStockOpname} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Pilih Bahan Baku:</label>
                <select
                  value={opnameForm.ingredientId}
                  onChange={(e) => setOpnameForm({ ...opnameForm, ingredientId: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  required
                >
                  <option value="">-- Pilih Bahan --</option>
                  {ingredients.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Stok Sistem: {i.stock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {opnameForm.ingredientId && (
                <div className="bg-stone-900 p-3 rounded-xl border border-stone-800 text-xs text-stone-300">
                  Stok di Sistem: <span className="font-bold text-brand-400">
                    {ingredients.find(i => i.id === opnameForm.ingredientId)?.stock} {ingredients.find(i => i.id === opnameForm.ingredientId)?.unit}
                  </span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Jumlah Fisik Aktual Sebenarnya:</label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  placeholder="Hasil hitung fisik..."
                  value={opnameForm.actualStock}
                  onChange={(e) => setOpnameForm({ ...opnameForm, actualStock: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Keterangan / Alasan Selisih:</label>
                <input
                  type="text"
                  placeholder="Misal: Opname penutupan gerai harian"
                  value={opnameForm.notes}
                  onChange={(e) => setOpnameForm({ ...opnameForm, notes: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-stone-200 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOpnameModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-yellow-600 hover:bg-yellow-500 text-stone-950 font-extrabold text-xs shadow-glow"
                >
                  Sesuaikan Stok Fisik
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
