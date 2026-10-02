/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { TransactionsView } from './components/TransactionsView';
import { RackMapView } from './components/RackMapView';
import { ReorderView } from './components/ReorderView';
import { OpnameHistoryView } from './components/OpnameHistoryView';
import { TransactionModal } from './components/TransactionModal';
import { StockOpnameModal } from './components/StockOpnameModal';
import { ItemDetailModal } from './components/ItemDetailModal';
import { AddItemModal } from './components/AddItemModal';
import { ExcelImportModal } from './components/ExcelImportModal';
import { warehouseStorage } from './services/storage';
import { InventoryItem, StockTransaction, StockOpnameRecord, TransactionType } from './types/warehouse';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [opnameRecords, setOpnameRecords] = useState<StockOpnameRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Active view tab
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [inventoryFilter, setInventoryFilter] = useState<{ type?: string; value?: string } | undefined>();

  // Modals state
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<TransactionType>('IN');
  const [selectedItemForTrx, setSelectedItemForTrx] = useState<InventoryItem | null>(null);

  const [isOpnameModalOpen, setIsOpnameModalOpen] = useState(false);
  
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<InventoryItem | null>(null);
  
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<InventoryItem | null>(null);

  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);

  // Load data from offline storage / initial seed
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const loadedItems = await warehouseStorage.getItems();
      setItems(loadedItems);
      setTransactions(warehouseStorage.getTransactions());
      setOpnameRecords(warehouseStorage.getOpnameRecords());
    } catch (err) {
      console.error('Error loading inventory data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Modal open helpers
  const handleOpenInModal = (item?: InventoryItem) => {
    setTransactionType('IN');
    setSelectedItemForTrx(item || null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenOutModal = (item?: InventoryItem) => {
    setTransactionType('OUT');
    setSelectedItemForTrx(item || null);
    setIsTransactionModalOpen(true);
  };

  const handleOpenOpnameModal = () => {
    setIsOpnameModalOpen(true);
  };

  const handleSelectItem = (item: InventoryItem) => {
    setSelectedItemForDetail(item);
  };

  const handleEditItem = (item: InventoryItem) => {
    setItemToEdit(item);
    setIsAddItemModalOpen(true);
  };

  const handleAddNewItem = () => {
    setItemToEdit(null);
    setIsAddItemModalOpen(true);
  };

  const handleDeleteItem = (id: string) => {
    warehouseStorage.deleteItem(id);
    loadData();
  };

  const handleBatchDelete = (ids: string[]) => {
    ids.forEach(id => warehouseStorage.deleteItem(id));
    loadData();
    alert(`Berhasil menghapus ${ids.length} item dari katalog gudang.`);
  };

  const handleTabSwitchWithFilter = (tab: string, filterType?: string, filterValue?: string) => {
    if (filterType && filterValue) {
      setInventoryFilter({ type: filterType, value: filterValue });
    } else {
      setInventoryFilter(undefined);
    }
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      
      {/* Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setInventoryFilter(undefined);
          setActiveTab(tab);
        }}
        onOpenInModal={() => handleOpenInModal()}
        onOpenOutModal={() => handleOpenOutModal()}
        onOpenOpnameModal={handleOpenOpnameModal}
        onOpenImportExcelModal={() => setIsExcelImportModalOpen(true)}
        items={items}
        onDataReload={loadData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-sm font-medium">Memuat basis data gudang offline...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <DashboardView
                items={items}
                onSelectTabWithFilter={handleTabSwitchWithFilter}
                onSelectItem={handleSelectItem}
              />
            )}

            {activeTab === 'inventory' && (
              <InventoryView
                items={items}
                onSelectItem={handleSelectItem}
                onQuickIn={handleOpenInModal}
                onQuickOut={handleOpenOutModal}
                onAddNewItem={handleAddNewItem}
                onDeleteItem={handleDeleteItem}
                onBatchDelete={handleBatchDelete}
                onOpenImportExcel={() => setIsExcelImportModalOpen(true)}
                initialFilter={inventoryFilter}
              />
            )}

            {activeTab === 'transactions' && (
              <TransactionsView
                transactions={transactions}
                onNewTransaction={(type) => type === 'IN' ? handleOpenInModal() : handleOpenOutModal()}
              />
            )}

            {activeTab === 'rack-map' && (
              <RackMapView
                items={items}
                onSelectItem={handleSelectItem}
                onQuickIn={handleOpenInModal}
                onQuickOut={handleOpenOutModal}
              />
            )}

            {activeTab === 'reorder' && (
              <ReorderView
                items={items}
                onSelectItem={handleSelectItem}
                onQuickIn={handleOpenInModal}
              />
            )}

            {activeTab === 'opname' && (
              <OpnameHistoryView
                records={opnameRecords}
                onOpenAuditModal={handleOpenOpnameModal}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>WMS Offline • Sistem Manajemen Inventaris Gudang Suku Cadang & Logistik</span>
          <span className="font-mono text-slate-400">
            Status: 100% Offline (Data tersimpan di perangkat lokal)
          </span>
        </div>
      </footer>

      {/* Modals */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        type={transactionType}
        items={items}
        preselectedItem={selectedItemForTrx}
        onSuccess={loadData}
      />

      <StockOpnameModal
        isOpen={isOpnameModalOpen}
        onClose={() => setIsOpnameModalOpen(false)}
        items={items}
        onSuccess={loadData}
      />

      <ItemDetailModal
        item={selectedItemForDetail}
        onClose={() => setSelectedItemForDetail(null)}
        transactions={transactions}
        onQuickIn={handleOpenInModal}
        onQuickOut={handleOpenOutModal}
        onEditItem={handleEditItem}
        onDeleteItem={handleDeleteItem}
      />

      <AddItemModal
        isOpen={isAddItemModalOpen}
        onClose={() => setIsAddItemModalOpen(false)}
        editItem={itemToEdit}
        onSuccess={loadData}
        existingCount={items.length}
      />

      <ExcelImportModal
        isOpen={isExcelImportModalOpen}
        onClose={() => setIsExcelImportModalOpen(false)}
        onSuccess={loadData}
        currentCount={items.length}
      />

    </div>
  );
}
