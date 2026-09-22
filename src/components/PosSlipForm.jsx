import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Minus, 
  Trash2, 
  Save, 
  Printer, 
  RotateCcw, 
  CheckCircle, 
  DollarSign, 
  Utensils, 
  Soup, 
  Coffee, 
  Flame,
  Layers,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PosSlipForm({ products, onSaleSaved }) {
  // Nota Header Info
  const [tableNo, setTableNo] = useState('01');
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [orderType, setOrderType] = useState('Dine-in');
  const [cashierName, setCashierName] = useState('Kasir 1');
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [cashGiven, setCashGiven] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Item Quantities map: { [productId]: { qty: number, notes: string, customPrice?: number } }
  const [regularQuantities, setRegularQuantities] = useState({});

  // Prasmanan / Sop Pilihan Bowls (Supports multiple custom bowls or itemized entries)
  const [prasmananBowls, setPrasmananBowls] = useState([
    {
      id: 1,
      bowlLabel: 'Mangkok 1',
      kakiQty: 0,
      potonganDagingQty: 0, // @ Rp 7.000
      sumsumOtakQty: 0,
      brothType: 'Kuah Susu Gurih',
      notes: ''
    }
  ]);

  // Loading & success state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSavedSale, setLastSavedSale] = useState(null);

  // Group products by category from master
  const porsianProducts = products.filter(p => p.category === 'Makanan Utama' && p.active);
  const sateProducts = products.filter(p => p.category === 'Menu Sate' && p.active);
  const pelengkapProducts = products.filter(p => p.category === 'Pelengkap' && p.active);
  const minumanProducts = products.filter(p => p.category === 'Minuman' && p.active);

  // Unit prices for prasmanan items
  const potongPrice = 7000;
  const kakiPrice = products.find(p => p.id === 'PROD-07')?.price || 22000;
  const sumsumPrice = products.find(p => p.id === 'PROD-08')?.price || 16000;

  // Handle regular qty changes
  const handleQtyChange = (prodId, delta) => {
    setRegularQuantities(prev => {
      const current = prev[prodId]?.qty || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return {
        ...prev,
        [prodId]: {
          ...(prev[prodId] || {}),
          qty: next
        }
      };
    });
  };

  const setDirectQty = (prodId, val) => {
    const num = parseInt(val, 10);
    setRegularQuantities(prev => {
      if (isNaN(num) || num <= 0) {
        const copy = { ...prev };
        delete copy[prodId];
        return copy;
      }
      return {
        ...prev,
        [prodId]: {
          ...(prev[prodId] || {}),
          qty: num
        }
      };
    });
  };

  const setItemNotes = (prodId, notes) => {
    setRegularQuantities(prev => {
      if (!prev[prodId]) return prev;
      return {
        ...prev,
        [prodId]: {
          ...prev[prodId],
          notes
        }
      };
    });
  };

  // Prasmanan Handlers
  const addPrasmananBowl = () => {
    setPrasmananBowls(prev => [
      ...prev,
      {
        id: Date.now(),
        bowlLabel: `Mangkok ${prev.length + 1}`,
        kakiQty: 0,
        potonganDagingQty: 0,
        sumsumOtakQty: 0,
        brothType: 'Kuah Susu Gurih',
        notes: ''
      }
    ]);
  };

  const removePrasmananBowl = (id) => {
    if (prasmananBowls.length === 1) {
      // Reset first bowl instead of deleting all
      setPrasmananBowls([{
        id: 1,
        bowlLabel: 'Mangkok 1',
        kakiQty: 0,
        potonganDagingQty: 0,
        sumsumOtakQty: 0,
        brothType: 'Kuah Susu Gurih',
        notes: ''
      }]);
      return;
    }
    setPrasmananBowls(prev => prev.filter(b => b.id !== id));
  };

  const updatePrasmananBowl = (id, field, value) => {
    setPrasmananBowls(prev => prev.map(b => {
      if (b.id !== id) return b;
      return { ...b, [field]: value };
    }));
  };

  // Calculate Subtotals & Total
  const regularItemsCalculated = Object.entries(regularQuantities).map(([prodId, data]) => {
    const prod = products.find(p => p.id === prodId);
    if (!prod) return null;
    return {
      productId: prod.id,
      name: prod.name,
      qty: data.qty,
      price: prod.price,
      subtotal: data.qty * prod.price,
      notes: data.notes || ''
    };
  }).filter(Boolean);

  const prasmananItemsCalculated = prasmananBowls.map((b, idx) => {
    const totalPotongan = (Number(b.potonganDagingQty) || 0) * potongPrice;
    const totalKaki = (Number(b.kakiQty) || 0) * kakiPrice;
    const totalSumsum = (Number(b.sumsumOtakQty) || 0) * sumsumPrice;
    const bowlSubtotal = totalPotongan + totalKaki + totalSumsum;

    if (bowlSubtotal === 0) return null;

    const parts = [];
    if (b.potonganDagingQty > 0) parts.push(`${b.potonganDagingQty} Potong Daging/Jeroan`);
    if (b.kakiQty > 0) parts.push(`${b.kakiQty} Kaki`);
    if (b.sumsumOtakQty > 0) parts.push(`${b.sumsumOtakQty} Sumsum/Otak`);

    const desc = `${parts.join(', ')} (${b.brothType})${b.notes ? ' - ' + b.notes : ''}`;

    return {
      productId: 'PROD-06',
      name: `SOP PILIHAN (${b.bowlLabel}): ${desc}`,
      qty: 1,
      price: bowlSubtotal,
      subtotal: bowlSubtotal,
      notes: b.brothType,
      bowlDetails: b
    };
  }).filter(Boolean);

  const allOrderItems = [...regularItemsCalculated, ...prasmananItemsCalculated];
  const grandTotal = allOrderItems.reduce((acc, it) => acc + it.subtotal, 0);

  // Cash Change Calculation
  const cashNum = parseFloat(cashGiven) || 0;
  const changeDue = Math.max(0, cashNum - grandTotal);

  // Reset Form
  const handleReset = () => {
    setRegularQuantities({});
    setPrasmananBowls([{
      id: 1,
      bowlLabel: 'Mangkok 1',
      kakiQty: 0,
      potonganDagingQty: 0,
      sumsumOtakQty: 0,
      brothType: 'Kuah Susu Gurih',
      notes: ''
    }]);
    setCashGiven('');
    setOrderNotes('');
  };

  // Submit Sale / Nota
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (allOrderItems.length === 0) {
      alert('Pilih setidaknya 1 menu atau item prasmanan untuk mencatat nota!');
      return;
    }

    setIsSubmitting(true);
    try {
      const salePayload = {
        date: new Date(`${orderDate}T${new Date().toTimeString().slice(0, 8)}`).toISOString(),
        tableNo,
        orderType,
        cashier: cashierName,
        items: allOrderItems,
        totalAmount: grandTotal,
        paymentMethod,
        notes: orderNotes,
        status: 'Lunas'
      };

      const result = await onSaleSaved(salePayload);
      setLastSavedSale(result);

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.8 }
        });
      } catch (err) {}

      handleReset();
    } catch (err) {
      alert('Gagal menyimpan nota penjualan: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Page Title & Quick Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <Soup className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Digitalisasi Form Nota Penjualan
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                Format Fisik Kedai
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Input hasil rekapan nota kertas untuk mencatat transaksi penjualan, memperbarui stok, dan laporan omzet.
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          type="button"
          className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Form
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT & CENTER COLUMN: The Authentic Digital Paper Slip (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Paper Slip Card Container */}
          <div className="bg-[#191715] rounded-3xl border-2 border-stone-700/60 shadow-2xl p-5 sm:p-7 relative overflow-hidden">
            
            {/* Header Nota Tradisional */}
            <div className="border-b-2 border-dashed border-stone-700 pb-5 mb-6 text-center relative">
              <div className="inline-block mb-1 text-2xl">🍲</div>
              <h3 className="text-2xl font-black tracking-tight text-white uppercase">
                KEDAI "AMUD KUMIS"
              </h3>
              <p className="text-sm font-bold text-betawi-red tracking-wider uppercase">
                HIDANGAN KHAS JAKARTA
              </p>
              <p className="text-xs text-stone-400 mt-0.5">
                Sop Kaki Kambing & Sate Ayam • Sop Daging Sapi & Sate Kambing
              </p>
              <p className="text-[11px] text-stone-500 italic">
                Jl. Limo Raya (Dekat Kampus UPN Limo)
              </p>

              {/* Form Input Header: Tanggal & Meja No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 text-left bg-stone-900/90 p-3.5 rounded-2xl border border-stone-800">
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase">Tanggal Nota</label>
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full mt-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-brand-400 uppercase">Meja No :</label>
                  <input
                    type="text"
                    placeholder="Contoh: 05 / VIP"
                    value={tableNo}
                    onChange={(e) => setTableNo(e.target.value)}
                    className="w-full mt-1 bg-stone-800 border border-brand-500/40 rounded-xl px-3 py-1.5 text-xs text-white font-bold focus:ring-2 focus:ring-brand-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-400 uppercase">Tipe Pesanan</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full mt-1 bg-stone-800 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-white font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                  >
                    <option value="Dine-in">Makan di Tempat (Dine-in)</option>
                    <option value="Bungkus / Takeaway">Bungkus (Takeaway)</option>
                    <option value="Ojol / Delivery">Ojek Online / Delivery</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 1: MENU MAKANAN (PORSIAN STANDAR) */}
            <div className="mb-7">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-extrabold text-brand-400 uppercase tracking-wider flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-brand-400" />
                  1. Menu Makanan (Porsian)
                </h4>
                <span className="text-[11px] text-stone-400">Harga Lengkap Per Porsi</span>
              </div>

              <div className="space-y-2">
                {porsianProducts.map((prod) => {
                  const qty = regularQuantities[prod.id]?.qty || 0;
                  return (
                    <div 
                      key={prod.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        qty > 0 
                          ? 'bg-brand-950/30 border-brand-500/40 shadow-sm' 
                          : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex-1 pr-3">
                        <div className="font-bold text-sm text-stone-100">{prod.name}</div>
                        <div className="text-xs text-brand-400 font-semibold mt-0.5">
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, -1)}
                          disabled={qty === 0}
                          className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-stone-700 disabled:opacity-30 disabled:hover:bg-stone-800 flex items-center justify-center text-stone-300 font-bold transition-all active:scale-95"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => setDirectQty(prod.id, e.target.value)}
                          className="w-12 h-8 text-center bg-stone-950 border border-stone-700 rounded-xl text-sm font-bold text-white focus:ring-1 focus:ring-brand-500 outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, 1)}
                          className="w-8 h-8 rounded-xl bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white font-bold transition-all active:scale-95 shadow-glow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-24 text-right font-mono font-bold text-xs text-stone-200">
                          {qty > 0 ? `Rp ${(qty * prod.price).toLocaleString('id-ID')}` : '-'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 2: SOP PILIHAN (KONSEP PRASMANAN @ RP 7.000 / POTONG) */}
            <div className="mb-7 bg-stone-950/80 p-4 sm:p-5 rounded-2xl border-2 border-brand-500/30">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-stone-800">
                <div>
                  <h4 className="text-sm font-extrabold text-betawi-gold uppercase tracking-wider flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-betawi-gold" />
                    2. SOP PILIHAN (Prasmanan Kustom)
                  </h4>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Hitung per potong daging/jeroan <span className="font-bold text-betawi-gold">@ Rp 7.000</span> + Kaki + Sumsum/Otak
                  </p>
                </div>

                <button
                  type="button"
                  onClick={addPrasmananBowl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-betawi-gold/20 hover:bg-betawi-gold/30 text-yellow-300 border border-betawi-gold/40 text-xs font-bold transition-all self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  + Tambah Mangkok Prasmanan
                </button>
              </div>

              {/* Prasmanan Bowls List */}
              <div className="space-y-4">
                {prasmananBowls.map((bowl, bIdx) => {
                  const bowlTotal = (Number(bowl.potonganDagingQty) || 0) * potongPrice +
                                    (Number(bowl.kakiQty) || 0) * kakiPrice +
                                    (Number(bowl.sumsumOtakQty) || 0) * sumsumPrice;

                  return (
                    <div 
                      key={bowl.id}
                      className="bg-stone-900/90 rounded-2xl p-4 border border-stone-800 hover:border-stone-700 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-stone-800/80 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold flex items-center justify-center border border-brand-500/30">
                            {bIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={bowl.bowlLabel}
                            onChange={(e) => updatePrasmananBowl(bowl.id, 'bowlLabel', e.target.value)}
                            className="bg-transparent text-sm font-bold text-stone-200 border-b border-dashed border-stone-600 focus:border-brand-500 outline-none w-32 px-1"
                          />
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono font-bold text-betawi-gold">
                            Subtotal: Rp {bowlTotal.toLocaleString('id-ID')}
                          </span>
                          {prasmananBowls.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePrasmananBowl(bowl.id)}
                              className="text-stone-500 hover:text-red-400 transition-colors p-1"
                              title="Hapus mangkok ini"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 3 Columns as on Slip: Kaki | Potongan (Daging) @ 7rb | Sumsum/Otak */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        
                        {/* Potongan Daging @ 7.000 */}
                        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                          <label className="block text-[11px] font-bold text-betawi-gold uppercase">
                            Potongan Daging/Jeroan
                          </label>
                          <div className="text-[10px] text-stone-400 mb-1.5">Rp 7.000 / potong</div>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="0"
                              placeholder="0 potong"
                              value={bowl.potonganDagingQty || ''}
                              onChange={(e) => updatePrasmananBowl(bowl.id, 'potonganDagingQty', parseInt(e.target.value) || 0)}
                              className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:ring-1 focus:ring-brand-500 outline-none"
                            />
                          </div>
                          {bowl.potonganDagingQty > 0 && (
                            <div className="text-[10px] text-stone-400 mt-1 font-mono">
                              = Rp {(bowl.potonganDagingQty * potongPrice).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>

                        {/* Kaki Kambing */}
                        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                          <label className="block text-[11px] font-bold text-stone-300 uppercase">
                            Kaki Kambing
                          </label>
                          <div className="text-[10px] text-stone-400 mb-1.5">Rp {kakiPrice.toLocaleString('id-ID')} / pcs</div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0 pcs"
                            value={bowl.kakiQty || ''}
                            onChange={(e) => updatePrasmananBowl(bowl.id, 'kakiQty', parseInt(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:ring-1 focus:ring-brand-500 outline-none"
                          />
                          {bowl.kakiQty > 0 && (
                            <div className="text-[10px] text-stone-400 mt-1 font-mono">
                              = Rp {(bowl.kakiQty * kakiPrice).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>

                        {/* Sumsum / Otak */}
                        <div className="bg-stone-950 p-3 rounded-xl border border-stone-800">
                          <label className="block text-[11px] font-bold text-stone-300 uppercase">
                            Sumsum / Otak
                          </label>
                          <div className="text-[10px] text-stone-400 mb-1.5">Rp {sumsumPrice.toLocaleString('id-ID')} / porsi</div>
                          <input
                            type="number"
                            min="0"
                            placeholder="0 porsi"
                            value={bowl.sumsumOtakQty || ''}
                            onChange={(e) => updatePrasmananBowl(bowl.id, 'sumsumOtakQty', parseInt(e.target.value) || 0)}
                            className="w-full bg-stone-900 border border-stone-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-bold focus:ring-1 focus:ring-brand-500 outline-none"
                          />
                          {bowl.sumsumOtakQty > 0 && (
                            <div className="text-[10px] text-stone-400 mt-1 font-mono">
                              = Rp {(bowl.sumsumOtakQty * sumsumPrice).toLocaleString('id-ID')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Kuah & Catatan Pilihan */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div>
                          <label className="block text-[10px] text-stone-400 uppercase font-semibold">Pilihan Kuah:</label>
                          <select
                            value={bowl.brothType}
                            onChange={(e) => updatePrasmananBowl(bowl.id, 'brothType', e.target.value)}
                            className="w-full mt-0.5 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none"
                          >
                            <option value="Kuah Susu Gurih">Kuah Susu Gurih (Khas)</option>
                            <option value="Kuah Santan Tradisional">Kuah Santan Tradisional</option>
                            <option value="Kuah Bening">Kuah Bening</option>
                            <option value="Kuah Campur Susu+Santan">Kuah Campur Susu + Santan</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] text-stone-400 uppercase font-semibold">Catatan Isi (Opsional):</label>
                          <input
                            type="text"
                            placeholder="Contoh: Daging 3, Babat 2, Paru 1"
                            value={bowl.notes}
                            onChange={(e) => updatePrasmananBowl(bowl.id, 'notes', e.target.value)}
                            className="w-full mt-0.5 bg-stone-800 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: MENU SATE */}
            <div className="mb-7">
              <h4 className="text-sm font-extrabold text-brand-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-500" />
                3. Menu Sate
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {sateProducts.map((prod) => {
                  const qty = regularQuantities[prod.id]?.qty || 0;
                  return (
                    <div 
                      key={prod.id}
                      className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                        qty > 0 
                          ? 'bg-brand-950/30 border-brand-500/40' 
                          : 'bg-stone-900/50 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-bold text-sm text-stone-100">{prod.name}</div>
                        <div className="text-xs text-brand-400 font-semibold">
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, -1)}
                          disabled={qty === 0}
                          className="w-7 h-7 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center text-xs font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => setDirectQty(prod.id, e.target.value)}
                          className="w-10 h-7 text-center bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, 1)}
                          className="w-7 h-7 rounded-lg bg-brand-600 hover:bg-brand-500 flex items-center justify-center text-white text-xs font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 4: NASI, MINUMAN & PELENGKAP */}
            <div>
              <h4 className="text-sm font-extrabold text-brand-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Coffee className="w-4 h-4 text-emerald-400" />
                4. Nasi, Minuman & Pelengkap
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[...pelengkapProducts, ...minumanProducts].map((prod) => {
                  const qty = regularQuantities[prod.id]?.qty || 0;
                  return (
                    <div 
                      key={prod.id}
                      className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                        qty > 0 
                          ? 'bg-emerald-950/20 border-emerald-500/40' 
                          : 'bg-stone-900/40 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      <div className="flex-1 pr-2">
                        <div className="font-semibold text-xs text-stone-100">{prod.name}</div>
                        <div className="text-[11px] text-stone-400">
                          Rp {prod.price.toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, -1)}
                          disabled={qty === 0}
                          className="w-6 h-6 rounded-lg bg-stone-800 hover:bg-stone-700 disabled:opacity-30 flex items-center justify-center text-xs"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={qty || ''}
                          placeholder="0"
                          onChange={(e) => setDirectQty(prod.id, e.target.value)}
                          className="w-9 h-6 text-center bg-stone-950 border border-stone-700 rounded-lg text-xs font-bold text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQtyChange(prod.id, 1)}
                          className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 flex items-center justify-center text-white text-xs font-bold"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Order Summary & Checkout Action (4 Cols) */}
        <div id="order-summary-box" className="lg:col-span-4 space-y-5">
          
          {/* Summary Box */}
          <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 shadow-xl lg:sticky lg:top-28 space-y-4">
            
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-brand-400" />
                Rincian Nota (Meja {tableNo})
              </h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
                {allOrderItems.length} Item
              </span>
            </div>

            {/* Itemized list preview */}
            <div className="max-h-60 overflow-y-auto space-y-2 pr-1 text-xs">
              {allOrderItems.length === 0 ? (
                <div className="py-8 text-center text-stone-500 italic">
                  Belum ada item dipilih pada nota ini.
                </div>
              ) : (
                allOrderItems.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between py-1.5 border-b border-stone-800/60">
                    <div className="flex-1 pr-2">
                      <div className="font-semibold text-stone-200 leading-tight">{item.name}</div>
                      <div className="text-[10px] text-stone-400">
                        {item.qty}x @ Rp {item.price.toLocaleString('id-ID')}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-stone-100 whitespace-nowrap">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Total Calculation */}
            <div className="bg-stone-900 p-4 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex justify-between items-center text-xs text-stone-400">
                <span>Subtotal Pesanan</span>
                <span className="font-mono">Rp {grandTotal.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-stone-800">
                <span className="text-sm font-extrabold text-white uppercase">Total Jumlah Rp</span>
                <span className="text-2xl font-black font-mono text-brand-400">
                  Rp {grandTotal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-400 uppercase mb-1.5">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tunai', 'QRIS', 'Transfer'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-1 text-xs font-bold rounded-xl border text-center transition-all ${
                        paymentMethod === m
                          ? 'bg-brand-600 border-brand-500 text-white shadow-glow'
                          : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash given & change (Only if Tunai) */}
              {paymentMethod === 'Tunai' && (
                <div className="grid grid-cols-2 gap-2 bg-stone-900/60 p-3 rounded-xl border border-stone-800">
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Uang Diterima</label>
                    <input
                      type="number"
                      placeholder="Rp..."
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      className="w-full mt-1 bg-stone-950 border border-stone-700 rounded-lg px-2 py-1 text-xs text-white font-mono outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-stone-400 uppercase">Kembalian</label>
                    <div className="mt-1 px-2 py-1 text-xs font-mono font-bold text-emerald-400 bg-stone-950 rounded-lg border border-stone-800">
                      Rp {changeDue.toLocaleString('id-ID')}
                    </div>
                  </div>
                </div>
              )}

              {/* Cashier name / Pelayan input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase">Kasir / Pelayan</label>
                  <input
                    type="text"
                    value={cashierName}
                    onChange={(e) => setCashierName(e.target.value)}
                    className="w-full mt-1 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-stone-400 uppercase">Catatan Tambahan</label>
                  <input
                    type="text"
                    placeholder="Misal: Tanpa daun bawang"
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full mt-1 bg-stone-900 border border-stone-700 rounded-lg px-2 py-1 text-xs text-stone-200 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="submit"
              disabled={isSubmitting || allOrderItems.length === 0}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-brand-600 to-betawi-red hover:from-brand-500 hover:to-red-600 text-white font-extrabold text-sm shadow-glow flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Menyimpan Nota...' : 'SIMPAN NOTA PENJUALAN'}
            </button>

          </div>

          {/* Success Notification Card */}
          {lastSavedSale && (
            <div className="bg-emerald-950/30 border border-emerald-600/40 p-4 rounded-2xl text-xs space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                Nota #{lastSavedSale.id} Berhasil Disimpan!
              </div>
              <p className="text-stone-300">
                Total Rp {lastSavedSale.totalAmount?.toLocaleString('id-ID')} ({lastSavedSale.paymentMethod}) tercatat di sistem & inventori.
              </p>
            </div>
          )}

        </div>

      </form>

      {/* MOBILE STICKY BOTTOM BAR (Tampil hanya di layar HP saat ada item dipilih) */}
      {allOrderItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#191715]/95 backdrop-blur-lg border-t border-brand-500/40 p-3 shadow-2xl animate-fadeIn">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <div className="space-y-0.5">
              <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">
                Meja {tableNo} • {allOrderItems.length} Item
              </div>
              <div className="text-lg font-black font-mono text-brand-400">
                Rp {grandTotal.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('order-summary-box');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-betawi-red text-white text-xs font-bold shadow-glow flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Save className="w-3.5 h-3.5" />
              Lihat & Simpan
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
