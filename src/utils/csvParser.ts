import { InventoryItem, ItemType, MovementStatus, StockRemark } from '../types/warehouse';

export function parseRupiah(str?: string): number {
  if (!str) return 0;
  // Handle formats like "Rp32,500", "-Rp174,000", "75000", "Rp1,280,000", "Rp615,000.00"
  const clean = str.replace(/[Rp\s.]/g, '').replace(/,/g, '');
  const val = parseFloat(clean);
  return isNaN(val) ? 0 : val;
}

export function formatRupiah(val: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(val);
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseWarehouseCsv(csvText: string): InventoryItem[] {
  const lines = csvText.split('\n');
  const items: InventoryItem[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    
    // Skip legend lines and header lines
    if (line.includes('CNU =') || line.includes('SPT =') || line.includes('PS =')) continue;
    if (line.startsWith(',Code,Code') || line.startsWith('No,Item,Rak')) continue;
    
    const cols = parseCsvLine(line);
    if (cols.length < 10) continue;
    
    // Check if first col is a valid number
    const no = parseInt(cols[0], 10);
    if (isNaN(no)) continue;

    const itemCode = cols[1] || `DPS-${no}`;
    const rack = cols[2] || 'Unassigned';
    const type = (cols[3] || 'SPT') as ItemType;
    const modelUnit = cols[4] || '-';
    const partNumber = cols[5] || '-';
    const partName = cols[6] || 'Item ' + itemCode;
    const unitCode = cols[7] || 'General';
    const lastUpdateDate = cols[8] || '';
    const lastInDate = cols[9] || '';
    const lastOutDate = cols[10] || '';
    const supplier = cols[11] || '-';
    const brand = cols[12] || '-';
    const initialQty = parseFloat(cols[13]) || 0;
    const uom = cols[14] || 'Pcs';
    const inQty = parseFloat(cols[15]) || 0;
    const adjustPlusQty = parseFloat(cols[16]) || 0;
    const outQty = parseFloat(cols[17]) || 0;
    const adjustMinusQty = parseFloat(cols[18]) || 0;
    const currentQty = parseFloat(cols[19]) || (initialQty + inQty + adjustPlusQty - outQty - adjustMinusQty);
    const minStock = parseFloat(cols[21]) || 0;
    const maxStock = parseFloat(cols[22]) || 0;
    const remarkCol = cols[23] || '';
    const movementCol = cols[24] || '';
    const priceCol = cols[25] || '';
    const statusCol = cols[cols.length - 1] || 'Normal';

    const price = parseRupiah(priceCol);
    const totalValue = currentQty > 0 ? currentQty * price : 0;

    let remark: StockRemark = 'AMAN';
    if (currentQty <= 0) {
      remark = 'HABIS';
    } else if (minStock > 0 && currentQty <= minStock) {
      remark = 'ORDER';
    } else if (maxStock > 0 && currentQty > maxStock) {
      remark = 'OVER';
    } else if (remarkCol.toUpperCase().includes('ORDER')) {
      remark = 'ORDER';
    }

    let movement: MovementStatus = 'Normal';
    if (movementCol.toLowerCase().includes('fast') || statusCol.toLowerCase().includes('fast')) {
      movement = 'Fast Moving';
    } else if (movementCol.toLowerCase().includes('slow') || statusCol.toLowerCase().includes('slow')) {
      movement = 'Slow Moving';
    } else if (movementCol.toLowerCase().includes('dead') || statusCol.toLowerCase().includes('dead')) {
      movement = 'Dead Moving';
    } else if (movementCol.toLowerCase().includes('warn') || statusCol.toLowerCase().includes('warn')) {
      movement = 'Warning';
    }

    items.push({
      id: `${itemCode}-${no}`,
      no,
      itemCode,
      rack,
      type,
      modelUnit,
      partNumber,
      partName,
      unitCode,
      lastUpdateDate,
      lastInDate,
      lastOutDate,
      supplier,
      brand,
      initialQty,
      uom,
      inQty,
      adjustPlusQty,
      outQty,
      adjustMinusQty,
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
