import React, { useMemo } from 'react';
import { 
  ShoppingCart, 
  Printer, 
  FileSpreadsheet, 
  AlertTriangle, 
  ArrowDownLeft, 
  MapPin, 
  CheckCircle2 
} from 'lucide-react';
import { InventoryItem } from '../types/warehouse';
import { formatRupiah } from '../utils/csvParser';

interface ReorderViewProps {
  items: InventoryItem[];
  onSelectItem: (item: InventoryItem) => void;
  onQuickIn: (item: InventoryItem) => void;
}

export const ReorderView: React.FC<ReorderViewProps> = ({
  items,
  onSelectItem,
  onQuickIn,
}) => {
  // Filter items where currentQty <= minStock OR remark is ORDER OR currentQty <= 0
  const orderList = useMemo(() => {
    return items.filter(item => {
      if (item.currentQty <= 0) return true;
      if (item.minStock > 0 && item.currentQty <= item.minStock) return true;
      if (item.remark === 'ORDER') return true;
      return false;
    }).map(item => {
      // Calculate suggested order quantity
      let suggestedOrder = 0;
      if (item.maxStock > 0 && item.maxStock > item.currentQty) {
        suggestedOrder = item.maxStock - item.currentQty;
      } else if (item.minStock > 0) {
        suggestedOrder = item.minStock * 2;
      } else {
        suggestedOrder = 5;
      }
      const estimatedCost = suggestedOrder * (item.price || 0);

      return {
        ...item,
        suggestedOrder,
        estimatedCost,
      };
    }).sort((a, b) => (a.currentQty - a.minStock) - (b.currentQty - b.minStock));
  }, [items]);

  const totalEstimatedCost = orderList.reduce((acc, curr) => acc + curr.estimatedCost, 0);

  const handlePrintPR = () => {
    window.print();
  };

  const handleExportReorderCsv = () => {
    if (orderList.length === 0) return;
    const headers = [
      'No', 'Item Code', 'Rak', 'Part Number', 'Nama Part', 'Unit Model',
      'Stok Sekarang', 'Satuan', 'MIN', 'MAX', 'Saran Order Qty', 'Harga Satuan', 'Estimasi Total Biaya', 'Supplier Rekomendasi'
    ];
    const rows = orderList.map((item, idx) => [
      idx + 1,
      `"${item.itemCode}"`,
      `"${item.rack}"`,
      `"${item.partNumber}"`,
      `"${item.partName.replace(/"/g, '""')}"`,
      `"${item.modelUnit}"`,
      item.currentQty,
      `"${item.uom}"`,
      item.minStock,
      item.maxStock,
      item.suggestedOrder,
      item.price,
      item.estimatedCost,
      `"${item.supplier || '-'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + 
      [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const a = document.createElement('a');
    a.href = encodedUri;
    a.download = `daftar-permintaan-pembelian-PO-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      
      {/* Header and Summary Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Daftar Kebutuhan Order Pembelian (Reorder List / PR)
                <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {orderList.length} Item Kritis
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Kalkulasi otomatis jumlah rekomendasi pemesanan suku cadang agar mencapai batas MAX safety stock
              </p>
            </div>
          </div>
        </div>

        {/* Total Cost and Print/Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-right pr-2 border-r border-slate-800 hidden sm:block">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Estimasi Anggaran PO</span>
            <span className="text-base font-bold text-amber-400 font-mono">
              {formatRupiah(totalEstimatedCost)}
            </span>
          </div>

          <button
            onClick={handleExportReorderCsv}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Ekspor PR ke CSV
          </button>
          <button
            onClick={handlePrintPR}
            className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4" /> Cetak Form PR / PO
          </button>
        </div>
      </div>

      {/* Printable Purchase Requisition (PR) Table */}
      <div id="reorder-print-area" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        
        {/* Print Only Header */}
        <div className="hidden print:block p-6 border-b border-black text-black">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold uppercase tracking-wider">FORMULIR PERMINTAAN PEMBELIAN BARANG (PURCHASE REQUISITION)</h1>
            <p className="text-xs text-gray-600">Departemen Logistik, Gudang & Maintenance Alat Berat</p>
            <p className="text-xs font-mono">Tanggal Cetak: {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 print:text-black print:bg-gray-100">
              <tr>
                <th className="py-3 px-3">No</th>
                <th className="py-3 px-3">Kode & Lokasi</th>
                <th className="py-3 px-3">Part Number & Nama Barang</th>
                <th className="py-3 px-3">Model Unit</th>
                <th className="py-3 px-3 text-center">Stok Saat Ini</th>
                <th className="py-3 px-3 text-center">Min / Max</th>
                <th className="py-3 px-3 text-center font-bold text-amber-400 print:text-black">Rekomendasi Order</th>
                <th className="py-3 px-3 text-right">Estimasi Biaya</th>
                <th className="py-3 px-3">Vendor Rekomendasi</th>
                <th className="py-3 px-3 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 print:divide-black font-sans text-slate-200 print:text-black">
              {orderList.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                    Semua stok aman! Tidak ada item yang berada di bawah level minimum stok saat ini.
                  </td>
                </tr>
              ) : (
                orderList.map((item, index) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-slate-400 print:text-black">{index + 1}</td>
                    
                    {/* Item Code & Rak */}
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-sky-400 print:text-black">{item.itemCode}</span>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-400 print:hidden" />
                        <span>Rak: {item.rack}</span>
                      </div>
                    </td>

                    {/* Part Number & Name */}
                    <td className="py-2.5 px-3 max-w-[240px]">
                      <div 
                        onClick={() => onSelectItem(item)}
                        className="font-medium hover:text-amber-400 cursor-pointer truncate"
                      >
                        {item.partName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        P/N: {item.partNumber}
                      </div>
                    </td>

                    {/* Model Unit */}
                    <td className="py-2.5 px-3 text-slate-300 print:text-black">
                      {item.modelUnit}
                    </td>

                    {/* Current Stock */}
                    <td className="py-2.5 px-3 text-center">
                      <span className={`font-mono font-bold ${item.currentQty <= 0 ? 'text-rose-400 font-extrabold' : 'text-amber-400'}`}>
                        {item.currentQty} {item.uom}
                      </span>
                    </td>

                    {/* Min / Max */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-400 print:text-black text-[11px]">
                      {item.minStock} / {item.maxStock}
                    </td>

                    {/* Suggested Order */}
                    <td className="py-2.5 px-3 text-center">
                      <span className="font-mono font-bold text-sm text-amber-400 print:text-black px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30">
                        {item.suggestedOrder} {item.uom}
                      </span>
                    </td>

                    {/* Estimated Cost */}
                    <td className="py-2.5 px-3 text-right font-mono">
                      <div className="font-semibold text-slate-200 print:text-black">
                        {formatRupiah(item.estimatedCost)}
                      </div>
                      <div className="text-[10px] text-slate-400 print:text-gray-600">
                        @{formatRupiah(item.price)}
                      </div>
                    </td>

                    {/* Vendor */}
                    <td className="py-2.5 px-3 text-slate-300 print:text-black text-xs truncate max-w-[140px]">
                      {item.supplier || item.brand || '-'}
                    </td>

                    {/* Quick IN Action */}
                    <td className="py-2.5 px-3 text-center print:hidden">
                      <button
                        onClick={() => onQuickIn(item)}
                        title="Catat Kedatangan Barang (IN)"
                        className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-[11px] inline-flex items-center gap-1 shadow-sm"
                      >
                        <ArrowDownLeft className="w-3 h-3" /> Terima
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Print Signature Footer */}
        <div className="hidden print:block p-8 pt-16 text-black text-xs border-t border-black">
          <div className="grid grid-cols-3 text-center">
            <div>
              <p>Diajukan Oleh (Gudang):</p>
              <div className="h-16"></div>
              <p>( ................................ )</p>
              <p className="text-[10px] text-gray-500">Warehouse Staff / Logistic</p>
            </div>
            <div>
              <p>Diperiksa Oleh (Spv Maintenance):</p>
              <div className="h-16"></div>
              <p>( ................................ )</p>
              <p className="text-[10px] text-gray-500">Maintenance Supervisor</p>
            </div>
            <div>
              <p>Disetujui Oleh (Project Manager):</p>
              <div className="h-16"></div>
              <p>( ................................ )</p>
              <p className="text-[10px] text-gray-500">Project Manager / Procurement</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
