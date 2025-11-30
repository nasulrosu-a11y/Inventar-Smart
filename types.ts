export interface Batch {
  id: string;
  plu?: string; // Kept for backward compatibility/history
  ean?: string;
  manufacturer?: string;
  store?: string;
  priceNoVat?: number;
  expirationDate?: string;
  currentStock: number;
  dateAdded: string;
}

export interface Product {
  id: string;
  name: string;
  plu?: string; // Product Level PLU (Master)
  unit: string; // e.g., kg, buc, l
  batches: Batch[]; // Tree structure for lots
  lastUpdated: string;
  
  // Concurrency Locking
  lockedBy?: string; // User ID who is currently editing
  lockTimestamp?: number; // When the lock was acquired
}

export enum TransactionType {
  INFLOW = 'INFLOW', // Intrare marfa (lot nou)
  STOCK_TAKE = 'STOCK_TAKE', // Inventar fizic (pe lot)
  CREATE = 'CREATE' // Produs nou
}

export interface InventoryLog {
  id: string;
  productId: string;
  productName: string;
  batchId?: string; // Link to specific batch
  batchDetails?: string; // Snapshot of batch info (e.g., "Lot Lidl Exp 2024")
  type: TransactionType;
  date: string;
  quantityChange?: number; // For inflow
  previousStock?: number; 
  actualCount?: number; // For stock take
  calculatedConsumption?: number; 
  notes?: string;
}

export interface ShoppingListItem {
  productName: string;
  unit: string;
  neededQuantity: number;
  recommendedStore: string;
  recommendedPrice: number;
  lastManufacturer: string;
}