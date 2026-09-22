import React, { useState } from 'react';
import { 
  UtensilsCrossed, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Search, 
  Tag,
  DollarSign,
  Soup,
  Flame,
  Coffee,
  Sparkles
} from 'lucide-react';

export default function ProductMasterModule({ products, onSaveProduct, onDeleteProduct }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Makanan Utama',
    type: 'Porsian',
    price: '',
    unit: 'porsi',
    active: true
  });

  const categories = ['ALL', 'Makanan Utama', 'SOP PILIHAN', 'Menu Sate', 'Pelengkap', 'Minuman'];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Makanan Utama',
      type: 'Porsian',
      price: '',
      unit: 'porsi',
      active: true
    });
    setShowModal(true);
  };

  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setFormData({
      name: prod.name,
      category: prod.category,
      type: prod.type,
      price: String(prod.price),
      unit: prod.unit || 'porsi',
      active: prod.active !== undefined ? prod.active : true
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || formData.price === '') {
      alert('Nama produk dan harga jual wajib diisi!');
      return;
    }

    try {
      await onSaveProduct({
        ...(editingProduct || {}),
        name: formData.name.trim(),
        category: formData.category,
        type: formData.type,
        price: Number(formData.price),
        unit: formData.unit,
        active: formData.active
      });
      setShowModal(false);
    } catch (err) {
      alert('Gagal menyimpan produk: ' + err.message);
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'Makanan Utama': return <Soup className="w-4 h-4 text-brand-400" />;
      case 'SOP PILIHAN': return <Sparkles className="w-4 h-4 text-betawi-gold" />;
      case 'Menu Sate': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'Minuman': return <Coffee className="w-4 h-4 text-blue-400" />;
      default: return <UtensilsCrossed className="w-4 h-4 text-stone-400" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Master Produk & Menu (Finish Goods)
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Menu Kedai
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Kelola daftar menu porsian, prasmanan potongan daging (@ Rp 7.000), sate, pelengkap, dan minuman.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          + Tambah Menu Baru
        </button>
      </div>

      {/* Main List Container */}
      <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-5">
        
        {/* Search & Category Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cari menu makanan / minuman..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-700 rounded-xl text-xs text-white outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? 'bg-brand-600 text-white shadow-glow'
                    : 'bg-stone-900 border border-stone-800 text-stone-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid of Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const isPrasmanan = prod.type === 'Prasmanan';
            return (
              <div 
                key={prod.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                  isPrasmanan 
                    ? 'bg-amber-950/20 border-betawi-gold/40' 
                    : 'bg-stone-900/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase">
                      {getCategoryIcon(prod.category)}
                      {prod.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      prod.active 
                        ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/40' 
                        : 'bg-stone-800 text-stone-500 border-stone-700'
                    }`}>
                      {prod.active ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-white mb-1">{prod.name}</h4>
                  <div className="text-xs text-stone-400 font-mono mb-3">ID: {prod.id}</div>
                </div>

                <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-stone-400 uppercase font-bold">Harga Jual</div>
                    <div className={`text-base font-black font-mono ${isPrasmanan ? 'text-betawi-gold' : 'text-brand-400'}`}>
                      Rp {Number(prod.price).toLocaleString('id-ID')}
                      <span className="text-xs font-normal text-stone-400"> / {prod.unit || 'porsi'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-all"
                      title="Edit Menu"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Hapus menu "${prod.name}"?`)) {
                          onDeleteProduct(prod.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-stone-800/50 hover:bg-red-950/40 text-stone-500 hover:text-red-400 transition-all"
                      title="Hapus Menu"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* MODAL: TAMBAH / EDIT PRODUK */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1c1917] rounded-3xl border border-stone-700 max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Menu Finish Goods' : 'Tambah Menu Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-stone-400 hover:text-white font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Nama Menu / Produk:</label>
                <input
                  type="text"
                  placeholder="Contoh: Sop Kaki Special / Es Kelapa Muda"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Kategori:</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Makanan Utama">Makanan Utama</option>
                    <option value="SOP PILIHAN">SOP PILIHAN</option>
                    <option value="Menu Sate">Menu Sate</option>
                    <option value="Pelengkap">Pelengkap</option>
                    <option value="Minuman">Minuman</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Tipe Penjualan:</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="Porsian">Porsian Standar</option>
                    <option value="Prasmanan">Prasmanan (Per Potong/Pcs)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Harga Jual (Rp):</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 45000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full bg-stone-900 border border-brand-500/40 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-300 uppercase mb-1">Satuan Hitung:</label>
                  <input
                    type="text"
                    placeholder="porsi, potong, pcs, gelas..."
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="activeCheck" className="text-xs text-stone-300 font-semibold cursor-pointer">
                  Menu Tersedia & Aktif Ditampilkan di POS Kasir
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-stone-800 text-stone-300 text-xs font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow"
                >
                  Simpan Menu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
