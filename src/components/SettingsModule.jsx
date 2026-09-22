import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Database, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Upload, 
  Key, 
  FileSpreadsheet, 
  HelpCircle, 
  Store, 
  Save,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { 
  fetchGoogleConfig, 
  saveGoogleConfig, 
  testGoogleConnection, 
  triggerSync, 
  uploadServiceAccountKey 
} from '../api';

export default function SettingsModule({ onSyncComplete, storeInfo, onUpdateStoreInfo }) {
  const [config, setConfig] = useState({
    spreadsheetId: '',
    clientEmail: '',
    privateKey: '',
    autoSync: false,
    hasPrivateKey: false,
    lastSyncTime: null
  });

  const [storeForm, setStoreForm] = useState(storeInfo || {
    name: 'KEDAI "AMUD KUMIS"',
    subtitle: 'HIDANGAN KHAS JAKARTA',
    description: 'Sop Kaki Kambing & Sate Ayam | Sop Daging Sapi & Sate Kambing',
    address: 'Jl. Limo Raya (Dekat Kampus UPN Limo)',
    phone: '0812-3456-7890'
  });

  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [syncStatus, setSyncStatus] = useState(null);
  const [fileUploading, setFileUploading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      const data = await fetchGoogleConfig();
      setConfig(data);
    } catch (err) {
      console.error('Failed to load Google config:', err);
    }
  };

  // Save Credentials
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await saveGoogleConfig(config);
      alert('Konfigurasi Google Sheets berhasil disimpan!');
      loadConfig();
    } catch (err) {
      alert('Gagal menyimpan konfigurasi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Test Connection
  const handleTestConnection = async () => {
    setLoading(true);
    setTestResult(null);
    try {
      const res = await testGoogleConnection({
        spreadsheetId: config.spreadsheetId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey
      });
      setTestResult({
        success: true,
        message: `Berhasil terhubung ke Spreadsheet "${res.title}"!`,
        sheets: res.sheets
      });
    } catch (err) {
      setTestResult({
        success: false,
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  // Trigger Manual Sync
  const handleSyncNow = async () => {
    setLoading(true);
    setSyncStatus(null);
    try {
      const res = await triggerSync();
      setSyncStatus({ success: true, message: res.message, time: res.timestamp });
      if (onSyncComplete) onSyncComplete();
      loadConfig();
    } catch (err) {
      setSyncStatus({ success: false, message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Upload JSON file
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileUploading(true);
    try {
      const res = await uploadServiceAccountKey(file);
      alert(res.message);
      loadConfig();
    } catch (err) {
      alert('Gagal mengunggah file JSON: ' + err.message);
    } finally {
      setFileUploading(false);
    }
  };

  // Save Store Info
  const handleSaveStore = async (e) => {
    e.preventDefault();
    try {
      await onUpdateStoreInfo(storeForm);
      alert('Informasi Kedai berhasil diperbarui!');
    } catch (err) {
      alert('Gagal menyimpan profil kedai: ' + err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-4 px-3 sm:px-6 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-500/10 text-brand-400 rounded-xl border border-brand-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Pengaturan & Koneksi Google Sheets
              <span className="text-xs font-normal px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Database Cloud
              </span>
            </h2>
            <p className="text-xs text-stone-400">
              Hubungkan database aplikasi ke Google Spreadsheet Anda via Service Account.
            </p>
          </div>
        </div>

        {/* Sync Action Button */}
        <button
          onClick={handleSyncNow}
          disabled={loading || !config.spreadsheetId || !config.clientEmail}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold transition-all shadow-glow disabled:opacity-40 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sinkronkan Database ke Google Sheets
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Google Sheets Settings (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                Konfigurasi Google Service Account
              </h3>
              <span className="text-xs text-stone-400">Google Sheets API v4</span>
            </div>

            {/* Upload JSON file shortcut */}
            <div className="bg-stone-900/80 p-4 rounded-2xl border border-dashed border-stone-700 space-y-2">
              <label className="block text-xs font-bold text-stone-200">
                Opsi 1: Upload File Kunci Service Account (.json)
              </label>
              <p className="text-[11px] text-stone-400">
                Jika Anda mendownload JSON key dari Google Cloud Console, cukup upload di sini untuk mengisi data otomatis.
              </p>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                disabled={fileUploading}
                className="text-xs text-stone-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500 file:cursor-pointer"
              />
            </div>

            {/* Manual Form */}
            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Google Spreadsheet ID:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  value={config.spreadsheetId}
                  onChange={(e) => setConfig({ ...config, spreadsheetId: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
                <span className="text-[10px] text-stone-500 mt-1 block">
                  Bisa diambil dari URL Google Sheets: https://docs.google.com/spreadsheets/d/<strong>[SPREADSHEET_ID]</strong>/edit
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1">
                  Client Email (Service Account):
                </label>
                <input
                  type="email"
                  placeholder="Contoh: sop-betawi-sync@project-id.iam.gserviceaccount.com"
                  value={config.clientEmail}
                  onChange={(e) => setConfig({ ...config, clientEmail: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-300 uppercase mb-1 flex items-center justify-between">
                  <span>Private Key (Service Account):</span>
                  {config.hasPrivateKey && (
                    <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Kunci Tersimpan
                    </span>
                  )}
                </label>
                <textarea
                  rows="3"
                  placeholder="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----"
                  value={config.privateKey}
                  onChange={(e) => setConfig({ ...config, privateKey: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-3 text-xs text-white font-mono outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="autoSyncCheck"
                  checked={config.autoSync}
                  onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                  className="rounded text-brand-600 focus:ring-brand-500"
                />
                <label htmlFor="autoSyncCheck" className="text-xs text-stone-300 font-semibold cursor-pointer">
                  Otomatis Sinkronisasi ke Google Sheets setiap ada transaksi baru
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={loading || !config.spreadsheetId || !config.clientEmail}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition-all disabled:opacity-40"
                >
                  {loading ? 'Menguji...' : 'Test Koneksi'}
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-all shadow-glow"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            </form>

            {/* Test Result Feedback */}
            {testResult && (
              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                testResult.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  {testResult.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {testResult.message}
                </div>
                {testResult.sheets && (
                  <div className="text-[11px] text-stone-300">
                    Sheet yang terdeteksi: <strong>{testResult.sheets.join(', ')}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Sync Feedback */}
            {syncStatus && (
              <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                syncStatus.success 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}>
                <div className="flex items-center gap-2 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  {syncStatus.message}
                </div>
                <div className="text-[11px] text-stone-400">
                  Waktu: {new Date(syncStatus.time).toLocaleString('id-ID')}
                </div>
              </div>
            )}

          </div>

          {/* Profil Usaha Card */}
          <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
            <div className="border-b border-stone-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Store className="w-4 h-4 text-brand-400" />
                Informasi & Header Kedai
              </h3>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-400 uppercase mb-1">Nama Usaha:</label>
                  <input
                    type="text"
                    value={storeForm.name}
                    onChange={(e) => setStoreForm({ ...storeForm, name: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-400 uppercase mb-1">Slogan / Tagline:</label>
                  <input
                    type="text"
                    value={storeForm.subtitle}
                    onChange={(e) => setStoreForm({ ...storeForm, subtitle: e.target.value })}
                    className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-400 uppercase mb-1">Alamat Gerai:</label>
                <input
                  type="text"
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl px-3 py-2 text-white outline-none"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold transition-all shadow-glow"
                >
                  Simpan Info Kedai
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: Step-by-Step Guide (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-[#191715] rounded-3xl border border-stone-800 p-5 sm:p-7 shadow-xl space-y-4">
            <div className="border-b border-stone-800 pb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-400" />
              <div>
                <h3 className="text-base font-bold text-white">Panduan Setup Google Service Account</h3>
                <p className="text-xs text-stone-400">Langkah mudah menghubungkan Google Spreadsheet</p>
              </div>
            </div>

            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              
              {/* Step 1 */}
              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-brand-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[11px]">1</span>
                  Buka Google Cloud Console & Buat Project
                </div>
                <p className="text-stone-400 text-[11px]">
                  Buka console.cloud.google.com, buat project baru (misal: "Sop Betawi Amud Kumis").
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-brand-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[11px]">2</span>
                  Aktifkan "Google Sheets API"
                </div>
                <p className="text-stone-400 text-[11px]">
                  Di menu <strong>APIs & Services &gt; Library</strong>, cari dan aktifkan <strong>Google Sheets API</strong>.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-brand-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 flex items-center justify-center text-[11px]">3</span>
                  Buat Service Account & Download Key
                </div>
                <p className="text-stone-400 text-[11px]">
                  Masuk ke <strong>IAM & Admin &gt; Service Accounts</strong>, klik <em>Create Service Account</em>. Buat Keys bertipe <strong>JSON</strong> dan unduh ke komputer Anda.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-betawi-gold flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-betawi-gold/20 text-betawi-gold flex items-center justify-center text-[11px]">4</span>
                  Share Google Sheet ke Email Service Account
                </div>
                <p className="text-stone-300 text-[11px]">
                  Buka Google Spreadsheet baru di browser Anda, klik tombol <strong>Share / Bagikan</strong>, lalu masukkan <strong>Client Email</strong> Service Account dan pilih hak akses sebagai <strong>Editor</strong>.
                </p>
              </div>

              {/* Step 5 */}
              <div className="bg-stone-900/80 p-3.5 rounded-2xl border border-stone-800 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[11px]">5</span>
                  Salin Spreadsheet ID & Test Koneksi
                </div>
                <p className="text-stone-400 text-[11px]">
                  Salin ID Spreadsheet dari URL browser ke kolom di samping, lalu klik <strong>Test Koneksi</strong> & <strong>Sinkronkan</strong>.
                </p>
              </div>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
