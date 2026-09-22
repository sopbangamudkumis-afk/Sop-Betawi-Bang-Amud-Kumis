import { google } from 'googleapis';

const REQUIRED_SHEETS = [
  {
    title: 'MASTER_PRODUK',
    headers: ['ID Produk', 'Nama Produk', 'Kategori', 'Tipe', 'Harga Jual', 'Satuan', 'Status Aktif', 'Diperbarui']
  },
  {
    title: 'MASTER_BAHAN_BAKU',
    headers: ['ID Bahan', 'Nama Bahan', 'Kategori', 'Satuan', 'Stok Saat Ini', 'Batas Minimum', 'Diperbarui']
  },
  {
    title: 'TRX_BELANJA',
    headers: ['No Faktur', 'Tanggal', 'Supplier / Pasar', 'Petugas / Pembeli', 'Total Belanja', 'Rincian Item', 'Catatan']
  },
  {
    title: 'TRX_PENJUALAN',
    headers: ['No Nota', 'Waktu Transaksi', 'No Meja', 'Tipe Pesanan', 'Kasir', 'Total Bayar', 'Metode Bayar', 'Status', 'Catatan']
  },
  {
    title: 'TRX_PENJUALAN_DETAIL',
    headers: ['No Nota', 'ID Produk', 'Nama Item', 'Qty / Jumlah Potong', 'Harga Satuan', 'Subtotal', 'Catatan']
  },
  {
    title: 'MUTASI_INVENTORY',
    headers: ['ID Mutasi', 'Tanggal / Waktu', 'Tipe Mutasi', 'Sumber / Ref', 'Nama Barang', 'Qty', 'Satuan', 'Keterangan']
  }
];

export function getGoogleSheetsClient(clientEmail, privateKey) {
  if (!clientEmail || !privateKey) {
    throw new Error('Client Email dan Private Key Google Service Account diperlukan.');
  }

  // Format private key properly if line breaks are escaped
  const formattedKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: formattedKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

export async function testConnection(spreadsheetId, clientEmail, privateKey) {
  const sheets = getGoogleSheetsClient(clientEmail, privateKey);
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
  });

  return {
    success: true,
    title: res.data.properties.title,
    sheets: res.data.sheets.map(s => s.properties.title),
  };
}

export async function initSpreadsheetStructure(spreadsheetId, clientEmail, privateKey) {
  const sheets = getGoogleSheetsClient(clientEmail, privateKey);
  const meta = await sheets.spreadsheets.get({ spreadsheetId });
  const existingSheetTitles = meta.data.sheets.map(s => s.properties.title);

  const requests = [];

  // Add missing sheets
  for (const sheet of REQUIRED_SHEETS) {
    if (!existingSheetTitles.includes(sheet.title)) {
      requests.push({
        addSheet: {
          properties: {
            title: sheet.title,
            gridProperties: { rowCount: 1000, columnCount: 20 },
          }
        }
      });
    }
  }

  if (requests.length > 0) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  // Ensure headers exist for all required sheets
  for (const sheet of REQUIRED_SHEETS) {
    const range = `${sheet.title}!A1:${String.fromCharCode(64 + sheet.headers.length)}1`;
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range,
      valueInputOption: 'RAW',
      requestBody: {
        values: [sheet.headers]
      }
    });
  }

  return { success: true, message: 'Struktur Google Sheets berhasil disiapkan.' };
}

export async function syncAllToGoogleSheets(spreadsheetId, clientEmail, privateKey, db) {
  const sheets = getGoogleSheetsClient(clientEmail, privateKey);

  // 1. Inisialisasi struktur sheet jika belum ada
  await initSpreadsheetStructure(spreadsheetId, clientEmail, privateKey);

  // 2. Format & Push Master Produk
  const prodRows = db.products.map(p => [
    p.id,
    p.name,
    p.category,
    p.type,
    p.price,
    p.unit || 'porsi',
    p.active ? 'AKTIF' : 'NONAKTIF',
    new Date().toISOString()
  ]);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'MASTER_PRODUK!A2:H'
  });
  if (prodRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MASTER_PRODUK!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: prodRows }
    });
  }

  // 3. Format & Push Master Bahan Baku
  const ingRows = db.ingredients.map(i => [
    i.id,
    i.name,
    i.category,
    i.unit,
    i.stock,
    i.minStock,
    new Date().toISOString()
  ]);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'MASTER_BAHAN_BAKU!A2:G'
  });
  if (ingRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MASTER_BAHAN_BAKU!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: ingRows }
    });
  }

  // 4. Format & Push Belanja Bahan
  const purchaseRows = db.purchases.map(p => [
    p.id,
    p.date,
    p.supplier,
    p.buyer || 'Bang Amud',
    p.totalAmount,
    p.items ? p.items.map(it => `${it.name} (${it.qty} ${it.unit} @ Rp${it.unitPrice.toLocaleString('id-ID')})`).join('; ') : '',
    p.notes || ''
  ]);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'TRX_BELANJA!A2:G'
  });
  if (purchaseRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'TRX_BELANJA!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: purchaseRows }
    });
  }

  // 5. Format & Push Penjualan (Header & Details)
  const salesRows = db.sales.map(s => [
    s.id,
    s.date,
    s.tableNo || '-',
    s.orderType || 'Dine-in',
    s.cashier || 'Kasir',
    s.totalAmount,
    s.paymentMethod || 'Tunai',
    s.status || 'Lunas',
    s.notes || ''
  ]);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'TRX_PENJUALAN!A2:I'
  });
  if (salesRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'TRX_PENJUALAN!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: salesRows }
    });
  }

  // Sales Details
  const salesDetailRows = [];
  db.sales.forEach(s => {
    (s.items || []).forEach(it => {
      salesDetailRows.push([
        s.id,
        it.productId || '-',
        it.name,
        it.qty,
        it.price,
        it.subtotal,
        it.notes || ''
      ]);
    });
  });
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'TRX_PENJUALAN_DETAIL!A2:G'
  });
  if (salesDetailRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'TRX_PENJUALAN_DETAIL!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: salesDetailRows }
    });
  }

  // 6. Format & Push Mutasi Inventory
  const mutRows = db.mutations.map(m => [
    m.id,
    m.date,
    m.type,
    m.source || '-',
    m.itemName,
    m.qty,
    m.unit,
    m.notes || ''
  ]);
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: 'MUTASI_INVENTORY!A2:H'
  });
  if (mutRows.length > 0) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: 'MUTASI_INVENTORY!A2',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: mutRows }
    });
  }

  return { success: true, timestamp: new Date().toISOString() };
}
