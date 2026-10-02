import React, { useState, useEffect } from 'react';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { InventoryItem, TransactionType } from '../types/warehouse';
import { warehouseStorage } from '../services/storage';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: TransactionType;
  items: InventoryItem[];
  preselectedItem?: InventoryItem | null;
  onSuccess: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  type,
  items,
  preselectedItem,
  onSuccess,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [unitTarget, setUnitTarget] = useState<string>('');
  const [recipientOrSupplier, setRecipientOrSupplier] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [user, setUser] = useState<string>('Petugas Gudang');

  useEffect(() => {
    if (preselectedItem) {
      setSelectedItemId(preselectedItem.id);
      if (type === 'IN') {
        setRecipientOrSupplier(preselectedItem.supplier || '');
      } else {
        setUnitTarget(preselectedItem.modelUnit || '');
      }
    } else if (items.length > 0 && !selectedItemId) {
      setSelectedItemId(items[0].id);
    }
  }, [preselectedItem, items, type]);

  if (!isOpen) return null;

  const currentItem = items.find(i => i.id === selectedItemId);
  const currentStock = currentItem ? currentItem.currentQty : 0;
  
  let newStock = currentStock;
  if (type === 'IN' || type === 'ADJUSTMENT_PLUS') {
    newStock = currentStock + Number(quantity || 0);
  } else if (type === 'OUT' || type === 'ADJUSTMENT_MINUS') {
    newStock = currentStock - Number(quantity || 0);
  }

  const isOutExceeds = (type === 'OUT' || type === 'ADJUSTMENT_MINUS') && Number(quantity || 0) > currentStock;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;
    if (quantity <= 0) {
      alert('Kuantitas harus lebih besar dari 0!');
      return;
    }

    warehouseStorage.recordTransaction({
      itemId: currentItem.id,
      itemCode: currentItem.itemCode,
      partNumber: currentItem.partNumber,
      partName: currentItem.partName,
      rack: currentItem.rack,
      type,
      quantity: Number(quantity),
      previousQty: currentStock,
      newQty: newStock,
      date,
      referenceNo,
      unitTarget,
      recipientOrSupplier,
      notes,
      user,
    });

    onSuccess();
    onClose();
  };

  const isEntry = type === 'IN';
  const title = isEntry 
    ? 'Penerimaan Barang Masuk (Stock IN)' 
    : type === 'OUT' 
    ? 'Pengeluaran Barang Keluar (Stock OUT)' 
    : 'Penyesuaian Stok (Stock Adjustment)';

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className={`py-3.5 px-5 flex items-center justify-between border-b ${
          isEntry ? 'bg-emerald-950/40 border-emerald-900/60' : 'bg-rose-950/40 border-rose-900/60'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${
              isEntry ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {isEntry ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">{title}</h3>
              <p className="text-[11px] text-slate-400">Pencatatan mutasi inventaris gudang offline</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          
          {/* Pilih Barang */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pilih Item Suku Cadang / Barang <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              required
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.itemCode}] {item.partName} - {item.partNumber} (Stok: {item.currentQty} {item.uom})
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock vs New Stock Preview */}
          {currentItem && (
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block">Stok Saat Ini</span>
                <span className="text-sm font-bold text-slate-200">{currentStock} {currentItem.uom}</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-[10px] text-slate-400 block">{isEntry ? '+ Masuk' : '- Keluar'}</span>
                <span className={`text-sm font-bold ${isEntry ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {quantity || 0} {currentItem.uom}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">Stok Baru</span>
                <span className={`text-sm font-bold ${newStock < 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                  {newStock} {currentItem.uom}
                </span>
              </div>
            </div>
          )}

          {isOutExceeds && (
            <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>Perhatian: Jumlah keluar melebihi stok yang ada ({currentStock} {currentItem?.uom}). Stok akan menjadi negatif.</span>
            </div>
          )}

          {/* Quantity & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kuantitas / Jumlah ({currentItem?.uom || 'Pcs'}) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500 font-mono text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Tanggal Transaksi <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Reference Document & Target Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isEntry ? 'No. Surat Jalan / PO' : 'No. Work Order (WO) / SPK'}
              </label>
              <input
                type="text"
                placeholder={isEntry ? 'Contoh: SJ-2026/09/012' : 'Contoh: WO-DT-104-MTC'}
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                {isEntry ? 'Supplier / Pengirim' : 'Unit Armada / Alat Berat'}
              </label>
              <input
                type="text"
                placeholder={isEntry ? 'Nama Vendor / Supplier' : 'Contoh: DT-260-05, EX-401, Genset'}
                value={isEntry ? recipientOrSupplier : unitTarget}
                onChange={(e) => isEntry ? setRecipientOrSupplier(e.target.value) : setUnitTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Keterangan / Keperluan Pemasangan
            </label>
            <textarea
              rows={2}
              placeholder="Catatan tambahan keperluan servis, overhaul, ganti berkala..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-lg font-semibold text-white shadow transition-colors flex items-center gap-1.5 ${
                isEntry 
                  ? 'bg-emerald-600 hover:bg-emerald-500' 
                  : 'bg-rose-600 hover:bg-rose-500'
              }`}
            >
              <Check className="w-4 h-4" />
              Simpan Transaksi
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
