import React from 'react';
import { 
  DollarSign, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Layers, 
  Archive, 
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Clock
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { formatRupiah } from '../utils/csvParser';

interface DashboardViewProps {
  items: InventoryItem[];
  onSelectTabWithFilter: (tab: string, filterType?: string, filterValue?: string) => void;
  onSelectItem: (item: InventoryItem) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  items,
  onSelectTabWithFilter,
  onSelectItem,
}) => {
  // Calculations
  const totalValue = items.reduce((acc, curr) => acc + (curr.totalValue > 0 ? curr.totalValue : 0), 0);
  const totalQty = items.reduce((acc, curr) => acc + (curr.currentQty > 0 ? curr.currentQty : 0), 0);
  const outOfStockItems = items.filter(i => i.currentQty <= 0);
  const reorderItems = items.filter(i => (i.currentQty <= i.minStock && i.minStock > 0) || i.remark === 'ORDER');
  const overstockItems = items.filter(i => (i.currentQty > i.maxStock && i.maxStock > 0) || i.remark === 'OVER');
  
  const fastMoving = items.filter(i => i.movement === 'Fast Moving');
  const slowMoving = items.filter(i => i.movement === 'Slow Moving');
  const deadMoving = items.filter(i => i.movement === 'Dead Moving');

  const cnuCount = items.filter(i => i.type === 'CNU').length;
  const sptCount = items.filter(i => i.type === 'SPT').length;
  const libCount = items.filter(i => i.type === 'LIB' || i.type === 'PS').length;

  // Top 6 Highest Value Items
  const topValueItems = [...items]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 6);

  // Top 6 Urgent Low Stock Items
  const topCriticalItems = [...reorderItems]
    .sort((a, b) => (a.currentQty - a.minStock) - (b.currentQty - b.minStock))
    .slice(0, 6);

  // Group by model unit / Fleet breakdown
  const fleetMap: Record<string, number> = {};
  items.forEach(item => {
    let key = item.modelUnit?.trim() || 'Lain-lain';
    if (key.toLowerCase().includes('hino')) key = 'Hino (260/500/Dutro)';
    else if (key.toLowerCase().includes('scania')) key = 'Scania (360/410 XT)';
    else if (key.toLowerCase().includes('triton')) key = 'Mitsubishi Triton';
    else if (key.toLowerCase().includes('komatsu') || key.toLowerCase().includes('pc ') || key.toLowerCase().includes('d85') || key.toLowerCase().includes('gd')) key = 'Komatsu (PC/Dozer/Grader)';
    else if (key.toLowerCase().includes('xcmg')) key = 'XCMG (Hanvan/DH400)';
    else if (key.toLowerCase().includes('hitachi')) key = 'Hitachi (ZX470)';
    else if (key.toLowerCase().includes('hilux') || key.toLowerCase().includes('toyota')) key = 'Toyota Hilux';
    fleetMap[key] = (fleetMap[key] || 0) + 1;
  });

  const sortedFleet = Object.entries(fleetMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 7);

  return (
    <div className="space-y-6">
      
      {/* Top Banner & KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Asset Value */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Nilai Inventaris</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-white tracking-tight">
            {formatRupiah(totalValue)}
          </p>
          <div className="mt-2 flex items-center text-xs text-slate-400">
            <span className="text-emerald-400 font-medium mr-1.5 flex items-center">
              <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> Aktif
            </span>
            <span>Total {totalQty.toLocaleString('id-ID')} unit fisik stok</span>
          </div>
        </div>

        {/* Total SKU */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Katalog SKU</span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-white tracking-tight">
            {items.length} <span className="text-sm font-normal text-slate-400">Item</span>
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-sky-300">SPT: {sptCount}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300">CNU: {cnuCount}</span>
            <span className="px-1.5 py-0.5 rounded bg-slate-800 text-purple-300">LIB: {libCount}</span>
          </div>
        </div>

        {/* Kritis & Butuh Order */}
        <div 
          onClick={() => onSelectTabWithFilter('reorder')}
          className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm hover:border-amber-500/50 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Butuh Order / Kritis
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {reorderItems.length} <span className="text-sm font-normal text-slate-400">Item</span>
          </p>
          <p className="mt-2 text-xs text-slate-400">
            <span className="text-rose-400 font-semibold">{outOfStockItems.length} habis (0 qty)</span>, sisanya di bawah MIN stock
          </p>
        </div>

        {/* Movement Overview */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Perputaran Barang</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
            <div 
              onClick={() => onSelectTabWithFilter('inventory', 'movement', 'Fast Moving')}
              className="p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 cursor-pointer hover:bg-emerald-500/20"
            >
              <span className="text-xs text-emerald-400 block font-bold">{fastMoving.length}</span>
              <span className="text-[10px] text-slate-400">Fast</span>
            </div>
            <div 
              onClick={() => onSelectTabWithFilter('inventory', 'movement', 'Slow Moving')}
              className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20"
            >
              <span className="text-xs text-amber-400 block font-bold">{slowMoving.length}</span>
              <span className="text-[10px] text-slate-400">Slow</span>
            </div>
            <div 
              onClick={() => onSelectTabWithFilter('inventory', 'movement', 'Dead Moving')}
              className="p-1.5 rounded bg-rose-500/10 border border-rose-500/20 cursor-pointer hover:bg-rose-500/20"
            >
              <span className="text-xs text-rose-400 block font-bold">{deadMoving.length}</span>
              <span className="text-[10px] text-slate-400">Dead</span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 truncate">
            {overstockItems.length} item berstatus OVER stock
          </p>
        </div>

      </div>

      {/* Two Column Detailed Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Item Kritis Perlu Segera Dipesan */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Peringatan Stok Rendah & Habis
              </h2>
              <p className="text-xs text-slate-400">Item yang perlu segera dibuatkan Purchase Order (PO)</p>
            </div>
            <button 
              onClick={() => onSelectTabWithFilter('reorder')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              Lihat Semua ({reorderItems.length}) <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {topCriticalItems.map(item => (
              <div 
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-sky-400">{item.itemCode}</span>
                    <span className="text-xs px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Rak: {item.rack}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate mt-0.5">{item.partName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    P/N: {item.partNumber} • Unit: {item.modelUnit}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`text-sm font-bold ${item.currentQty <= 0 ? 'text-rose-400' : 'text-amber-400'}`}>
                      {item.currentQty} {item.uom}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 block">
                    Min: {item.minStock} | Max: {item.maxStock}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-semibold inline-block mt-0.5">
                    {item.currentQty <= 0 ? 'HABIS' : 'ORDER'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 6 Nilai Aset Tertinggi */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Nilai Aset Stok Tertinggi
              </h2>
              <p className="text-xs text-slate-400">Komponen bernilai tinggi yang perlu pengawasan ketat</p>
            </div>
            <button 
              onClick={() => onSelectTabWithFilter('inventory')}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 flex items-center gap-1"
            >
              Lihat Katalog <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-800">
            {topValueItems.map(item => (
              <div 
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="py-3 flex items-center justify-between hover:bg-slate-800/50 rounded-lg px-2 -mx-2 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-sky-400">{item.itemCode}</span>
                    <span className="text-xs text-slate-400">Qty: <strong className="text-white">{item.currentQty} {item.uom}</strong></span>
                  </div>
                  <p className="text-sm font-medium text-slate-200 truncate mt-0.5">{item.partName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {item.modelUnit} • Brand: {item.brand}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-sm font-bold text-emerald-400 block">
                    {formatRupiah(item.totalValue)}
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    @{formatRupiah(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Fleet Distribution & Quick Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Distribusi Unit Armada */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
          <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-sky-400" />
            Distribusi Populasi Unit & Suku Cadang
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sortedFleet.map(([fleet, count]) => {
              const percent = Math.round((count / items.length) * 100);
              return (
                <div 
                  key={fleet}
                  onClick={() => onSelectTabWithFilter('inventory', 'unit', fleet)}
                  className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 hover:border-sky-500/50 cursor-pointer transition-colors"
                >
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-slate-200">{fleet}</span>
                    <span className="font-mono text-slate-400">{count} SKU ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gudang Offline Stats Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
              <Archive className="w-4 h-4 text-amber-400" />
              Status Sistem Offline
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Aplikasi ini beroperasi 100% lokal di browser Anda tanpa ketergantungan koneksi server. Data tersimpan aman di LocalStorage dan dapat dibackup/export kapan saja.
            </p>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Penyimpanan:</span>
                <span className="text-emerald-400 font-medium">LocalStorage Aktif</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Total Rak / Lokasi:</span>
                <span className="text-white font-mono">{new Set(items.map(i => i.rack)).size} Lokasi</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">Waktu Terakhir Muat:</span>
                <span className="text-slate-300 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Realtime
                </span>
              </div>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800">
            <button
              onClick={() => onSelectTabWithFilter('rack-map')}
              className="w-full py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              Jelajahi Peta Rak Gudang <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
