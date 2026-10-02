import { InventoryItem, StockTransaction, StockOpnameRecord, StockRemark } from '../types/warehouse';
import { parseWarehouseCsv } from '../utils/csvParser';

const STORAGE_KEYS = {
  ITEMS: 'wms_offline_items_v1',
  TRANSACTIONS: 'wms_offline_transactions_v1',
  OPNAME: 'wms_offline_opname_v1',
  LAST_SYNC: 'wms_offline_last_sync_v1',
};

import { generate3000Items } from '../data/seedGenerator';

export class WarehouseStorage {
  private static instance: WarehouseStorage;

  private constructor() {}

  public static getInstance(): WarehouseStorage {
    if (!WarehouseStorage.instance) {
      WarehouseStorage.instance = new WarehouseStorage();
    }
    return WarehouseStorage.instance;
  }

  public async getItems(): Promise<InventoryItem[]> {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length >= 3000) {
          return parsed;
        } else if (Array.isArray(parsed) && parsed.length > 0) {
          // If fewer than 3000 items, expand to 3000 items
          const expanded = generate3000Items(parsed);
          this.saveItems(expanded);
          return expanded;
        }
      } catch (e) {
        console.error('Failed to parse cached items', e);
      }
    }

    // Load from CSV seed file and expand to 3000 items
    try {
      const res = await fetch('/warehouse_data.csv');
      if (res.ok) {
        const csvText = await res.text();
        const baseItems = parseWarehouseCsv(csvText);
        const full3000Items = generate3000Items(baseItems);
        this.saveItems(full3000Items);
        return full3000Items;
      }
    } catch (e) {
      console.error('Failed to fetch seed csv', e);
    }

    const fallback = generate3000Items([]);
    this.saveItems(fallback);
    return fallback;
  }

  public saveItems(items: InventoryItem[]): void {
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(items));
    localStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString());
  }

  public updateItem(updated: InventoryItem): void {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) return;
    const items: InventoryItem[] = JSON.parse(raw);
    const index = items.findIndex(i => i.id === updated.id);
    if (index !== -1) {
      items[index] = updated;
      this.saveItems(items);
    }
  }

  public addItem(item: InventoryItem): void {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    const items: InventoryItem[] = raw ? JSON.parse(raw) : [];
    items.unshift(item);
    this.saveItems(items);
  }

  public deleteItem(id: string): void {
    const raw = localStorage.getItem(STORAGE_KEYS.ITEMS);
    if (!raw) return;
    const items: InventoryItem[] = JSON.parse(raw);
    const filtered = items.filter(i => i.id !== id);
    this.saveItems(filtered);
  }

  public getTransactions(): StockTransaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public recordTransaction(trxData: Omit<StockTransaction, 'id'>): StockTransaction {
    const rawItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
    const items: InventoryItem[] = rawItems ? JSON.parse(rawItems) : [];
    const itemIndex = items.findIndex(i => i.id === trxData.itemId);

    const newTrx: StockTransaction = {
      ...trxData,
      id: 'TRX-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    };

    if (itemIndex !== -1) {
      const item = items[itemIndex];
      const prev = item.currentQty;
      let next = prev;

      if (trxData.type === 'IN') {
        next = prev + trxData.quantity;
        item.inQty = (item.inQty || 0) + trxData.quantity;
        item.lastInDate = trxData.date;
      } else if (trxData.type === 'OUT') {
        next = prev - trxData.quantity;
        item.outQty = (item.outQty || 0) + trxData.quantity;
        item.lastOutDate = trxData.date;
      } else if (trxData.type === 'ADJUSTMENT_PLUS') {
        next = prev + trxData.quantity;
        item.adjustPlusQty = (item.adjustPlusQty || 0) + trxData.quantity;
      } else if (trxData.type === 'ADJUSTMENT_MINUS') {
        next = prev - trxData.quantity;
        item.adjustMinusQty = (item.adjustMinusQty || 0) + trxData.quantity;
      }

      item.currentQty = next;
      item.lastUpdateDate = trxData.date;
      item.totalValue = next > 0 ? next * item.price : 0;

      // Recalculate remark
      let remark: StockRemark = 'AMAN';
      if (next <= 0) {
        remark = 'HABIS';
      } else if (item.minStock > 0 && next <= item.minStock) {
        remark = 'ORDER';
      } else if (item.maxStock > 0 && next > item.maxStock) {
        remark = 'OVER';
      }
      item.remark = remark;

      items[itemIndex] = item;
      this.saveItems(items);

      newTrx.previousQty = prev;
      newTrx.newQty = next;
    }

    const trxs = this.getTransactions();
    trxs.unshift(newTrx);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(trxs));

    return newTrx;
  }

  public getOpnameRecords(): StockOpnameRecord[] {
    const raw = localStorage.getItem(STORAGE_KEYS.OPNAME);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  public saveOpnameRecord(record: StockOpnameRecord): void {
    const list = this.getOpnameRecords();
    list.unshift(record);
    localStorage.setItem(STORAGE_KEYS.OPNAME, JSON.stringify(list));
  }

  public exportBackupJson(): string {
    const data = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      items: JSON.parse(localStorage.getItem(STORAGE_KEYS.ITEMS) || '[]'),
      transactions: JSON.parse(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS) || '[]'),
      opname: JSON.parse(localStorage.getItem(STORAGE_KEYS.OPNAME) || '[]'),
    };
    return JSON.stringify(data, null, 2);
  }

  public importBackupJson(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.items && Array.isArray(data.items)) {
        this.saveItems(data.items);
        if (data.transactions) {
          localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
        }
        if (data.opname) {
          localStorage.setItem(STORAGE_KEYS.OPNAME, JSON.stringify(data.opname));
        }
        return true;
      }
      return false;
    } catch (e) {
      console.error('Import error', e);
      return false;
    }
  }

  public async resetToSeed(): Promise<InventoryItem[]> {
    localStorage.removeItem(STORAGE_KEYS.ITEMS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.OPNAME);
    return await this.getItems();
  }
}

export const warehouseStorage = WarehouseStorage.getInstance();
