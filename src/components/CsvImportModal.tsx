import React, { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  AlertCircle, 
  Download, 
  Layers, 
  RefreshCw 
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { parseWarehouseCsv, formatRupiah } from '../utils/csvParser';
import { warehouseStorage } from '../services/storage';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentCount: number;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentCount,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedItems, setParsedItems] = useState<InventoryItem[]>([]);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    processCsvFile(selected);
  };

  const processCsvFile = (csvFile: File) => {
    setFile(csvFile);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const items = parseWarehouseCsv(text);
        if (items.length === 0) {
          setErrorMsg('File CSV tidak berisi data yang dapat diproses atau format kolom tidak sesuai.');
          setParsedItems([]);
        } else {
          setParsedItems(items);
        }
      } catch (err) {
        setErrorMsg('Gagal membaca file CSV: ' + String(err));
        setParsedItems([]);
      }
    };
    reader.readAsText(csvFile);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'No', 'Item', 'Rak', 'Type', 'Model Unit', 'Part Number', 'Part Name',
      'CODE UNIT', 'Tanggal Update', 'Tanggal Masuk', 'Tanggal Keluar',
      'Supplier', 'Brand', 'Awal Qty', 'UOM', 'IN Qty', 'Penyesuaian (+) Qty',
      'OUT Qty', 'Penyesuaian (-) Qty', 'Akhir Qty', '', 'MIN', 'MAX', 'REMARK',
      'Movement', 'Price', 'Total', '', 'Status 1th'
    ];

    const sampleRow = [
      '1', 'DPS-5001', '101A01', 'SPT', 'Komatsu PC 200', '600-185-4100', 'Air Cleaner Outer Element',
      'A2B', '01-Oct-26', '01-Oct-26', '', 'United Tractor', 'KOMATSU GENUINE PARTS',
      '10', 'Pcs', '0', '0', '0', '0', '10', '', '2', '8', 'AMAN',
      'Fast Moving', 'Rp450,000', 'Rp4,500,000', '', 'Fast Moving'
    ];

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), sampleRow.join(',')].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = 'template-import-gudang.csv';
    a.click();
  };

  const handleExecuteImport = async () => {
    if (parsedItems.length === 0) return;
    setIsProcessing(true);

    try {
      if (importMode === 'replace') {
        warehouseStorage.saveItems(parsedItems);
      } else {
        // Merge: existing items updated if matching itemCode, or new items added
        const currentItems = await warehouseStorage.getItems();
        const map = new Map<string, InventoryItem>();
        currentItems.forEach(i => map.set(i.itemCode, i));

        parsedItems.forEach(item => {
          map.set(item.itemCode, item);
        });

        const merged = Array.from(map.values());
        warehouseStorage.saveItems(merged);
      }

      onSuccess();
      onClose();
      alert(`Berhasil mengimpor ${parsedItems.length} item suku cadang ke dalam katalog gudang!`);
    } catch (err) {
      alert('Terjadi kesalahan saat menyimpan data: ' + String(err));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-2xl w-full my-auto overflow-hidden text-slate-100 animate-in fade-in duration-150">
        
        {/* Header */}
        <div className="py-4 px-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-white">Import Suku Cadang dari File CSV</h3>
              <p className="text-xs text-slate-400">Muat dan perbarui ribuan data inventaris secara offline</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          
          {/* File Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/80 rounded-xl p-6 text-center cursor-pointer transition-colors bg-slate-950/50 group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".csv,text/csv" 
              className="hidden" 
            />
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            {file ? (
              <div>
                <p className="font-semibold text-white text-sm">{file.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB • Klik untuk memilih file CSV lain
                </p>
              </div>
            ) : (
              <div>
                <p className="font-semibold text-slate-200 text-sm">Klik atau seret file CSV ke sini</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Mendukung format ekspor CSV inventaris gudang sparepart
                </p>
              </div>
            )}
          </div>

          {/* Template Download link */}
          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <span>Butuh format template standar?</span>
            <button
              onClick={handleDownloadTemplate}
              className="text-emerald-400 hover:text-emerald-300 font-medium inline-flex items-center gap-1 underline underline-offset-2"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Contoh Template CSV
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Terdeteksi <strong>{parsedItems.length.toLocaleString('id-ID')}</strong> Item Siap Diimpor
                </span>
                <span className="text-slate-400 text-[11px]">
                  (Saat ini ada {currentCount.toLocaleString('id-ID')} item di katalog)
                </span>
              </div>

              {/* Sample Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950">
                <div className="p-2 bg-slate-900 border-b border-slate-800 text-[11px] font-semibold text-slate-300">
                  Pratinjau 4 Baris Pertama:
                </div>
                <div className="divide-y divide-slate-800/80">
                  {parsedItems.slice(0, 4).map(item => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-mono font-bold text-sky-400 mr-2">{item.itemCode}</span>
                        <span className="text-slate-200 font-medium">{item.partName}</span>
                        <span className="text-slate-400 text-[11px] ml-2 font-mono">({item.partNumber})</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-400 text-[11px]">Rak: {item.rack}</span>
                        <span className="font-mono font-bold text-emerald-400">{item.currentQty} {item.uom}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Import Mode Selection */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="font-semibold text-white block">Pilih Opsi Penggabungan Data:</span>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={() => setImportMode('merge')}
                      className="mt-0.5 text-emerald-500"
                    />
                    <div>
                      <span className="font-semibold text-white block">Gabungkan & Perbarui (Merge) - Direkomendasikan</span>
                      <span className="text-slate-400 text-[11px]">
                        Item dengan Kode Item sama akan diperbarui, sedangkan item baru akan ditambahkan tanpa menghapus item yang sudah ada.
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800 cursor-pointer hover:border-slate-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="mt-0.5 text-rose-500"
                    />
                    <div>
                      <span className="font-semibold text-rose-300 block">Ganti Seluruh Katalog (Replace)</span>
                      <span className="text-slate-400 text-[11px]">
                        Hapus seluruh katalog yang ada saat ini dan gantikan sepenuhnya dengan {parsedItems.length.toLocaleString('id-ID')} item dari file CSV ini.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="py-4 px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleExecuteImport}
            disabled={parsedItems.length === 0 || isProcessing}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white font-semibold shadow transition-colors flex items-center gap-1.5"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Memproses...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" /> Proses Impor CSV ({parsedItems.length} Item)
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
