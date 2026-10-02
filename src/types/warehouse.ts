export type ItemType = 'CNU' | 'SPT' | 'LIB' | 'PS' | 'OTHER';

export type MovementStatus = 'Fast Moving' | 'Slow Moving' | 'Dead Moving' | 'Warning' | 'Normal';

export type StockRemark = 'ORDER' | 'OVER' | 'AMAN' | 'HABIS' | 'KRITIS';

export interface InventoryItem {
  id: string; // e.g. DPS-2105 or unique generated id
  no: number;
  itemCode: string; // DPS-2105
  rack: string; // 101A01, Container WHS Baru, etc.
  type: ItemType;
  modelUnit: string; // POMPA, D85ESS, Hino 260 JD, etc.
  partNumber: string; // ZMME-0000203
  partName: string; // Karet Kopling F3
  unitCode: string; // Tools, DT /LVM, A2B, General, etc.
  lastUpdateDate: string;
  lastInDate: string;
  lastOutDate: string;
  supplier: string;
  brand: string;
  initialQty: number;
  uom: string; // Pcs, Set, Mtr, Kg, Buku, etc.
  inQty: number;
  adjustPlusQty: number;
  outQty: number;
  adjustMinusQty: number;
  currentQty: number; // Akhir Qty
  minStock: number;
  maxStock: number;
  remark: StockRemark;
  movement: MovementStatus;
  price: number; // in IDR numeric
  totalValue: number; // currentQty * price
  status1th: MovementStatus;
  notes?: string;
}

export type TransactionType = 'IN' | 'OUT' | 'ADJUSTMENT_PLUS' | 'ADJUSTMENT_MINUS' | 'OPNAME';

export interface StockTransaction {
  id: string;
  itemId: string;
  itemCode: string;
  partNumber: string;
  partName: string;
  rack: string;
  type: TransactionType;
  quantity: number;
  previousQty: number;
  newQty: number;
  date: string;
  referenceNo?: string; // Surat Jalan, PO, WO, SPK
  unitTarget?: string; // e.g. DT-102, EX-401, Genset-01
  recipientOrSupplier?: string; // Mekanik / Supplier
  notes?: string;
  user?: string;
}

export interface StockOpnameRecord {
  id: string;
  itemId: string;
  itemCode: string;
  partName: string;
  rack: string;
  systemQty: number;
  physicalQty: number;
  discrepancy: number; // physical - system
  date: string;
  auditor: string;
  notes: string;
  adjusted: boolean;
}
