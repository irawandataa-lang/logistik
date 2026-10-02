import * as XLSX from 'xlsx';
import { InventoryItem, ItemType, MovementStatus, StockRemark } from '../types/warehouse';
import { parseRupiah } from './csvParser';

export function parseExcelFile(data: ArrayBuffer): InventoryItem[] {
  const workbook = XLSX.read(data, { type: 'array' });
  if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
    return [];
  }

  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (!rows || rows.length < 2) {
    return [];
  }

  // Find header row (usually row 0 or row 1)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const rowStr = rows[i].map((c: any) => String(c).toLowerCase()).join(' ');
    if (rowStr.includes('item') || rowStr.includes('part') || rowStr.includes('rak')) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = rows[headerRowIndex].map((h: any) => String(h).trim().toLowerCase());
  
  // Find column indices
  const findCol = (terms: string[]): number => {
    return headers.findIndex(h => terms.some(t => h === t || h.includes(t)));
  };

  const colItemCode = findCol(['item code', 'kode item', 'item']);
  const colRak = findCol(['rak', 'lokasi', 'bin']);
  const colType = findCol(['type', 'tipe', 'kategori']);
  const colModel = findCol(['model unit', 'model', 'armada']);
  const colPartNum = findCol(['part number', 'part no', 'p/n', 'nomor part']);
  const colPartName = findCol(['part name', 'nama part', 'nama barang', 'deskripsi']);
  const colCodeUnit = findCol(['code unit', 'unit code', 'kode unit']);
  const colSupplier = findCol(['supplier', 'vendor']);
  const colBrand = findCol(['brand', 'merk', 'merek']);
  const colAwal = findCol(['awal qty', 'stok awal', 'awal']);
  const colUom = findCol(['uom', 'satuan']);
  const colIn = findCol(['in qty', 'masuk', 'in']);
  const colOut = findCol(['out qty', 'keluar', 'out']);
  const colAkhir = findCol(['akhir qty', 'stok akhir', 'akhir', 'stok fisik', 'current']);
  const colMin = findCol(['min', 'safety min', 'minimum']);
  const colMax = findCol(['max', 'safety max', 'maksimum']);
  const colRemark = findCol(['remark', 'status stok', 'keterangan']);
  const colMovement = findCol(['movement', 'perputaran', 'status 1th']);
  const colPrice = findCol(['price', 'harga', 'harga satuan']);
  const colTotal = findCol(['total', 'total value', 'nilai']);

  const items: InventoryItem[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0 || row.every((c: any) => c === '' || c === null || c === undefined)) {
      continue;
    }

    const itemCode = String(row[colItemCode !== -1 ? colItemCode : 1] || `DPS-${i}`).trim();
    const partName = String(row[colPartName !== -1 ? colPartName : 6] || '').trim();
    if (!itemCode && !partName) continue;

    const rawRak = String(row[colRak !== -1 ? colRak : 2] || 'Unassigned').trim();
    // Normalize scientific notation in rack if any
    let rack = rawRak;
    const sciMatch = rawRak.match(/^1\.(\d{2})E\+(\d{2})$/i);
    if (sciMatch) {
      rack = `1${sciMatch[1]}E${parseInt(sciMatch[2], 10).toString().padStart(2, '0')}`;
    }

    const rawType = String(row[colType !== -1 ? colType : 3] || 'SPT').trim().toUpperCase();
    let type: ItemType = 'SPT';
    if (rawType.includes('CNU') || rawType.includes('CONSUMABLE')) type = 'CNU';
    else if (rawType.includes('LIB') || rawType.includes('LUBRICANT') || rawType.includes('PELUMAS')) type = 'LIB';

    const modelUnit = String(row[colModel !== -1 ? colModel : 4] || '-').trim();
    const partNumber = String(row[colPartNum !== -1 ? colPartNum : 5] || '-').trim();
    const unitCode = String(row[colCodeUnit !== -1 ? colCodeUnit : 7] || '-').trim();
    const supplier = String(row[colSupplier !== -1 ? colSupplier : 11] || '-').trim();
    const brand = String(row[colBrand !== -1 ? colBrand : 12] || '-').trim();
    const uom = String(row[colUom !== -1 ? colUom : 14] || 'Pcs').trim();

    const parseNum = (val: any): number => {
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      return parseRupiah(String(val || '0'));
    };

    const initialQty = parseNum(row[colAwal !== -1 ? colAwal : 13]);
    const inQty = parseNum(row[colIn !== -1 ? colIn : 15]);
    const outQty = parseNum(row[colOut !== -1 ? colOut : 17]);
    
    let currentQty = colAkhir !== -1 ? parseNum(row[colAkhir]) : 0;
    if (currentQty === 0 && (initialQty > 0 || inQty > 0 || outQty > 0)) {
      currentQty = initialQty + inQty - outQty;
    }

    const minStock = colMin !== -1 ? parseNum(row[colMin]) : 2;
    const maxStock = colMax !== -1 ? parseNum(row[colMax]) : 10;
    const price = colPrice !== -1 ? parseNum(row[colPrice]) : 0;
    const totalValue = colTotal !== -1 && parseNum(row[colTotal]) > 0 ? parseNum(row[colTotal]) : (currentQty > 0 ? currentQty * price : 0);

    // Compute remark
    let remark: StockRemark = 'AMAN';
    const rawRemark = colRemark !== -1 ? String(row[colRemark]).toUpperCase() : '';
    if (rawRemark.includes('HABIS') || currentQty <= 0) {
      remark = 'HABIS';
    } else if (rawRemark.includes('ORDER') || (minStock > 0 && currentQty <= minStock)) {
      remark = 'ORDER';
    } else if (rawRemark.includes('OVER') || (maxStock > 0 && currentQty > maxStock)) {
      remark = 'OVER';
    }

    // Movement
    let movement: MovementStatus = 'Fast Moving';
    const rawMv = colMovement !== -1 ? String(row[colMovement]) : '';
    if (rawMv.includes('Slow')) movement = 'Slow Moving';
    else if (rawMv.includes('Dead')) movement = 'Dead Moving';
    else if (rawMv.includes('Warning')) movement = 'Warning';

    items.push({
      id: `${itemCode}-${i}-${Date.now()}`,
      no: i,
      itemCode,
      rack,
      type,
      modelUnit,
      partNumber,
      partName: partName || itemCode,
      unitCode,
      lastUpdateDate: today,
      lastInDate: today,
      lastOutDate: '',
      supplier,
      brand,
      initialQty,
      uom,
      inQty,
      adjustPlusQty: 0,
      outQty,
      adjustMinusQty: 0,
      currentQty,
      minStock,
      maxStock,
      remark,
      movement,
      price,
      totalValue,
      status1th: movement,
    });
  }

  return items;
}

export function exportInventoryToExcel(items: InventoryItem[], fileName: string = 'inventaris-gudang.xlsx'): void {
  const data = items.map((item, index) => ({
    'No': index + 1,
    'Item Code': item.itemCode,
    'Rak': item.rack,
    'Tipe': item.type,
    'Model Unit': item.modelUnit,
    'Part Number': item.partNumber,
    'Nama Part': item.partName,
    'Unit Code': item.unitCode,
    'Supplier': item.supplier,
    'Brand': item.brand,
    'Stok Awal': item.initialQty,
    'Satuan (UOM)': item.uom,
    'Stok Masuk': item.inQty,
    'Stok Keluar': item.outQty,
    'Stok Akhir': item.currentQty,
    'Safety Min': item.minStock,
    'Safety Max': item.maxStock,
    'Status Stok': item.remark,
    'Perputaran': item.movement,
    'Harga Satuan (IDR)': item.price,
    'Total Nilai Aset (IDR)': item.totalValue,
    'Update Terakhir': item.lastUpdateDate || '',
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventaris Gudang');
  XLSX.writeFile(workbook, fileName);
}

export function downloadExcelTemplate(): void {
  const sampleData = [
    {
      'No': 1,
      'Item Code': 'DPS-1001',
      'Rak': '101A01',
      'Tipe': 'SPT',
      'Model Unit': 'Komatsu PC 200-8',
      'Part Number': '600-185-4100',
      'Nama Part': 'Air Cleaner Outer Element',
      'Unit Code': 'A2B',
      'Supplier': 'United Tractor',
      'Brand': 'KOMATSU GENUINE PARTS',
      'Stok Awal': 10,
      'Satuan (UOM)': 'Pcs',
      'Stok Masuk': 0,
      'Stok Keluar': 0,
      'Stok Akhir': 10,
      'Safety Min': 2,
      'Safety Max': 8,
      'Status Stok': 'AMAN',
      'Perputaran': 'Fast Moving',
      'Harga Satuan (IDR)': 450000,
      'Total Nilai Aset (IDR)': 4500000,
    },
    {
      'No': 2,
      'Item Code': 'DPS-1002',
      'Rak': '102B05',
      'Tipe': 'CNU',
      'Model Unit': 'General',
      'Part Number': 'ZMME-FST-0012',
      'Nama Part': 'Bolt Baja M12x60 Grade 8.8',
      'Unit Code': 'General',
      'Supplier': 'Jaya Putra Mandiri',
      'Brand': 'Baut Standard',
      'Stok Awal': 50,
      'Satuan (UOM)': 'Pcs',
      'Stok Masuk': 0,
      'Stok Keluar': 0,
      'Stok Akhir': 50,
      'Safety Min': 20,
      'Safety Max': 60,
      'Status Stok': 'AMAN',
      'Perputaran': 'Fast Moving',
      'Harga Satuan (IDR)': 15000,
      'Total Nilai Aset (IDR)': 750000,
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Suku Cadang');
  XLSX.writeFile(workbook, 'template-inventaris-gudang.xlsx');
}
