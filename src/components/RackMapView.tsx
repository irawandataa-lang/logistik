import React, { useState, useMemo } from 'react';
import { 
  MapPin, 
  Layers, 
  Search, 
  Box, 
  Eye, 
  ArrowDownLeft, 
  ArrowUpRight, 
  AlertTriangle,
  ChevronRight,
  FolderOpen,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { formatRupiah } from '../utils/csvParser';
import { normalizeRackCode } from '../utils/rackUtils';

interface RackMapViewProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onQuickIn: (item: InventoryItem) => void;
  onQuickOut: (item: InventoryItem) => void;
}

interface RackGroupInfo {
  groupCode: string; // e.g. "101", "114", "CONT-GET"
  groupLabel: string; // e.g. "Rak 101", "Rak 114"
  bins: Map<string, InventoryItem[]>;
  totalItems: number;
  totalQty: number;
  hasCritical: boolean;
  sampleBins: string[];
}

export const RackMapView: React.FC<RackMapViewProps> = ({
  items,
  onSelectItem,
  onQuickIn,
  onQuickOut,
}) => {
  const normalizeBin = (rawRack: string) => normalizeRackCode(rawRack);

  // Group items by 3 digits / main rack
  const rackGroups = useMemo(() => {
    const map = new Map<string, RackGroupInfo>();

    items.forEach(item => {
      const { groupCode, groupLabel, binCode } = normalizeBin(item.rack);
      
      let group = map.get(groupCode);
      if (!group) {
        group = {
          groupCode,
          groupLabel,
          bins: new Map<string, InventoryItem[]>(),
          totalItems: 0,
          totalQty: 0,
          hasCritical: false,
          sampleBins: [],
        };
        map.set(groupCode, group);
      }

      const binItems = group.bins.get(binCode) || [];
      binItems.push(item);
      group.bins.set(binCode, binItems);

      group.totalItems += 1;
      group.totalQty += item.currentQty;
      if ((item.currentQty <= item.minStock && item.minStock > 0) || item.remark === 'ORDER') {
        group.hasCritical = true;
      }
    });

    // Sort bins inside each group and populate sample bins
    map.forEach(group => {
      const sortedBins = Array.from(group.bins.keys()).sort();
      group.sampleBins = sortedBins;
    });

    // Return as array sorted by numeric group first, then containers
    return Array.from(map.values()).sort((a, b) => {
      const aIsNum = /^\d+$/.test(a.groupCode);
      const bIsNum = /^\d+$/.test(b.groupCode);
      if (aIsNum && bIsNum) {
        return parseInt(a.groupCode, 10) - parseInt(b.groupCode, 10);
      }
      if (aIsNum) return -1;
      if (bIsNum) return 1;
      return a.groupLabel.localeCompare(b.groupLabel);
    });
  }, [items]);

  // Selected State
  const [selectedGroupCode, setSelectedGroupCode] = useState<string>('101');
  const [selectedBin, setSelectedBin] = useState<string>('ALL'); // 'ALL' or specific bin like '101A01'
  const [searchQuery, setSearchQuery] = useState('');

  // Active Group
  const activeGroup = useMemo(() => {
    return rackGroups.find(g => g.groupCode === selectedGroupCode) || rackGroups[0];
  }, [rackGroups, selectedGroupCode]);

  // Items for the selected bin or whole group
  const activeItems = useMemo(() => {
    if (!activeGroup) return [];

    let list: InventoryItem[] = [];
    if (selectedBin === 'ALL') {
      activeGroup.bins.forEach(itemsInBin => {
        list.push(...itemsInBin);
      });
    } else {
      list = activeGroup.bins.get(selectedBin) || [];
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(i => 
        i.itemCode.toLowerCase().includes(q) ||
        i.partName.toLowerCase().includes(q) ||
        i.partNumber.toLowerCase().includes(q) ||
        i.rack.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => a.rack.localeCompare(b.rack, undefined, { numeric: true }));
  }, [activeGroup, selectedBin, searchQuery]);

  return (
    <div className="space-y-4">
      
      {/* Header Info */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Peta Rak Gudang (Format 3 Angka Awal)
            </h2>
            <p className="text-xs text-slate-400">
              Pengelompokan denah gudang berdasarkan 3 angka awal (misal: <strong>Rak 101</strong> berisi <code className="text-amber-300 font-mono">101A01, 101B02</code> / <strong>Rak 114</strong> berisi <code className="text-amber-300 font-mono">114A01, 114G07</code>)
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bin, kode part, atau barang..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Row 1: Main 3-Digit Racks Grid (Rak 101, Rak 102, ..., Rak 114) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-sky-400" />
            Pilih Rak Utama (Berdasarkan 3 Angka Awal)
          </span>
          <span className="text-[11px] text-slate-400">
            Total {rackGroups.length} Grup Rak / Area
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {rackGroups.map(group => {
            const isSelected = activeGroup?.groupCode === group.groupCode;
            const isNumeric = /^\d+$/.test(group.groupCode);

            return (
              <button
                key={group.groupCode}
                onClick={() => {
                  setSelectedGroupCode(group.groupCode);
                  setSelectedBin('ALL');
                }}
                className={`p-2.5 rounded-lg border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md ring-2 ring-amber-400/50 scale-[1.02]'
                    : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className={`font-mono text-xs font-extrabold ${isSelected ? 'text-slate-950' : 'text-amber-400'}`}>
                    {group.groupLabel}
                  </span>
                  {group.hasCritical && (
                    <span 
                      className={`w-2 h-2 rounded-full ${isSelected ? 'bg-slate-900' : 'bg-rose-500'}`}
                      title="Ada suku cadang butuh order!"
                    />
                  )}
                </div>

                <div className="mt-2 text-[10px]">
                  <span className={`${isSelected ? 'text-slate-900' : 'text-slate-400'} block`}>
                    {group.bins.size} Bin Lokasi
                  </span>
                  <span className={`font-mono font-medium ${isSelected ? 'text-slate-950 font-bold' : 'text-slate-300'}`}>
                    {group.totalItems} SKU
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Selected Main Rak Breakdown (Sub-Bins & Items) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Sub-Bins inside selected Rak (e.g. 101A01, 101A02, 101B01 or 114A01, 114G07) */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Daftar Bin di Dalam</span>
              <h3 className="text-sm font-bold text-amber-400 font-mono flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4" /> {activeGroup?.groupLabel}
              </h3>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              {activeGroup?.bins.size} Bin
            </span>
          </div>

          {/* "View All" Button */}
          <button
            onClick={() => setSelectedBin('ALL')}
            className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors border ${
              selectedBin === 'ALL'
                ? 'bg-sky-600 border-sky-500 text-white shadow'
                : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-sky-400" />
              Tampilkan Semua Isi {activeGroup?.groupLabel}
            </span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded bg-slate-900 text-sky-300">
              {activeGroup?.totalItems} SKU
            </span>
          </button>

          {/* Sub-Bins Grid */}
          <div className="space-y-1.5 max-h-[460px] overflow-y-auto pr-1">
            {activeGroup?.sampleBins.map(binCode => {
              const binItems = activeGroup.bins.get(binCode) || [];
              const isBinSelected = selectedBin === binCode;
              const hasCrit = binItems.some(i => (i.currentQty <= i.minStock && i.minStock > 0) || i.remark === 'ORDER');
              const totalBinQty = binItems.reduce((acc, curr) => acc + curr.currentQty, 0);

              return (
                <div
                  key={binCode}
                  onClick={() => setSelectedBin(binCode)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${
                    isBinSelected
                      ? 'bg-amber-500/15 border-amber-500 ring-1 ring-amber-500 text-white'
                      : 'bg-slate-950/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-300">
                      {binCode}
                    </span>
                    {hasCrit && (
                      <span className="text-amber-400" title="Item butuh order!">
                        <AlertTriangle className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="text-slate-400">{binItems.length} SKU</span>
                    <span className="font-mono font-bold text-slate-200">
                      {totalBinQty} Pcs
                    </span>
                    <ChevronRight className={`w-3.5 h-3.5 ${isBinSelected ? 'text-amber-400' : 'text-slate-600'}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right 2 Cols: Items Table in Selected Bin / Rak */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2 mb-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                Suku Cadang & Barang Tersimpan
              </span>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{activeGroup?.groupLabel}</span>
                {selectedBin !== 'ALL' && (
                  <span className="font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded text-xs">
                    Bin {selectedBin}
                  </span>
                )}
              </h3>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span>Menampilkan: <strong className="text-white">{activeItems.length}</strong> SKU</span>
              <span className="text-slate-600">•</span>
              <span>Total Fisik: <strong className="text-emerald-400 font-mono">{activeItems.reduce((acc, curr) => acc + curr.currentQty, 0)} Pcs</strong></span>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto flex-1 max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="py-2.5 px-3">Bin Rak</th>
                  <th className="py-2.5 px-3">Kode & Nama Suku Cadang</th>
                  <th className="py-2.5 px-3">Part Number</th>
                  <th className="py-2.5 px-3">Unit Model</th>
                  <th className="py-2.5 px-3 text-center">Stok</th>
                  <th className="py-2.5 px-3 text-center">Safety Min/Max</th>
                  <th className="py-2.5 px-3 text-right">Nilai Aset</th>
                  <th className="py-2.5 px-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {activeItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      Tidak ada suku cadang yang ditemukan di lokasi ini.
                    </td>
                  </tr>
                ) : (
                  activeItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Bin Code */}
                      <td className="py-2.5 px-3">
                        <span className="font-mono text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded">
                          {item.rack}
                        </span>
                      </td>

                      {/* Code & Name */}
                      <td className="py-2.5 px-3 max-w-[200px]">
                        <div className="font-mono font-bold text-sky-400 text-xs">
                          {item.itemCode}
                        </div>
                        <div 
                          onClick={() => onSelectItem(item)}
                          className="font-medium text-slate-200 hover:text-amber-400 cursor-pointer truncate"
                          title={item.partName}
                        >
                          {item.partName}
                        </div>
                      </td>

                      {/* Part Number */}
                      <td className="py-2.5 px-3 font-mono text-slate-300 text-xs truncate max-w-[120px]">
                        {item.partNumber || '-'}
                      </td>

                      {/* Model Unit */}
                      <td className="py-2.5 px-3 text-slate-400 text-xs truncate max-w-[120px]">
                        {item.modelUnit}
                      </td>

                      {/* Current Stock */}
                      <td className="py-2.5 px-3 text-center">
                        <span className={`font-mono font-extrabold text-sm ${
                          item.currentQty <= 0
                            ? 'text-rose-400'
                            : item.minStock > 0 && item.currentQty <= item.minStock
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}>
                          {item.currentQty} <span className="text-[10px] font-normal text-slate-400">{item.uom}</span>
                        </span>
                      </td>

                      {/* Safety Min / Max */}
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400 text-[11px]">
                        {item.minStock} / {item.maxStock}
                      </td>

                      {/* Total Value */}
                      <td className="py-2.5 px-3 text-right font-mono text-slate-200">
                        {item.totalValue > 0 ? formatRupiah(item.totalValue) : '-'}
                      </td>

                      {/* Action buttons */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onQuickIn(item)}
                            title="Barang Masuk (+IN)"
                            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onQuickOut(item)}
                            title="Barang Keluar (-OUT)"
                            className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectItem(item)}
                            title="Lihat Detail"
                            className="p-1 rounded bg-slate-800 text-sky-400 hover:bg-slate-700"
                          >
                            <Eye className="w-3.5 h-3.5" />
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

      </div>

    </div>
  );
};
