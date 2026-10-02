import React, { useState } from 'react';
import { 
  X, 
  ClipboardCheck, 
  Check, 
  AlertTriangle, 
  Search,
  CheckCircle2
} from 'lucide-react';
import { InventoryItem, StockOpnameRecord } from '../types/warehouse';
import { warehouseStorage } from '../services/storage';

interface StockOpnameModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: InventoryItem[];
  onSuccess: () => void;
}

export const StockOpnameModal: React.FC<StockOpnameModalProps> = ({
  isOpen,
  onClose,
  items,
  onSuccess,
}) => {
  const [selectedItemId, setSelectedItemId] = useState<string>(items[0]?.id || '');
  const [physicalQty, setPhysicalQty] = useState<number>(0);
  const [auditor, setAuditor] = useState<string>('Auditor Internal');
  const [notes, setNotes] = useState<string>('Stock Opname Berkala');
  const [applyAdjustment, setApplyAdjustment] = useState<boolean>(true);

  if (!isOpen) return null;

  const currentItem = items.find(i => i.id === selectedItemId);
  const systemQty = currentItem ? currentItem.currentQty : 0;
  const discrepancy = Number(physicalQty || 0) - systemQty;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentItem) return;

    const opnameRecord: StockOpnameRecord = {
      id: 'OPN-' + Date.now(),
      itemId: currentItem.id,
      itemCode: currentItem.itemCode,
      partName: currentItem.partName,
      rack: currentItem.rack,
      systemQty,
      physicalQty: Number(physicalQty),
      discrepancy,
      date: new Date().toISOString().split('T')[0],
      auditor,
      notes,
      adjusted: applyAdjustment,
    };

    warehouseStorage.saveOpnameRecord(opnameRecord);

    // If apply adjustment is checked, create adjustment transaction to make system stock match physical stock!
    if (applyAdjustment && discrepancy !== 0) {
      const type = discrepancy > 0 ? 'ADJUSTMENT_PLUS' : 'ADJUSTMENT_MINUS';
      const absQty = Math.abs(discrepancy);
      
      warehouseStorage.recordTransaction({
        itemId: currentItem.id,
        itemCode: currentItem.itemCode,
        partNumber: currentItem.partNumber,
        partName: currentItem.partName,
        rack: currentItem.rack,
        type,
        quantity: absQty,
        previousQty: systemQty,
        newQty: Number(physicalQty),
        date: new Date().toISOString().split('T')[0],
        referenceNo: opnameRecord.id,
        unitTarget: 'Stock Opname',
        recipientOrSupplier: auditor,
        notes: `Penyesuaian hasil audit fisik (Selisih: ${discrepancy > 0 ? '+' : ''}${discrepancy}). Catatan: ${notes}`,
        user: auditor,
      });
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        
        {/* Header */}
        <div className="py-3.5 px-5 flex items-center justify-between border-b bg-indigo-950/40 border-indigo-900/60">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Form Audit Stock Opname Fisik</h3>
              <p className="text-[11px] text-slate-400">Pencocokan stok fisik lapangan dengan data sistem</p>
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
          
          {/* Item Selector */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pilih Suku Cadang yang Di-audit <span className="text-rose-400">*</span>
            </label>
            <select
              value={selectedItemId}
              onChange={(e) => {
                setSelectedItemId(e.target.value);
                const item = items.find(i => i.id === e.target.value);
                if (item) setPhysicalQty(item.currentQty);
              }}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              required
            >
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  [{item.itemCode}] Rak: {item.rack} - {item.partName} (Sistem: {item.currentQty} {item.uom})
                </option>
              ))}
            </select>
          </div>

          {/* Audit Comparison Card */}
          {currentItem && (
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Stok Sistem</span>
                  <span className="text-base font-bold font-mono text-slate-200">
                    {systemQty} <span className="text-xs font-normal">{currentItem.uom}</span>
                  </span>
                </div>
                <div className="border-x border-slate-800 px-2">
                  <span className="text-[10px] text-slate-400 block uppercase">Hitungan Fisik</span>
                  <input
                    type="number"
                    step="any"
                    value={physicalQty}
                    onChange={(e) => setPhysicalQty(parseFloat(e.target.value) || 0)}
                    className="w-full text-center bg-slate-900 border border-indigo-500 rounded p-1 font-mono font-bold text-white text-base focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Selisih (Discrepancy)</span>
                  <span className={`text-base font-bold font-mono ${
                    discrepancy === 0 ? 'text-emerald-400' : discrepancy > 0 ? 'text-sky-400' : 'text-rose-400'
                  }`}>
                    {discrepancy > 0 ? `+${discrepancy}` : discrepancy} <span className="text-xs font-normal">{currentItem.uom}</span>
                  </span>
                </div>
              </div>

              {discrepancy !== 0 ? (
                <div className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  discrepancy > 0 ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20' : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Ditemukan selisih sebesar <strong>{Math.abs(discrepancy)} {currentItem.uom}</strong> ({discrepancy > 0 ? 'Surplus / Lebih Fisik' : 'Minus / Kurang Fisik'}).
                  </span>
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Stok fisik akurat dan cocok 100% dengan catatan sistem.
                </div>
              )}
            </div>
          )}

          {/* Auditor Name & Date */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Nama Auditor / Petugas <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={auditor}
                onChange={(e) => setAuditor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Keterangan Audit
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Misal: Opname Bulanan, Selisih baut hilang"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Auto adjust checkbox */}
          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="auto-adjust"
              checked={applyAdjustment}
              onChange={(e) => setApplyAdjustment(e.target.checked)}
              className="w-4 h-4 rounded text-indigo-600 bg-slate-950 border-slate-700 focus:ring-indigo-500"
            />
            <label htmlFor="auto-adjust" className="text-slate-300 cursor-pointer text-xs">
              Langsung perbarui stok sistem agar sama persis dengan hasil hitungan fisik ({physicalQty} {currentItem?.uom})
            </label>
          </div>

          {/* Buttons */}
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
              className="px-4 py-2 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Simpan Hasil Audit
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
