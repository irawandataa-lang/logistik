import React, { useState } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  SlidersHorizontal, 
  Search, 
  Calendar, 
  FileText, 
  Printer, 
  Tag 
} from 'lucide-react';
import { StockTransaction } from '../types/warehouse';

interface TransactionsViewProps {
  transactions: StockTransaction[];
  onNewTransaction: (type: 'IN' | 'OUT') => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  transactions,
  onNewTransaction,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'IN' | 'OUT' | 'ADJUSTMENT'>('ALL');
  const [selectedTrx, setSelectedTrx] = useState<StockTransaction | null>(null);

  const filtered = transactions.filter(t => {
    if (typeFilter !== 'ALL') {
      if (typeFilter === 'IN' && t.type !== 'IN') return false;
      if (typeFilter === 'OUT' && t.type !== 'OUT') return false;
      if (typeFilter === 'ADJUSTMENT' && !t.type.startsWith('ADJUSTMENT')) return false;
    }

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const match = 
        t.itemCode.toLowerCase().includes(q) ||
        t.partName.toLowerCase().includes(q) ||
        t.partNumber.toLowerCase().includes(q) ||
        (t.referenceNo && t.referenceNo.toLowerCase().includes(q)) ||
        (t.unitTarget && t.unitTarget.toLowerCase().includes(q)) ||
        (t.recipientOrSupplier && t.recipientOrSupplier.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  const handlePrintSlip = (trx: StockTransaction) => {
    setSelectedTrx(trx);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  return (
    <div className="space-y-4">
      
      {/* Action and Filter Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari transaksi berdasarkan No. Dokumen, Kode Part, Nama, Unit Target..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <button
            onClick={() => setTypeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
              typeFilter === 'ALL' ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('IN')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              typeFilter === 'IN' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> Masuk (IN)
          </button>
          <button
            onClick={() => setTypeFilter('OUT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              typeFilter === 'OUT' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-slate-700'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> Keluar (OUT)
          </button>
          <button
            onClick={() => setTypeFilter('ADJUSTMENT')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              typeFilter === 'ADJUSTMENT' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-indigo-400 hover:bg-slate-700'
            }`}
          >
            Penyesuaian
          </button>
        </div>

        {/* Quick Add Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNewTransaction('IN')}
            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow flex items-center gap-1"
          >
            <ArrowDownLeft className="w-3.5 h-3.5" /> + IN
          </button>
          <button
            onClick={() => onNewTransaction('OUT')}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow flex items-center gap-1"
          >
            <ArrowUpRight className="w-3.5 h-3.5" /> - OUT
          </button>
        </div>

      </div>

      {/* Transactions Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Waktu & Tipe</th>
                <th className="py-3 px-3">Kode & Nama Suku Cadang</th>
                <th className="py-3 px-3">No. Dokumen / Ref</th>
                <th className="py-3 px-3">Unit / Tujuan / Vendor</th>
                <th className="py-3 px-3 text-center">Mutasi Qty</th>
                <th className="py-3 px-3 text-center">Perubahan Stok</th>
                <th className="py-3 px-3">Keterangan</th>
                <th className="py-3 px-3 text-center">Cetak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Belum ada riwayat mutasi transaksi tercatat.
                  </td>
                </tr>
              ) : (
                filtered.map(trx => {
                  const isEntry = trx.type === 'IN' || trx.type === 'ADJUSTMENT_PLUS';
                  return (
                    <tr key={trx.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Date & Type */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`p-1 rounded ${
                            trx.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' :
                            trx.type === 'OUT' ? 'bg-rose-500/20 text-rose-400' :
                            'bg-indigo-500/20 text-indigo-400'
                          }`}>
                            {isEntry ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                          </span>
                          <div>
                            <span className="font-semibold text-slate-200 block">{trx.type}</span>
                            <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                              <Calendar className="w-2.5 h-2.5" /> {trx.date}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Item */}
                      <td className="py-3 px-3 max-w-[240px]">
                        <div className="font-mono font-bold text-sky-400 text-xs">
                          {trx.itemCode}
                        </div>
                        <div className="text-slate-200 truncate font-medium">
                          {trx.partName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          P/N: {trx.partNumber} • Rak: {trx.rack}
                        </div>
                      </td>

                      {/* Reference No */}
                      <td className="py-3 px-3 font-mono text-slate-300">
                        {trx.referenceNo || '-'}
                      </td>

                      {/* Target Unit or Vendor */}
                      <td className="py-3 px-3">
                        {trx.unitTarget && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-medium block w-fit mb-0.5">
                            {trx.unitTarget}
                          </span>
                        )}
                        <span className="text-[11px] text-slate-400">
                          {trx.recipientOrSupplier || '-'}
                        </span>
                      </td>

                      {/* Qty Mutation */}
                      <td className="py-3 px-3 text-center">
                        <span className={`text-sm font-extrabold font-mono ${
                          isEntry ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {isEntry ? '+' : '-'}{trx.quantity}
                        </span>
                      </td>

                      {/* Stock Change (Prev -> Next) */}
                      <td className="py-3 px-3 text-center font-mono text-xs text-slate-300">
                        <span>{trx.previousQty}</span> &rarr; <strong className="text-white">{trx.newQty}</strong>
                      </td>

                      {/* Notes */}
                      <td className="py-3 px-3 text-slate-400 text-[11px] max-w-[180px] truncate">
                        {trx.notes || '-'}
                      </td>

                      {/* Print Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          onClick={() => handlePrintSlip(trx)}
                          title="Cetak Bukti Transaksi"
                          className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Slip Preview (Hidden on screen unless printing) */}
      {selectedTrx && (
        <div id="printable-slip" className="hidden print:block fixed inset-0 bg-white text-black p-8 font-sans">
          <div className="border border-black p-6 max-w-2xl mx-auto space-y-4">
            <div className="text-center border-b pb-3">
              <h2 className="text-xl font-bold uppercase">
                {selectedTrx.type === 'IN' ? 'BUKTI PENERIMAAN BARANG (GOODS RECEIPT SLIP)' : 'SURAT PENGELUARAN BARANG (GOODS ISSUE SLIP)'}
              </h2>
              <p className="text-xs text-gray-600">Departemen Logistik & Manajemen Gudang Sparepart</p>
            </div>

            <div className="grid grid-cols-2 text-xs gap-2 py-2">
              <div><strong>No. Transaksi:</strong> {selectedTrx.id}</div>
              <div><strong>Tanggal:</strong> {selectedTrx.date}</div>
              <div><strong>No. Referensi / WO:</strong> {selectedTrx.referenceNo || '-'}</div>
              <div><strong>Unit / Vendor:</strong> {selectedTrx.unitTarget || selectedTrx.recipientOrSupplier || '-'}</div>
              <div><strong>Lokasi Rak:</strong> {selectedTrx.rack}</div>
              <div><strong>Operator:</strong> {selectedTrx.user || 'Staff Gudang'}</div>
            </div>

            <table className="w-full border-collapse border border-black text-xs mt-3">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-black p-1.5 text-left">Kode Item</th>
                  <th className="border border-black p-1.5 text-left">Part Number</th>
                  <th className="border border-black p-1.5 text-left">Nama Part</th>
                  <th className="border border-black p-1.5 text-center">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-black p-2">{selectedTrx.itemCode}</td>
                  <td className="border border-black p-2">{selectedTrx.partNumber}</td>
                  <td className="border border-black p-2">{selectedTrx.partName}</td>
                  <td className="border border-black p-2 text-center font-bold">{selectedTrx.quantity}</td>
                </tr>
              </tbody>
            </table>

            <div className="text-xs italic pt-2">
              <strong>Catatan:</strong> {selectedTrx.notes || 'Tidak ada catatan'}
            </div>

            <div className="grid grid-cols-3 text-center text-xs pt-12">
              <div>
                <p>Diserahkan Oleh,</p>
                <div className="h-14"></div>
                <p>( ........................... )</p>
              </div>
              <div>
                <p>Mengetahui (Supervisor),</p>
                <div className="h-14"></div>
                <p>( ........................... )</p>
              </div>
              <div>
                <p>Diterima Oleh,</p>
                <div className="h-14"></div>
                <p>( ........................... )</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
