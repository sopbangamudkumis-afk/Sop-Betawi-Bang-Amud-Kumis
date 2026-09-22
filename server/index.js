import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDatabase, saveDatabase } from './storage.js';
import { testConnection, syncAllToGoogleSheets, initSpreadsheetStructure } from './googleSheets.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const upload = multer({ storage: multer.memoryStorage() });

// Helper: Auto-sync in background if enabled
async function maybeAutoSync(db) {
  if (db.googleConfig && db.googleConfig.autoSync && db.googleConfig.spreadsheetId && db.googleConfig.clientEmail && db.googleConfig.privateKey) {
    try {
      await syncAllToGoogleSheets(
        db.googleConfig.spreadsheetId,
        db.googleConfig.clientEmail,
        db.googleConfig.privateKey,
        db
      );
      db.googleConfig.lastSyncTime = new Date().toISOString();
      saveDatabase(db);
    } catch (err) {
      console.error('Auto-sync to Google Sheets warning:', err.message);
    }
  }
}

// ======================== API ROUTES ========================

// 1. Health & Store Info
app.get('/api/health', (req, res) => {
  const db = getDatabase();
  res.json({
    status: 'ok',
    storeInfo: db.storeInfo,
    isGoogleConnected: !!(db.googleConfig && db.googleConfig.spreadsheetId && db.googleConfig.clientEmail),
    lastSyncTime: db.googleConfig?.lastSyncTime || null
  });
});

app.put('/api/store-info', (req, res) => {
  const db = getDatabase();
  db.storeInfo = { ...db.storeInfo, ...req.body };
  saveDatabase(db);
  res.json({ success: true, storeInfo: db.storeInfo });
});

// 2. Google Sheets Config & Sync
app.get('/api/config', (req, res) => {
  const db = getDatabase();
  const cfg = db.googleConfig || {};
  res.json({
    spreadsheetId: cfg.spreadsheetId || '',
    clientEmail: cfg.clientEmail || '',
    hasPrivateKey: !!cfg.privateKey,
    autoSync: !!cfg.autoSync,
    lastSyncTime: cfg.lastSyncTime || null
  });
});

app.post('/api/config', async (req, res) => {
  try {
    const db = getDatabase();
    const { spreadsheetId, clientEmail, privateKey, autoSync } = req.body;
    
    db.googleConfig = {
      spreadsheetId: spreadsheetId !== undefined ? spreadsheetId.trim() : (db.googleConfig?.spreadsheetId || ''),
      clientEmail: clientEmail !== undefined ? clientEmail.trim() : (db.googleConfig?.clientEmail || ''),
      privateKey: privateKey !== undefined && privateKey.trim() !== '' ? privateKey.trim() : (db.googleConfig?.privateKey || ''),
      autoSync: autoSync !== undefined ? !!autoSync : (db.googleConfig?.autoSync || false),
      lastSyncTime: db.googleConfig?.lastSyncTime || null
    };

    saveDatabase(db);
    res.json({ success: true, message: 'Konfigurasi Google Sheets berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/config/upload-key', upload.single('serviceAccountJson'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File service account JSON tidak ditemukan' });
    }
    const jsonStr = req.file.buffer.toString('utf-8');
    const parsed = JSON.parse(jsonStr);

    if (!parsed.client_email || !parsed.private_key) {
      return res.status(400).json({ error: 'Format file JSON tidak valid. Memerlukan client_email dan private_key.' });
    }

    const db = getDatabase();
    db.googleConfig = db.googleConfig || {};
    db.googleConfig.clientEmail = parsed.client_email;
    db.googleConfig.privateKey = parsed.private_key;
    saveDatabase(db);

    res.json({
      success: true,
      clientEmail: parsed.client_email,
      message: 'Kredensial Service Account berhasil dimuat!'
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal memproses file JSON: ' + err.message });
  }
});

app.post('/api/config/test', async (req, res) => {
  try {
    const db = getDatabase();
    const spreadsheetId = req.body.spreadsheetId || db.googleConfig?.spreadsheetId;
    const clientEmail = req.body.clientEmail || db.googleConfig?.clientEmail;
    const privateKey = req.body.privateKey || db.googleConfig?.privateKey;

    if (!spreadsheetId || !clientEmail || !privateKey) {
      return res.status(400).json({ error: 'Harap lengkapi Spreadsheet ID, Client Email, dan Private Key.' });
    }

    const testRes = await testConnection(spreadsheetId, clientEmail, privateKey);
    res.json(testRes);
  } catch (err) {
    res.status(400).json({ error: 'Gagal terhubung ke Google Sheets: ' + err.message });
  }
});

app.post('/api/sync', async (req, res) => {
  try {
    const db = getDatabase();
    const cfg = db.googleConfig;
    if (!cfg || !cfg.spreadsheetId || !cfg.clientEmail || !cfg.privateKey) {
      return res.status(400).json({ error: 'Konfigurasi Google Sheets belum lengkap. Buka menu Pengaturan untuk memasukkan kredensial.' });
    }

    const syncRes = await syncAllToGoogleSheets(cfg.spreadsheetId, cfg.clientEmail, cfg.privateKey, db);
    db.googleConfig.lastSyncTime = syncRes.timestamp;
    saveDatabase(db);

    res.json({ success: true, message: 'Sinkronisasi ke Google Sheets berhasil!', timestamp: syncRes.timestamp });
  } catch (err) {
    res.status(500).json({ error: 'Gagal sinkronisasi: ' + err.message });
  }
});

// 3. Products (Finish Goods)
app.get('/api/products', (req, res) => {
  const db = getDatabase();
  res.json(db.products || []);
});

app.post('/api/products', async (req, res) => {
  const db = getDatabase();
  const { name, category, type, price, unit, active } = req.body;
  if (!name || price === undefined) {
    return res.status(400).json({ error: 'Nama produk dan harga wajib diisi' });
  }

  const newProduct = {
    id: `PROD-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    category: category || 'Makanan Utama',
    type: type || 'Porsian',
    price: Number(price),
    unit: unit || 'porsi',
    active: active !== undefined ? !!active : true,
  };

  db.products = db.products || [];
  db.products.push(newProduct);
  saveDatabase(db);
  maybeAutoSync(db);

  res.status(201).json(newProduct);
});

app.put('/api/products/:id', async (req, res) => {
  const db = getDatabase();
  const idx = (db.products || []).findIndex(p => p.id === req.params.id);
  if (idx === -1) {
    return res.status(400).json({ error: 'Produk tidak ditemukan' });
  }

  db.products[idx] = {
    ...db.products[idx],
    ...req.body,
    price: req.body.price !== undefined ? Number(req.body.price) : db.products[idx].price
  };
  saveDatabase(db);
  maybeAutoSync(db);

  res.json(db.products[idx]);
});

app.delete('/api/products/:id', async (req, res) => {
  const db = getDatabase();
  db.products = (db.products || []).filter(p => p.id !== req.params.id);
  saveDatabase(db);
  maybeAutoSync(db);
  res.json({ success: true, message: 'Produk berhasil dihapus' });
});

// 4. Ingredients (Bahan Baku)
app.get('/api/ingredients', (req, res) => {
  const db = getDatabase();
  res.json(db.ingredients || []);
});

app.post('/api/ingredients', async (req, res) => {
  const db = getDatabase();
  const { name, category, unit, stock, minStock } = req.body;
  if (!name || !unit) {
    return res.status(400).json({ error: 'Nama bahan baku dan satuan wajib diisi' });
  }

  const newIng = {
    id: `ING-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    category: category || 'Bumbu & Bahan',
    unit: unit.trim(),
    stock: Number(stock) || 0,
    minStock: Number(minStock) || 0,
  };

  db.ingredients = db.ingredients || [];
  db.ingredients.push(newIng);
  saveDatabase(db);
  maybeAutoSync(db);

  res.status(201).json(newIng);
});

app.put('/api/ingredients/:id', async (req, res) => {
  const db = getDatabase();
  const idx = (db.ingredients || []).findIndex(i => i.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });
  }

  db.ingredients[idx] = {
    ...db.ingredients[idx],
    ...req.body,
    stock: req.body.stock !== undefined ? Number(req.body.stock) : db.ingredients[idx].stock,
    minStock: req.body.minStock !== undefined ? Number(req.body.minStock) : db.ingredients[idx].minStock,
  };
  saveDatabase(db);
  maybeAutoSync(db);

  res.json(db.ingredients[idx]);
});

app.delete('/api/ingredients/:id', async (req, res) => {
  const db = getDatabase();
  db.ingredients = (db.ingredients || []).filter(i => i.id !== req.params.id);
  saveDatabase(db);
  maybeAutoSync(db);
  res.json({ success: true, message: 'Bahan baku berhasil dihapus' });
});

// 5. Purchases (Belanja Pasar / Bahan Baku)
app.get('/api/purchases', (req, res) => {
  const db = getDatabase();
  const sorted = [...(db.purchases || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

app.post('/api/purchases', async (req, res) => {
  const db = getDatabase();
  const { date, supplier, buyer, items, notes } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Daftar item belanja wajib diisi' });
  }

  const dateStr = date ? new Date(date) : new Date();
  const ymd = dateStr.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String((db.purchases || []).length + 1).padStart(3, '0');
  const purchaseId = `BELANJA-${ymd}-${seq}`;

  let totalAmount = 0;
  const processedItems = items.map(item => {
    const qty = Number(item.qty) || 1;
    const unitPrice = Number(item.unitPrice) || 0;
    const subtotal = item.subtotal ? Number(item.subtotal) : qty * unitPrice;
    totalAmount += subtotal;

    // Check if ingredient exists, if not, auto register into Master Bahan Baku!
    let ing = (db.ingredients || []).find(i => i.name.toLowerCase() === item.name.toLowerCase() || i.id === item.ingredientId);
    if (!ing) {
      ing = {
        id: `ING-${Date.now().toString().slice(-4)}`,
        name: item.name.trim(),
        category: item.category || 'Belanja Pasar',
        unit: item.unit || 'pcs',
        stock: 0,
        minStock: 2,
      };
      db.ingredients = db.ingredients || [];
      db.ingredients.push(ing);
    }

    // Update stock
    ing.stock = Number(ing.stock || 0) + qty;

    // Create mutasi log for each item
    db.mutations = db.mutations || [];
    db.mutations.unshift({
      id: `MUT-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      date: dateStr.toISOString(),
      type: 'Masuk',
      source: 'Belanja Pasar',
      refId: purchaseId,
      itemName: ing.name,
      qty: qty,
      unit: item.unit || ing.unit,
      notes: `Pembelian dari ${supplier || 'Pasar'}`
    });

    return {
      ingredientId: ing.id,
      name: ing.name,
      qty,
      unit: item.unit || ing.unit,
      unitPrice,
      subtotal
    };
  });

  const newPurchase = {
    id: purchaseId,
    date: dateStr.toISOString(),
    supplier: supplier ? supplier.trim() : 'Pasar',
    buyer: buyer ? buyer.trim() : 'Bang Amud',
    items: processedItems,
    totalAmount,
    notes: notes || ''
  };

  db.purchases = db.purchases || [];
  db.purchases.unshift(newPurchase);
  saveDatabase(db);
  maybeAutoSync(db);

  res.status(201).json(newPurchase);
});

// 6. Sales / Nota Penjualan
app.get('/api/sales', (req, res) => {
  const db = getDatabase();
  const sorted = [...(db.sales || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

app.post('/api/sales', async (req, res) => {
  const db = getDatabase();
  const { date, tableNo, orderType, cashier, items, paymentMethod, notes, status } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'Item pesanan tidak boleh kosong' });
  }

  const dateObj = date ? new Date(date) : new Date();
  const ymd = dateObj.toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String((db.sales || []).length + 1).padStart(3, '0');
  const notaId = `NOTA-${ymd}-${seq}`;

  let totalAmount = 0;
  const processedItems = items.map(it => {
    const qty = Number(it.qty) || 1;
    const price = Number(it.price) || 0;
    const subtotal = it.subtotal ? Number(it.subtotal) : qty * price;
    totalAmount += subtotal;
    return {
      productId: it.productId || '-',
      name: it.name,
      qty,
      price,
      subtotal,
      notes: it.notes || ''
    };
  });

  const newSale = {
    id: notaId,
    date: dateObj.toISOString(),
    tableNo: tableNo ? String(tableNo).trim() : '01',
    orderType: orderType || 'Dine-in',
    cashier: cashier ? cashier.trim() : 'Kasir',
    items: processedItems,
    totalAmount,
    paymentMethod: paymentMethod || 'Tunai',
    status: status || 'Lunas',
    notes: notes || ''
  };

  db.sales = db.sales || [];
  db.sales.unshift(newSale);
  saveDatabase(db);
  maybeAutoSync(db);

  res.status(201).json(newSale);
});

app.delete('/api/sales/:id', async (req, res) => {
  const db = getDatabase();
  db.sales = (db.sales || []).filter(s => s.id !== req.params.id);
  saveDatabase(db);
  maybeAutoSync(db);
  res.json({ success: true, message: 'Nota penjualan berhasil dihapus' });
});

// 7. Inventory & Mutations
app.get('/api/inventory/mutations', (req, res) => {
  const db = getDatabase();
  const sorted = [...(db.mutations || [])].sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(sorted);
});

app.post('/api/inventory/mutations', async (req, res) => {
  const db = getDatabase();
  const { date, type, source, ingredientId, itemName, qty, unit, notes } = req.body;

  if ((!ingredientId && !itemName) || !qty || !type) {
    return res.status(400).json({ error: 'Bahan/Barang, jenis mutasi, dan jumlah wajib diisi' });
  }

  const numQty = Number(qty);
  let ing = (db.ingredients || []).find(i => i.id === ingredientId || i.name.toLowerCase() === (itemName || '').toLowerCase());
  
  if (ing) {
    if (type === 'Masuk') {
      ing.stock = Number(ing.stock || 0) + numQty;
    } else if (type === 'Keluar' || type === 'Waste / Rusak') {
      ing.stock = Math.max(0, Number(ing.stock || 0) - numQty);
    }
  }

  const newMut = {
    id: `MUT-${Date.now()}`,
    date: date ? new Date(date).toISOString() : new Date().toISOString(),
    type,
    source: source || (type === 'Keluar' ? 'Pemakaian Dapur' : 'Penerimaan'),
    itemName: ing ? ing.name : (itemName || 'Barang'),
    qty: numQty,
    unit: unit || (ing ? ing.unit : 'pcs'),
    notes: notes || ''
  };

  db.mutations = db.mutations || [];
  db.mutations.unshift(newMut);
  saveDatabase(db);
  maybeAutoSync(db);

  res.status(201).json(newMut);
});

// Stock Opname
app.post('/api/inventory/opname', async (req, res) => {
  const db = getDatabase();
  const { ingredientId, actualStock, notes } = req.body;

  const ing = (db.ingredients || []).find(i => i.id === ingredientId);
  if (!ing) {
    return res.status(404).json({ error: 'Bahan baku tidak ditemukan' });
  }

  const oldStock = Number(ing.stock || 0);
  const newStock = Number(actualStock);
  const diff = newStock - oldStock;
  ing.stock = newStock;

  const newMut = {
    id: `MUT-OPN-${Date.now()}`,
    date: new Date().toISOString(),
    type: 'Stok Opname',
    source: 'Penyesuaian Fisik',
    itemName: ing.name,
    qty: diff,
    unit: ing.unit,
    notes: `${notes || 'Penyesuaian Stok Opname'}. (Sistem: ${oldStock} -> Fisik: ${newStock}, Selisih: ${diff > 0 ? '+' : ''}${diff})`
  };

  db.mutations = db.mutations || [];
  db.mutations.unshift(newMut);
  saveDatabase(db);
  maybeAutoSync(db);

  res.json({ success: true, ingredient: ing, mutation: newMut });
});

// 8. Summary & Analytics
app.get('/api/summary', (req, res) => {
  const db = getDatabase();
  const { range } = req.query; // 'today', 'week', 'month', 'all'

  const now = new Date();
  let startDate = new Date(0);

  if (range === 'today') {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (range === 'week') {
    startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const sales = (db.sales || []).filter(s => new Date(s.date) >= startDate);
  const purchases = (db.purchases || []).filter(p => new Date(p.date) >= startDate);
  const mutations = (db.mutations || []).filter(m => new Date(m.date) >= startDate);

  const totalSalesRevenue = sales.reduce((acc, s) => acc + (Number(s.totalAmount) || 0), 0);
  const totalPurchaseExpenses = purchases.reduce((acc, p) => acc + (Number(p.totalAmount) || 0), 0);
  const grossProfit = totalSalesRevenue - totalPurchaseExpenses;
  const totalTransactions = sales.length;
  const avgTransactionValue = totalTransactions > 0 ? Math.round(totalSalesRevenue / totalTransactions) : 0;

  // Breakdown by product
  const productStats = {};
  sales.forEach(s => {
    (s.items || []).forEach(it => {
      const key = it.name;
      if (!productStats[key]) {
        productStats[key] = { name: key, qty: 0, revenue: 0 };
      }
      productStats[key].qty += Number(it.qty) || 0;
      productStats[key].revenue += Number(it.subtotal) || 0;
    });
  });

  const topSellingProducts = Object.values(productStats).sort((a, b) => b.qty - a.qty).slice(0, 10);

  // Breakdown by payment method
  const paymentMethods = {};
  sales.forEach(s => {
    const m = s.paymentMethod || 'Tunai';
    paymentMethods[m] = (paymentMethods[m] || 0) + (Number(s.totalAmount) || 0);
  });

  // Low stock alert count
  const lowStockCount = (db.ingredients || []).filter(i => Number(i.stock) <= Number(i.minStock)).length;

  res.json({
    range: range || 'all',
    totalSalesRevenue,
    totalPurchaseExpenses,
    grossProfit,
    totalTransactions,
    avgTransactionValue,
    topSellingProducts,
    paymentMethods,
    lowStockCount,
    salesCount: sales.length,
    purchaseCount: purchases.length,
    mutationCount: mutations.length
  });
});

// Serve frontend in production if dist exists
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.listen(PORT, () => {
  console.log(`Backend Server Kedai Amud Kumis berjalan di http://localhost:${PORT}`);
});
