import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Edit3, Package } from 'lucide-react';
import { InventoryItem, ItemType, MovementStatus, StockRemark } from '../types/warehouse';
import { warehouseStorage } from '../services/storage';

interface AddItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  editItem?: InventoryItem | null;
  onSuccess: () => void;
  existingCount: number;
}

export const AddItemModal: React.FC<AddItemModalProps> = ({
  isOpen,
  onClose,
  editItem,
  onSuccess,
  existingCount,
}) => {
  const [itemCode, setItemCode] = useState('');
  const [partName, setPartName] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [rack, setRack] = useState('101A01');
  const [type, setType] = useState<ItemType>('SPT');
  const [modelUnit, setModelUnit] = useState('General');
  const [unitCode, setUnitCode] = useState('General');
  const [uom, setUom] = useState('Pcs');
  const [currentQty, setCurrentQty] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(2);
  const [maxStock, setMaxStock] = useState<number>(10);
  const [price, setPrice] = useState<number>(0);
  const [supplier, setSupplier] = useState('');
  const [brand, setBrand] = useState('');
  const [movement, setMovement] = useState<MovementStatus>('Fast Moving');

  useEffect(() => {
    if (editItem) {
      setItemCode(editItem.itemCode);
      setPartName(editItem.partName);
      setPartNumber(editItem.partNumber);
      setRack(editItem.rack);
      setType(editItem.type);
      setModelUnit(editItem.modelUnit);
      setUnitCode(editItem.unitCode);
      setUom(editItem.uom);
      setCurrentQty(editItem.currentQty);
      setMinStock(editItem.minStock);
      setMaxStock(editItem.maxStock);
      setPrice(editItem.price);
      setSupplier(editItem.supplier);
      setBrand(editItem.brand);
      setMovement(editItem.movement);
    } else {
      setItemCode(`DPS-${existingCount + 1000}`);
      setPartName('');
      setPartNumber('');
      setRack('101A01');
      setType('SPT');
      setModelUnit('General');
      setUnitCode('General');
      setUom('Pcs');
      setCurrentQty(0);
      setMinStock(2);
      setMaxStock(10);
      setPrice(0);
      setSupplier('');
      setBrand('');
      setMovement('Fast Moving');
    }
  }, [editItem, existingCount, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let remark: StockRemark = 'AMAN';
    if (currentQty <= 0) {
      remark = 'HABIS';
    } else if (minStock > 0 && currentQty <= minStock) {
      remark = 'ORDER';
    } else if (maxStock > 0 && currentQty > maxStock) {
      remark = 'OVER';
    }

    const totalValue = currentQty > 0 ? currentQty * price : 0;
    const today = new Date().toISOString().split('T')[0];

    if (editItem) {
      const updated: InventoryItem = {
        ...editItem,
        itemCode,
        partName,
        partNumber,
        rack,
        type,
        modelUnit,
        unitCode,
        uom,
        currentQty,
        minStock,
        maxStock,
        price,
        totalValue,
        supplier,
        brand,
        movement,
        remark,
        lastUpdateDate: today,
      };
      warehouseStorage.updateItem(updated);
    } else {
      const newItem: InventoryItem = {
        id: `${itemCode}-${Date.now()}`,
        no: existingCount + 1,
        itemCode,
        partName,
        partNumber,
        rack,
        type,
        modelUnit,
        unitCode,
        uom,
        initialQty: currentQty,
        inQty: 0,
        outQty: 0,
        adjustPlusQty: 0,
        adjustMinusQty: 0,
        currentQty,
        minStock,
        maxStock,
        price,
        totalValue,
        supplier,
        brand,
        movement,
        remark,
        lastUpdateDate: today,
        lastInDate: today,
        lastOutDate: '',
        status1th: movement,
      };
      warehouseStorage.addItem(newItem);
    }

    onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-xl w-full my-auto overflow-hidden text-slate-100 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="py-3.5 px-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">
                {editItem ? 'Edit Master Data Suku Cadang' : 'Tambah Master Suku Cadang / SKU Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">Data tersimpan di penyimpanan offline browser</p>
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[75vh] overflow-y-auto">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kode Item (DPS) <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Lokasi Rak / Bin <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                placeholder="Contoh: 101A01, Container GET..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Nama Part / Barang <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Contoh: Karet Kopling F3, Filter Oli..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Part Number (P/N)
              </label>
              <input
                type="text"
                value={partNumber}
                onChange={(e) => setPartNumber(e.target.value)}
                placeholder="Nomor part pabrikan"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Kategori Tipe
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ItemType)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="SPT">SPT (Spare Part)</option>
                <option value="CNU">CNU (Consumable)</option>
                <option value="LIB">LIB (Part Service / Pelumas)</option>
                <option value="OTHER">Lainnya</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Model Unit / Armada
              </label>
              <input
                type="text"
                value={modelUnit}
                onChange={(e) => setModelUnit(e.target.value)}
                placeholder="Contoh: Hino 260 JD, Scania, PC 200..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Perputaran (Movement)
              </label>
              <select
                value={movement}
                onChange={(e) => setMovement(e.target.value as MovementStatus)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Fast Moving">Fast Moving</option>
                <option value="Slow Moving">Slow Moving</option>
                <option value="Dead Moving">Dead Moving</option>
                <option value="Warning">Warning</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Stok Fisik
              </label>
              <input
                type="number"
                step="any"
                value={currentQty}
                onChange={(e) => setCurrentQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Satuan (UOM)
              </label>
              <input
                type="text"
                value={uom}
                onChange={(e) => setUom(e.target.value)}
                placeholder="Pcs, Set, Mtr..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Harga Beli Satuan (IDR)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Batas Minimum (Safety Stock)
              </label>
              <input
                type="number"
                value={minStock}
                onChange={(e) => setMinStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Batas Maksimum (Max Stock)
              </label>
              <input
                type="number"
                value={maxStock}
                onChange={(e) => setMaxStock(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Supplier
              </label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="Nama vendor/supplier"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Brand / Merk
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Komatsu, Donaldson, Genuine..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              {editItem ? 'Simpan Perubahan' : 'Tambah ke Gudang'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
