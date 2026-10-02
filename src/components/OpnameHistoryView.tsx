import React from 'react';
import { ClipboardCheck, Plus, CheckCircle2, AlertTriangle, Calendar, User } from 'lucide-react';
import { StockOpnameRecord } from '../types/warehouse';

interface OpnameHistoryViewProps {
  records: StockOpnameRecord[];
  onOpenAuditModal: () => void;
}

export const OpnameHistoryView: React.FC<OpnameHistoryViewProps> = ({
  records,
  onOpenAuditModal,
}) => {
  const discrepancyItems = records.filter(r => r.discrepancy !== 0);

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ClipboardCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Riwayat Audit Fisik & Stock Opname
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {records.length} Audit
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Pencatatan kepatuhan fisik inventaris dan penyesuaian selisih buku vs lapangan
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenAuditModal}
          className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" /> Mulai Audit Barang Baru
        </button>
      </div>

      {/* Audit Log Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">Tanggal & ID</th>
                <th className="py-3 px-3">Kode & Nama Suku Cadang</th>
                <th className="py-3 px-3">Lokasi Rak</th>
                <th className="py-3 px-3 text-center">Stok Sistem</th>
                <th className="py-3 px-3 text-center">Hasil Fisik</th>
                <th className="py-3 px-3 text-center">Selisih</th>
                <th className="py-3 px-3">Auditor / Petugas</th>
                <th className="py-3 px-3">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-sans text-slate-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Belum ada riwayat stock opname yang tercatat. Klik tombol "Mulai Audit Barang Baru" di atas untuk melakukan stock opname fisik.
                  </td>
                </tr>
              ) : (
                records.map(record => (
                  <tr key={record.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-mono text-slate-400 text-xs">{record.id}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" /> {record.date}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-sky-400">{record.itemCode}</div>
                      <div className="text-slate-200 font-medium truncate max-w-[200px]">{record.partName}</div>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">
                      {record.rack}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-medium text-slate-300">
                      {record.systemQty}
                    </td>

                    <td className="py-3 px-3 text-center font-mono font-bold text-white">
                      {record.physicalQty}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold font-mono inline-block ${
                        record.discrepancy === 0
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : record.discrepancy > 0
                          ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {record.discrepancy > 0 ? `+${record.discrepancy}` : record.discrepancy}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <span className="flex items-center gap-1 text-slate-300 text-xs">
                        <User className="w-3 h-3 text-slate-400" /> {record.auditor}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-slate-400 text-xs max-w-[220px] truncate">
                      {record.notes || '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
