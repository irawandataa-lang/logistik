import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Tag, 
  Calendar, 
  Truck, 
  Layers, 
  Printer, 
  Edit3, 
  Trash2, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Barcode,
  Building,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { InventoryItem, StockTransaction } from '../types/warehouse';
import { formatRupiah } from '../utils/csvParser';

interface ItemDetailModalProps {
  item: InventoryItem | null;
  onClose: () => void;
  transactions: StockTransaction[];
  onQuickIn: (item: InventoryItem) => void;
  onQuickOut: (item: InventoryItem) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
}

export const ItemDetailModal: React.FC<ItemDetailModalProps> = ({
  item,
  onClose,
  transactions,
  onQuickIn,
  onQuickOut,
  onEditItem,
  onDeleteItem,
}) => {
  if (!item) return null;

  // Filter transactions for this item
  const itemTrxs = transactions.filter(t => t.itemId === item.id || t.itemCode === item.itemCode);

  const handlePrintStockCard = () => {
    window.print();
  };

  const handleDelete = () => {
    if (window.confirm(`Yakin ingin menghapus item [${item.itemCode}] ${item.partName} dari katalog?`)) {
      onDeleteItem(item.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden text-slate-100 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="py-4 px-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded">
                {item.itemCode}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                P/N: {item.partNumber || '-'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-sky-500/10 text-sky-300 border border-sky-500/30">
                {item.type}
              </span>
            </div>
            <h2 className="text-base font-bold text-white mt-1">{item.partName}</h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1 text-slate-300">
                <MapPin className="w-3.5 h-3.5 text-amber-400" /> Rak: <strong>{item.rack}</strong>
              </span>
              <span>•</span>
              <span>Model: <strong className="text-slate-300">{item.modelUnit}</strong></span>
              <span>•</span>
              <span>Unit Code: <strong className="text-slate-300">{item.unitCode}</strong></span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrintStockCard}
              title="Cetak Kartu Stok / Label Rak"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={() => onEditItem(item)}
              title="Edit Data Item"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDelete}
              title="Hapus Item"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-rose-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          
          {/* Quick Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center gap-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Stok Tersedia</span>
                <span className={`text-xl font-mono font-extrabold ${
                  item.currentQty <= 0 ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {item.currentQty} <span className="text-xs font-normal text-slate-400">{item.uom}</span>
                </span>
              </div>
              <div className="h-8 w-px bg-slate-800"></div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Nilai Aset</span>
                <span className="text-base font-mono font-bold text-white">
                  {formatRupiah(item.totalValue)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onQuickIn(item)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1 shadow-sm"
              >
                <ArrowDownLeft className="w-4 h-4" /> + IN (Masuk)
              </button>
              <button
                onClick={() => onQuickOut(item)}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-semibold flex items-center gap-1 shadow-sm"
              >
                <ArrowUpRight className="w-4 h-4" /> - OUT (Keluar)
              </button>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Safety Min</span>
              <span className="text-sm font-mono font-bold text-slate-200">{item.minStock} {item.uom}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Safety Max</span>
              <span className="text-sm font-mono font-bold text-slate-200">{item.maxStock} {item.uom}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Status Movement</span>
              <span className="text-xs font-semibold text-amber-400">{item.movement}</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] text-slate-400 block mb-0.5">Harga Satuan</span>
              <span className="text-xs font-mono font-bold text-white">{formatRupiah(item.price)}</span>
            </div>
          </div>

          {/* Supplier, Brand & Movement Dates */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <h3 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-sky-400" /> Informasi Supplier & Sumber Pengadaan
            </h3>
            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <span className="text-slate-400 block">Supplier:</span>
                <span className="font-medium text-slate-200">{item.supplier || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Brand / Merek:</span>
                <span className="font-medium text-slate-200">{item.brand || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal Terakhir Masuk:</span>
                <span className="font-mono text-slate-300">{item.lastInDate || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Tanggal Terakhir Keluar:</span>
                <span className="font-mono text-slate-300">{item.lastOutDate || '-'}</span>
              </div>
            </div>
          </div>

          {/* Visual Barcode & Bin Bin Label (Printable) */}
          <div className="p-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-center space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
              Label Barcode / Rak Gudang
            </span>
            <div className="font-mono tracking-widest text-lg font-extrabold text-white bg-white/5 px-4 py-1.5 rounded border border-slate-700">
              ||| | |||| | ||||| || ||| |||
            </div>
            <div className="font-mono text-xs text-slate-300 font-bold">
              {item.itemCode} • RAK: {item.rack}
            </div>
            <p className="text-[11px] text-slate-400 max-w-sm truncate">
              {item.partName} ({item.partNumber})
            </p>
          </div>

          {/* History of Transactions for this item */}
          <div className="space-y-2">
            <h3 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-amber-400" /> Riwayat Mutasi Barang Ini ({itemTrxs.length})
            </h3>

            {itemTrxs.length === 0 ? (
              <p className="text-slate-500 italic py-2 text-center bg-slate-950/40 rounded-lg">
                Belum ada mutasi keluar/masuk tercatat untuk item ini.
              </p>
            ) : (
              <div className="divide-y divide-slate-800 border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                {itemTrxs.slice(0, 5).map(trx => (
                  <div key={trx.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className={`font-bold font-mono ${
                        trx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                      }`}>
                        {trx.type === 'IN' ? '+' : '-'}{trx.quantity} {item.uom}
                      </span>
                      <span className="text-slate-400 text-[11px] ml-2 font-mono">{trx.date}</span>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">
                        Ref: {trx.referenceNo || '-'} • {trx.unitTarget || trx.recipientOrSupplier || '-'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      Sisa: <strong className="text-white">{trx.newQty}</strong>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="py-3 px-6 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
