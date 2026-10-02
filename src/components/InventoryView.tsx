import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  ArrowUpDown, 
  Plus, 
  Eye, 
  ArrowDownLeft, 
  ArrowUpRight, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  ListFilter, 
  Scroll, 
  Trash2, 
  Upload, 
  CheckSquare, 
  Square, 
  AlertTriangle,
  Layers
} from 'lucide-react';
import { InventoryItem, ItemType, MovementStatus, StockRemark } from '../types/warehouse';
import { formatRupiah } from '../utils/csvParser';
import { useVirtualScroll } from '../hooks/useVirtualScroll';
import { normalizeRackCode, compareRacks } from '../utils/rackUtils';

interface InventoryViewProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onQuickIn: (item: InventoryItem) => void;
  onQuickOut: (item: InventoryItem) => void;
  onAddNewItem: () => void;
  onDeleteItem: (id: string) => void;
  onBatchDelete?: (ids: string[]) => void;
  onOpenImportExcel?: () => void;
  initialFilter?: { type?: string; value?: string };
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  items,
  onSelectItem,
  onQuickIn,
  onQuickOut,
  onAddNewItem,
  onDeleteItem,
  onBatchDelete,
  onOpenImportExcel,
  initialFilter,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>(initialFilter?.type === 'type' ? initialFilter.value || 'ALL' : 'ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>(initialFilter?.type === 'status' ? initialFilter.value || 'ALL' : 'ALL');
  const [selectedMovement, setSelectedMovement] = useState<string>(initialFilter?.type === 'movement' ? initialFilter.value || 'ALL' : 'ALL');
  
  // 3-digit rack group filter state
  const [selectedRackGroup, setSelectedRackGroup] = useState<string>(
    initialFilter?.type === 'rack' ? initialFilter.value || 'ALL' : 'ALL'
  );

  // Default sorted by rack code in ascending order
  const [sortBy, setSortBy] = useState<'rack' | 'itemCode' | 'partName' | 'currentQty' | 'totalValue' | 'lastUpdate'>('rack');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  
  // View mode: Virtual Scrolling (Tak Terbatas) or Paged
  const [viewMode, setViewMode] = useState<'virtual' | 'paged'>('virtual');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Multi-selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Extract unique 3-digit rack groups with item counts
  const rack3DigitGroups = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>();
    items.forEach(item => {
      const zone = normalizeRackCode(item.rack);
      const existing = counts.get(zone.groupCode);
      if (existing) {
        existing.count++;
      } else {
        counts.set(zone.groupCode, { label: zone.groupLabel, count: 1 });
      }
    });

    return Array.from(counts.entries()).sort(([codeA], [codeB]) => {
      const numA = parseInt(codeA, 10);
      const numB = parseInt(codeB, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      if (!isNaN(numA)) return -1;
      if (!isNaN(numB)) return 1;
      return codeA.localeCompare(codeB);
    }).map(([code, info]) => ({
      code,
      label: info.label,
      count: info.count,
    }));
  }, [items]);

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (searchTerm) {
        const query = searchTerm.toLowerCase();
        const match = 
          item.itemCode.toLowerCase().includes(query) ||
          item.partName.toLowerCase().includes(query) ||
          item.partNumber.toLowerCase().includes(query) ||
          item.modelUnit.toLowerCase().includes(query) ||
          item.rack.toLowerCase().includes(query) ||
          item.supplier.toLowerCase().includes(query) ||
          item.brand.toLowerCase().includes(query);
        if (!match) return false;
      }

      if (selectedType !== 'ALL' && item.type !== selectedType) return false;

      if (selectedStatus !== 'ALL') {
        if (selectedStatus === 'ORDER' && item.remark !== 'ORDER' && (item.currentQty > item.minStock || item.minStock <= 0)) return false;
        if (selectedStatus === 'OVER' && item.remark !== 'OVER') return false;
        if (selectedStatus === 'AMAN' && item.remark !== 'AMAN') return false;
        if (selectedStatus === 'HABIS' && item.currentQty > 0) return false;
      }

      if (selectedMovement !== 'ALL' && item.movement !== selectedMovement) return false;

      // 3-digit rack group filter
      if (selectedRackGroup !== 'ALL') {
        const zone = normalizeRackCode(item.rack);
        if (zone.groupCode !== selectedRackGroup) return false;
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'rack') {
        comparison = compareRacks(a.rack, b.rack);
        if (comparison === 0) {
          comparison = a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true });
        }
      } else if (sortBy === 'itemCode') {
        comparison = a.itemCode.localeCompare(b.itemCode, undefined, { numeric: true });
      } else if (sortBy === 'partName') {
        comparison = a.partName.localeCompare(b.partName);
      } else if (sortBy === 'currentQty') {
        comparison = a.currentQty - b.currentQty;
      } else if (sortBy === 'totalValue') {
        comparison = a.totalValue - b.totalValue;
      } else if (sortBy === 'lastUpdate') {
        comparison = (a.lastUpdateDate || '').localeCompare(b.lastUpdateDate || '');
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });
  }, [items, searchTerm, selectedType, selectedStatus, selectedMovement, selectedRackGroup, sortBy, sortDir]);

  // Virtual scroll setup
  const ROW_HEIGHT = 56;
  const {
    containerRef,
    onScroll,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
  } = useVirtualScroll({
    itemCount: filteredItems.length,
    itemHeight: ROW_HEIGHT,
    overscan: 6,
  });

  // Calculate items to render
  const visibleItems = useMemo(() => {
    if (viewMode === 'paged') {
      const start = (currentPage - 1) * pageSize;
      return filteredItems.slice(start, start + pageSize);
    }
    return filteredItems.slice(startIndex, endIndex);
  }, [viewMode, filteredItems, startIndex, endIndex, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredItems.length / pageSize) || 1;

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const toggleSelectItem = (id: string) => {
    const updated = new Set(selectedIds);
    if (updated.has(id)) {
      updated.delete(id);
    } else {
      updated.add(id);
    }
    setSelectedIds(updated);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map(i => i.id)));
    }
  };

  const handleDeleteItem = (item: InventoryItem) => {
    if (window.confirm(`Yakin ingin menghapus item [${item.itemCode}] "${item.partName}" dari katalog gudang?`)) {
      onDeleteItem(item.id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleBatchDeleteClick = () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`Yakin ingin menghapus ${selectedIds.size} item sekaligus dari katalog gudang?`)) {
      if (onBatchDelete) {
        onBatchDelete(Array.from(selectedIds));
      } else {
        selectedIds.forEach(id => onDeleteItem(id));
      }
      setSelectedIds(new Set());
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.currentQty <= 0) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
          HABIS
        </span>
      );
    }
    if ((item.minStock > 0 && item.currentQty <= item.minStock) || item.remark === 'ORDER') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          ORDER
        </span>
      );
    }
    if ((item.maxStock > 0 && item.currentQty > item.maxStock) || item.remark === 'OVER') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
          OVER
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
        AMAN
      </span>
    );
  };

  const getMovementBadge = (movement: MovementStatus) => {
    switch (movement) {
      case 'Fast Moving':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Fast Moving</span>;
      case 'Slow Moving':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 font-medium">Slow Moving</span>;
      case 'Dead Moving':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-medium">Dead Moving</span>;
      case 'Warning':
        return <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 font-medium">Warning</span>;
      default:
        return <span className="text-[10px] text-slate-400">{movement}</span>;
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Tab Lokasi Rak / Bin (3 Angka Awal) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between text-xs px-1">
          <div className="flex items-center gap-2 font-semibold text-slate-200">
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Tab Lokasi Rak / Bin (3 Angka Awal)</span>
            <span className="text-[11px] font-normal text-slate-400">
              — Klik untuk menyaring katalog per zona rak
            </span>
          </div>
          {selectedRackGroup !== 'ALL' && (
            <button 
              onClick={() => { setSelectedRackGroup('ALL'); setCurrentPage(1); }}
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
            >
              Reset ke Semua Rak
            </button>
          )}
        </div>
        
        {/* Scrollable Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          <button
            onClick={() => { setSelectedRackGroup('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
              selectedRackGroup === 'ALL'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            <span>Semua Rak</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-black/20">
              {items.length.toLocaleString('id-ID')}
            </span>
          </button>
          
          {rack3DigitGroups.map(group => (
            <button
              key={group.code}
              onClick={() => { setSelectedRackGroup(group.code); setCurrentPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                selectedRackGroup === group.code
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md scale-105'
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${selectedRackGroup === group.code ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{group.label}</span>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${
                selectedRackGroup === group.code ? 'bg-slate-950 text-amber-300 font-bold' : 'bg-slate-800 text-slate-400'
              }`}>
                {group.count.toLocaleString('id-ID')}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari part: Part Number, Nama, Kode DPS, Unit, Rak, Brand..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-4 py-2 text-xs md:text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                Clear
              </button>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* View Mode Toggle */}
            <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex items-center gap-1 text-xs">
              <button
                onClick={() => setViewMode('virtual')}
                className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'virtual' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Scroll tak terbatas dengan rendering virtual responsif"
              >
                <Scroll className="w-3.5 h-3.5" /> Virtual Scroll
              </button>
              <button
                onClick={() => setViewMode('paged')}
                className={`px-2.5 py-1 rounded font-medium flex items-center gap-1 transition-colors ${
                  viewMode === 'paged' ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
                }`}
                title="Tampilan halaman per halaman (25/50/100 item)"
              >
                <ListFilter className="w-3.5 h-3.5" /> Paginasi
              </button>
            </div>

            {/* Import Excel Button */}
            {onOpenImportExcel && (
              <button
                onClick={onOpenImportExcel}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 shadow-sm transition-colors"
                title="Import data suku cadang dari file Excel (.xlsx / .xls / .csv)"
              >
                <Upload className="w-3.5 h-3.5" />
                Import Excel
              </button>
            )}

            {/* Add SKU Button */}
            <button
              onClick={onAddNewItem}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah SKU
            </button>
          </div>
        </div>

        {/* Filter Badges Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Kategori / Tipe
            </label>
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Tipe (All)</option>
              <option value="SPT">SPT (Spare Part)</option>
              <option value="CNU">CNU (Consumable)</option>
              <option value="LIB">LIB (Part Service / Pelumas)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Status Stok
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="ORDER">ORDER (Stok Rendah &le; MIN)</option>
              <option value="HABIS">HABIS (Stok 0 / Minus)</option>
              <option value="AMAN">AMAN (Stok Cukup)</option>
              <option value="OVER">OVER (Stok Lebih &gt; MAX)</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Perputaran (Movement)
            </label>
            <select
              value={selectedMovement}
              onChange={(e) => {
                setSelectedMovement(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">Semua Perputaran</option>
              <option value="Fast Moving">Fast Moving</option>
              <option value="Slow Moving">Slow Moving</option>
              <option value="Dead Moving">Dead Moving</option>
              <option value="Warning">Warning</option>
            </select>
          </div>

          {/* Group Rak (3 Angka Awal) */}
          <div>
            <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Grup Rak (3 Angka Awal)
            </label>
            <select
              value={selectedRackGroup}
              onChange={(e) => {
                setSelectedRackGroup(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-amber-500 font-medium"
            >
              <option value="ALL">Semua Grup Rak ({rack3DigitGroups.length} Grup)</option>
              {rack3DigitGroups.map(g => (
                <option key={g.code} value={g.code}>
                  {g.label} ({g.count.toLocaleString('id-ID')} item)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results summary bar & Batch Delete Banner */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-1 gap-2">
          <div className="flex items-center gap-2">
            <span>
              Menampilkan <strong>{filteredItems.length.toLocaleString('id-ID')}</strong> item dari total <strong>{items.length.toLocaleString('id-ID')}</strong> SKU katalog
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 font-mono text-[11px] border border-amber-500/20">
              Urutan: {sortBy === 'rack' ? 'Kode Rak (3 Angka Awal)' : sortBy} ({sortDir.toUpperCase()})
            </span>
            {viewMode === 'virtual' && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[11px] border border-emerald-500/20">
                Virtual Scroll ({startIndex + 1}-{Math.min(endIndex, filteredItems.length)})
              </span>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-rose-950/80 border border-rose-800/80 px-3 py-1 rounded-lg animate-in fade-in">
              <span className="text-rose-200 font-semibold text-xs">
                {selectedIds.size} item terpilih
              </span>
              <button
                onClick={handleBatchDeleteClick}
                className="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow transition-colors"
                title="Hapus semua item yang dipilih dari katalog"
              >
                <Trash2 className="w-3.5 h-3.5" /> Hapus Terpilih
              </button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-slate-400 hover:text-white text-xs underline"
              >
                Batal
              </button>
            </div>
          )}

          {viewMode === 'paged' && (
            <div className="flex items-center gap-2">
              <span>Baris per halaman:</span>
              <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-slate-300 text-xs"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Inventory Table with Virtual Scrolling or Paged */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col">
        
        {/* Table Viewport Container */}
        <div 
          ref={containerRef}
          onScroll={onScroll}
          className={`overflow-x-auto ${viewMode === 'virtual' ? 'max-h-[680px] overflow-y-auto' : ''}`}
        >
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0 z-20 shadow-sm">
              <tr>
                <th className="py-3 px-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === filteredItems.length}
                    onChange={toggleSelectAll}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 cursor-pointer"
                    title="Pilih semua item yang sedang tampil"
                  />
                </th>
                {/* Sorted by Rack by default */}
                <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('rack')}>
                  <div className="flex items-center gap-1">
                    <span className={sortBy === 'rack' ? 'text-amber-400 font-bold' : ''}>Lokasi Rak</span>
                    <span className="text-slate-500">/ Kode</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'rack' ? 'text-amber-400' : ''}`} />
                  </div>
                </th>
                <th className="py-3 px-3 cursor-pointer hover:text-white" onClick={() => toggleSort('partName')}>
                  <div className="flex items-center gap-1">
                    <span>Nama Part & Spesifikasi</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'partName' ? 'text-amber-400' : ''}`} />
                  </div>
                </th>
                <th className="py-3 px-3">Unit & Brand</th>
                <th className="py-3 px-3 text-center cursor-pointer hover:text-white" onClick={() => toggleSort('currentQty')}>
                  <div className="flex items-center justify-center gap-1">
                    <span>Stok Akhir</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'currentQty' ? 'text-amber-400' : ''}`} />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Safety (Min/Max)</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right cursor-pointer hover:text-white" onClick={() => toggleSort('totalValue')}>
                  <div className="flex items-center justify-end gap-1">
                    <span>Harga & Nilai Aset</span>
                    <ArrowUpDown className={`w-3 h-3 ${sortBy === 'totalValue' ? 'text-amber-400' : ''}`} />
                  </div>
                </th>
                <th className="py-3 px-3 text-center">Aksi Cepat</th>
              </tr>
            </thead>

            {viewMode === 'virtual' ? (
              // Virtual Scrolling Tbody
              <tbody 
                className="font-sans divide-y divide-slate-800/80"
                style={{
                  height: `${totalHeight}px`,
                  position: 'relative',
                  display: 'table-row-group',
                }}
              >
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      Tidak ada barang yang cocok dengan kriteria pencarian atau grup rak ini.
                    </td>
                  </tr>
                ) : (
                  <>
                    {/* Top Virtual Spacer */}
                    {offsetY > 0 && (
                      <tr style={{ height: `${offsetY}px` }}>
                        <td colSpan={9} style={{ padding: 0, border: 0 }} />
                      </tr>
                    )}

                    {/* Windowed Visible Items */}
                    {visibleItems.map(item => (
                      <tr 
                        key={item.id}
                        style={{ height: `${ROW_HEIGHT}px` }}
                        className={`hover:bg-slate-800/50 transition-colors group ${
                          selectedIds.has(item.id) ? 'bg-amber-500/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2.5 px-3 text-center">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(item.id)}
                            onChange={() => toggleSelectItem(item.id)}
                            className="rounded bg-slate-950 border-slate-700 text-amber-500 cursor-pointer"
                          />
                        </td>

                        {/* Item Code & Rak (Prominent Rak Display) */}
                        <td className="py-2.5 px-3">
                          <div className="flex items-center gap-1 text-xs">
                            <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                              {item.rack}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-sky-400 mt-1">
                            {item.itemCode}
                          </div>
                        </td>

                        {/* Part Name & Part Number */}
                        <td className="py-2.5 px-3 max-w-[280px]">
                          <div 
                            onClick={() => onSelectItem(item)}
                            className="font-medium text-slate-100 hover:text-amber-400 cursor-pointer truncate transition-colors"
                            title={item.partName}
                          >
                            {item.partName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 truncate">
                            P/N: <span className="text-slate-300 font-semibold">{item.partNumber || '-'}</span>
                          </div>
                        </td>

                        {/* Model Unit & Brand */}
                        <td className="py-2.5 px-3 max-w-[160px]">
                          <div className="font-medium text-slate-200 text-xs truncate">
                            {item.modelUnit}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            {item.brand && item.brand !== '-' ? item.brand : item.supplier || '-'}
                          </div>
                        </td>

                        {/* Stok Akhir */}
                        <td className="py-2.5 px-3 text-center">
                          <div className={`text-sm font-extrabold font-mono tabular-nums ${
                            item.currentQty <= 0 
                              ? 'text-rose-400' 
                              : item.minStock > 0 && item.currentQty <= item.minStock 
                              ? 'text-amber-400' 
                              : 'text-emerald-400'
                          }`}>
                            {item.currentQty} <span className="text-[10px] font-normal text-slate-400">{item.uom}</span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono">
                            Awal: {item.initialQty} | In: {item.inQty} | Out: {item.outQty}
                          </div>
                        </td>

                        {/* Safety Stock (Min / Max) */}
                        <td className="py-2.5 px-3 text-center text-xs">
                          <div className="font-mono text-slate-300 tabular-nums">
                            {item.minStock > 0 || item.maxStock > 0 ? (
                              <span>{item.minStock} / {item.maxStock}</span>
                            ) : (
                              <span className="text-slate-600">-</span>
                            )}
                          </div>
                          <div className="mt-0.5">
                            {getMovementBadge(item.movement)}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-2.5 px-3 text-center">
                          {getStatusBadge(item)}
                        </td>

                        {/* Price & Total Value */}
                        <td className="py-2.5 px-3 text-right">
                          <div className="font-mono font-semibold text-slate-200 tabular-nums">
                            {item.totalValue > 0 ? formatRupiah(item.totalValue) : '-'}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                            @{formatRupiah(item.price)}
                          </div>
                        </td>

                        {/* Actions (Including Delete Button) */}
                        <td className="py-2.5 px-3 text-center">
                          <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                            <button
                              onClick={() => onQuickIn(item)}
                              title="Catat Barang Masuk (IN)"
                              className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onQuickOut(item)}
                              title="Catat Barang Keluar (OUT)"
                              className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => onSelectItem(item)}
                              title="Lihat Detail & Kartu Stok"
                              className="p-1 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item)}
                              title="Hapus Item dari Katalog"
                              className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-950/80 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {/* Bottom Virtual Spacer */}
                    {Math.max(0, totalHeight - offsetY - (visibleItems.length * ROW_HEIGHT)) > 0 && (
                      <tr style={{ height: `${Math.max(0, totalHeight - offsetY - (visibleItems.length * ROW_HEIGHT))}px` }}>
                        <td colSpan={9} style={{ padding: 0, border: 0 }} />
                      </tr>
                    )}
                  </>
                )}
              </tbody>
            ) : (
              // Standard Paged Tbody
              <tbody className="divide-y divide-slate-800/80 font-sans">
                {visibleItems.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      Tidak ada barang yang cocok dengan kriteria pencarian atau grup rak ini.
                    </td>
                  </tr>
                ) : (
                  visibleItems.map(item => (
                    <tr 
                      key={item.id}
                      className={`hover:bg-slate-800/50 transition-colors group ${
                        selectedIds.has(item.id) ? 'bg-amber-500/10' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-2.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(item.id)}
                          onChange={() => toggleSelectItem(item.id)}
                          className="rounded bg-slate-950 border-slate-700 text-amber-500 cursor-pointer"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1 text-xs">
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-mono font-bold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {item.rack}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-sky-400 mt-1">
                          {item.itemCode}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[280px]">
                        <div 
                          onClick={() => onSelectItem(item)}
                          className="font-medium text-slate-100 hover:text-amber-400 cursor-pointer truncate transition-colors"
                          title={item.partName}
                        >
                          {item.partName}
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 truncate">
                          P/N: <span className="text-slate-300 font-semibold">{item.partNumber || '-'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-3 max-w-[160px]">
                        <div className="font-medium text-slate-200 text-xs truncate">
                          {item.modelUnit}
                        </div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {item.brand && item.brand !== '-' ? item.brand : item.supplier || '-'}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        <div className={`text-sm font-extrabold font-mono tabular-nums ${
                          item.currentQty <= 0 
                            ? 'text-rose-400' 
                            : item.minStock > 0 && item.currentQty <= item.minStock 
                            ? 'text-amber-400' 
                            : 'text-emerald-400'
                        }`}>
                          {item.currentQty} <span className="text-[10px] font-normal text-slate-400">{item.uom}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Awal: {item.initialQty} | In: {item.inQty} | Out: {item.outQty}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center text-xs">
                        <div className="font-mono text-slate-300 tabular-nums">
                          {item.minStock > 0 || item.maxStock > 0 ? (
                            <span>{item.minStock} / {item.maxStock}</span>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {getMovementBadge(item.movement)}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {getStatusBadge(item)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <div className="font-mono font-semibold text-slate-200 tabular-nums">
                          {item.totalValue > 0 ? formatRupiah(item.totalValue) : '-'}
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 tabular-nums">
                          @{formatRupiah(item.price)}
                        </div>
                      </td>

                      {/* Actions (Including Delete Button) */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 opacity-90 group-hover:opacity-100">
                          <button
                            onClick={() => onQuickIn(item)}
                            title="Catat Barang Masuk (IN)"
                            className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onQuickOut(item)}
                            title="Catat Barang Keluar (OUT)"
                            className="p-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 transition-colors"
                          >
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onSelectItem(item)}
                            title="Lihat Detail & Kartu Stok"
                            className="p-1 rounded bg-slate-800 text-sky-400 hover:bg-slate-700 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item)}
                            title="Hapus Item dari Katalog"
                            className="p-1 rounded bg-slate-800 text-rose-400 hover:bg-rose-950/80 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            )}
          </table>
        </div>

        {/* Paged Mode Navigation Footer */}
        {viewMode === 'paged' && (
          <div className="py-3 px-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({filteredItems.length.toLocaleString('id-ID')} total item)
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Prev
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-slate-200 transition-colors"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
