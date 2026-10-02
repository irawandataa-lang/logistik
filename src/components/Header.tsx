import React, { useRef } from 'react';
import { 
  Package, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ClipboardCheck, 
  Download, 
  Upload, 
  RotateCcw, 
  FileSpreadsheet, 
  WifiOff, 
  Database
} from 'lucide-react';
import { warehouseStorage } from '../services/storage';
import { InventoryItem } from '../types/warehouse';
import { exportInventoryToExcel } from '../utils/excelParser';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenInModal: () => void;
  onOpenOutModal: () => void;
  onOpenOpnameModal: () => void;
  onOpenImportExcelModal: () => void;
  items: InventoryItem[];
  onDataReload: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenInModal,
  onOpenOutModal,
  onOpenOpnameModal,
  onOpenImportExcelModal,
  items,
  onDataReload,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportJson = () => {
    const jsonStr = warehouseStorage.exportBackupJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-wms-gudang-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (items.length === 0) return;
    exportInventoryToExcel(items, `inventaris-gudang-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportCsv = () => {
    if (items.length === 0) return;
    const headers = [
      'No', 'Item Code', 'Rak', 'Type', 'Model Unit', 'Part Number', 'Part Name',
      'Unit Code', 'Supplier', 'Brand', 'Awal Qty', 'UOM', 'IN Qty', 'OUT Qty',
      'Akhir Qty', 'MIN', 'MAX', 'REMARK', 'Movement', 'Price', 'Total Value'
    ];
    
    const rows = items.map(item => [
      item.no,
      `"${item.itemCode}"`,
      `"${item.rack}"`,
      `"${item.type}"`,
      `"${item.modelUnit}"`,
      `"${item.partNumber}"`,
      `"${item.partName.replace(/"/g, '""')}"`,
      `"${item.unitCode}"`,
      `"${item.supplier}"`,
      `"${item.brand}"`,
      item.initialQty,
      `"${item.uom}"`,
      item.inQty,
      item.outQty,
      item.currentQty,
      item.minStock,
      item.maxStock,
      `"${item.remark}"`,
      `"${item.movement}"`,
      item.price,
      item.totalValue
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `inventaris-gudang-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = warehouseStorage.importBackupJson(content);
      if (success) {
        alert('Data berhasil dipulihkan dari backup JSON!');
        onDataReload();
      } else {
        alert('Gagal memulihkan data. Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = async () => {
    if (window.confirm('Reset database ke data awal CSV? Semua perubahan transaksi manual akan dikembalikan ke data default.')) {
      await warehouseStorage.resetToSeed();
      onDataReload();
      alert('Data gudang berhasil dikembalikan ke dataset awal!');
    }
  };

  const criticalCount = items.filter(i => i.currentQty <= i.minStock && i.minStock > 0).length;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          
          {/* Logo & System Badge */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-inner">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  WMS Offline
                  <span className="text-xs font-medium px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <WifiOff className="w-3 h-3" /> Offline Ready
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Sistem Gudang & Logistik Spare Part Tambang / Armada
              </p>
            </div>
          </div>

          {/* Quick Transaction & Data Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenInModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition-colors active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Barang Masuk (IN)
            </button>
            <button
              onClick={onOpenOutModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white shadow transition-colors active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4" />
              Barang Keluar (OUT)
            </button>
            <button
              onClick={onOpenOpnameModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors active:scale-95"
            >
              <ClipboardCheck className="w-4 h-4" />
              Stock Opname
            </button>

            <div className="h-5 w-px bg-slate-700 mx-1 hidden sm:block"></div>

            {/* Offline Data Controls */}
            <button
              onClick={onOpenImportExcelModal}
              title="Import Data Suku Cadang dari File Excel (.xlsx / .xls / .csv)"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Excel</span>
            </button>
            <button
              onClick={handleExportExcel}
              title="Ekspor Seluruh Inventaris ke File Excel (.xlsx)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
            <button
              onClick={handleExportCsv}
              title="Ekspor Seluruh Inventaris ke CSV"
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <span className="text-[11px] font-mono">CSV</span>
            </button>
            <button
              onClick={handleExportJson}
              title="Backup Database ke File JSON"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Backup</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Pulihkan Database dari JSON"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Restore</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleImportJson} 
              accept=".json" 
              className="hidden" 
            />
            <button
              onClick={handleReset}
              title="Reset ke Data Awal CSV"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-300 border border-slate-700 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto border-t border-slate-800 pt-1 pb-2 scrollbar-none text-sm">
          {[
            { id: 'dashboard', label: 'Dashboard & KPI' },
            { id: 'inventory', label: `Katalog Stok (${items.length})` },
            { id: 'transactions', label: 'Riwayat Transaksi' },
            { id: 'rack-map', label: 'Peta Rak (Rack Map)' },
            { 
              id: 'reorder', 
              label: 'Daftar Reorder / PO',
              badge: criticalCount > 0 ? criticalCount : undefined 
            },
            { id: 'opname', label: 'Stock Opname' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md font-medium text-xs whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
              {tab.badge && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  activeTab === tab.id ? 'bg-slate-900 text-amber-300' : 'bg-rose-500 text-white'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

      </div>
    </header>
  );
};
