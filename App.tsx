import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Package, 
  Plus, 
  ClipboardCheck, 
  TrendingDown, 
  TrendingUp, 
  History, 
  Sparkles, 
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  ShoppingCart,
  Calendar,
  Download,
  Upload,
  Save,
  ScanBarcode,
  Clock,
  Lock,
  Unlock,
  User,
  X,
  AlertOctagon,
  Globe,
  HelpCircle,
  WifiOff
} from 'lucide-react';
import { Product, InventoryLog, TransactionType, Batch, ShoppingListItem } from './types';
import { generateInventoryReport } from './services/geminiService';
import { subscribeToProducts, subscribeToLogs, saveProductToDb, saveLogToDb, isFirebaseConfigured } from './services/firebase';
import { Button } from './components/Button';
import { Modal } from './components/Modal';

// --- Types & Constants ---

type Language = 'ro' | 'en' | 'ne';

const TRANSLATIONS = {
  ro: {
    appTitle: "Inventar",
    searchPlaceholder: "Caută produs (nume, PLU)...",
    newProduct: "Produs Nou",
    backup: "Backup",
    restore: "Restaurare",
    export: "Export",
    list: "Listă",
    report: "Raport AI",
    criticalStock: "Stoc Critic",
    expiringSoon: "Expiră Curând",
    totalProducts: "Total Produse",
    unit: "Unitate",
    plu: "PLU (Opțional)",
    nameLabel: "Nume Produs (De pe etichetă)",
    firstBatch: "Primul Lot (Intrare Marfă)",
    batch: "Lot",
    manufacturer: "Producător",
    store: "Magazin",
    price: "Preț (RON)",
    expiration: "Data Expirare",
    quantity: "Cantitate",
    save: "Salvează",
    cancel: "Anulează",
    add: "Adaugă",
    confirm: "Confirmă",
    countQuestion: "Cât ai numărat?",
    systemStock: "În sistem",
    actualCount: "Numărătoarea ta",
    tutorialTitle: "Cum se folosește?",
    tutorialStep1: "1. Produs Nou",
    tutorialDesc1: "Apasă butonul VERDE când vine marfă nouă care nu există în listă. Scrie numele exact ca pe cutie.",
    tutorialStep2: "2. Adaugă Stoc",
    tutorialDesc2: "Dacă produsul există deja, caută-l și apasă 'LOT'. Adaugă cantitatea de pe factură.",
    tutorialStep3: "3. Inventar (Numărare)",
    tutorialDesc3: "Mergi la raft. Apasă pe 'Inventariază'. Scrie câte bucăți vezi cu ochii tăi.",
    tutorialClose: "Am înțeles",
    lockedBy: "Blocat de",
    forceUnlock: "Deblocare Forțată",
    alertLocked: "ATENȚIE: Altcineva lucrează aici!",
    addStockTitle: "Adaugă Stoc",
    inventoryTitle: "Inventar Rapid",
    expiredStatus: "EXPIRAT",
    daysLeft: "zile rămase",
    dbError: "Eroare Conexiune: Configurați Firebase în cod pentru modul LIVE!"
  },
  en: {
    appTitle: "Inventory",
    searchPlaceholder: "Search product...",
    newProduct: "New Product",
    backup: "Backup",
    restore: "Restore",
    export: "Export",
    list: "List",
    report: "AI Report",
    criticalStock: "Critical Stock",
    expiringSoon: "Expiring Soon",
    totalProducts: "Total Products",
    unit: "Unit",
    plu: "PLU (Optional)",
    nameLabel: "Product Name (From Label)",
    firstBatch: "First Batch (New Stock)",
    batch: "Batch",
    manufacturer: "Manufacturer",
    store: "Store",
    price: "Price (RON)",
    expiration: "Exp. Date",
    quantity: "Quantity",
    save: "Save",
    cancel: "Cancel",
    add: "Add",
    confirm: "Confirm",
    countQuestion: "How many did you count?",
    systemStock: "System",
    actualCount: "Your Count",
    tutorialTitle: "How to use?",
    tutorialStep1: "1. New Product",
    tutorialDesc1: "Press GREEN button for new items not in list. Write name exactly as on box.",
    tutorialStep2: "2. Add Stock",
    tutorialDesc2: "If product exists, search it and press 'LOT'. Add quantity from invoice.",
    tutorialStep3: "3. Inventory (Count)",
    tutorialDesc3: "Go to shelf. Press 'Inventory'. Write how many items you see.",
    tutorialClose: "I understand",
    lockedBy: "Locked by",
    forceUnlock: "Force Unlock",
    alertLocked: "WARNING: Someone else is editing!",
    addStockTitle: "Add Stock",
    inventoryTitle: "Quick Inventory",
    expiredStatus: "EXPIRED",
    daysLeft: "days left",
    dbError: "Connection Error: Configure Firebase in code for LIVE mode!"
  },
  ne: { // Nepali Translations (Simplified)
    appTitle: "इन्भेन्टरी (Inventory)",
    searchPlaceholder: "सामान खोज्नुहोस्...",
    newProduct: "नयाँ सामान (New Product)",
    backup: "ब्याकअप",
    restore: "रिस्टोर",
    export: "निर्यात",
    list: "सूची",
    report: "AI रिपोर्ट",
    criticalStock: "कम स्टक (Low Stock)",
    expiringSoon: "म्याद सकिँदै (Expiring)",
    totalProducts: "जम्मा सामान",
    unit: "एकाइ (Unit)",
    plu: "PLU (Optional)",
    nameLabel: "सामानको नाम (Name)",
    firstBatch: "पहilo लट (First Lot)",
    batch: "लट (Batch)",
    manufacturer: "कम्पनी (Company)",
    store: "पसल (Store)",
    price: "मूल्य (Price)",
    expiration: "म्याद (Exp. Date)",
    quantity: "मात्रा (Quantity)",
    save: "सेभ गर्नुहोस् (Save)",
    cancel: "रद्द गर्नुहोस् (Cancel)",
    add: "थप्नुहोस् (Add)",
    confirm: "पक्का गर्नुहोस् (Confirm)",
    countQuestion: "कति गन्ती गर्नुभयो? (How many?)",
    systemStock: "सिस्टममा (System)",
    actualCount: "तपाईंको गन्ती (Your Count)",
    tutorialTitle: "कसरी प्रयोग गर्ने? (Help)",
    tutorialStep1: "१. नयाँ सामान (New)",
    tutorialDesc1: "नयाँ सामान आएमा हरियो बटन थिच्नुहोस्। बक्समा लेखिए जस्तै नाम लेख्नुहोस्।",
    tutorialStep2: "२. स्टक थप्नुहोस् (Add Stock)",
    tutorialDesc2: "यदि सामान पहिले नै छ भने, खोज्नुहोस् र 'LOT' थिच्नुहोस्। बिल अनुसार मात्रा राख्नुहोस्।",
    tutorialStep3: "३. गन्ती (Count)",
    tutorialDesc3: "सेल्फमा जानुहोस्। 'Inventariaza' थिच्नुहोस्। कति देख्नुहुन्छ त्यो लेख्नुहोस्।",
    tutorialClose: "बुझें (Ok)",
    lockedBy: "लक गरिएको (Locked by)",
    forceUnlock: "जबरजस्ती खोल्नुहोस्",
    alertLocked: "सावधान: अरू कसैले चलाउँदैछ!",
    addStockTitle: "स्टक थप्नुहोस्",
    inventoryTitle: "छिटो इन्भेन्टरी",
    expiredStatus: "म्याद सकियो",
    daysLeft: "दिन बाँकी",
    dbError: "जडान त्रुटि: लाइभ मोडको लागि फायरबेस कन्फिगर गर्नुहोस्!"
  }
};

// --- Helper Functions ---

const generateUserId = () => `User_${Math.floor(Math.random() * 1000)}`;
const CURRENT_USER_ID = generateUserId(); // Session-based ID

const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const downloadJSON = (data: object, filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.click();
};

const getDaysUntilExpiration = (dateStr?: string) => {
    if (!dateStr) return 999;
    const exp = new Date(dateStr);
    const now = new Date();
    // Normalize to start of day to avoid timezone confusion for simple day calc
    exp.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    
    const diffTime = exp.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
};

// --- Helper Components ---

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  textColor?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, textColor = 'text-gray-900' }) => (
  <div className="bg-white overflow-hidden shadow-sm rounded-lg flex items-center p-3 border border-gray-100">
    <div className={`flex-shrink-0 rounded-md p-2 ${colorClass}`}>
      {icon}
    </div>
    <div className="ml-3 w-0 flex-1">
      <dl>
        <dt className="text-xs font-medium text-gray-500 truncate uppercase tracking-wider">{title}</dt>
        <dd>
          <div className={`text-xl font-bold ${textColor}`}>{value}</div>
        </dd>
      </dl>
    </div>
  </div>
);

// --- Main App Component ---

const App: React.FC = () => {
  // --- State ---
  const [lang, setLang] = useState<Language>('ro');
  const t = TRANSLATIONS[lang];

  // REAL-TIME DATA FROM FIREBASE
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [dbConfigured, setDbConfigured] = useState(true);

  // UI State
  const [expandedProductIds, setExpandedProductIds] = useState<Set<string>>(new Set());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false); 
  const [isStockTakeModalOpen, setIsStockTakeModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Selection State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  
  // AI Report State
  const [isReportLoading, setIsReportLoading] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);

  // Form State - Product
  const [newProductName, setNewProductName] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('KG'); // Default to KG
  
  // Form State - Batch
  const [batchPlu, setBatchPlu] = useState('');
  const [batchEan, setBatchEan] = useState('');
  const [batchManuf, setBatchManuf] = useState('');
  const [batchStore, setBatchStore] = useState('');
  const [batchPrice, setBatchPrice] = useState('');
  const [batchExp, setBatchExp] = useState('');
  const [batchStock, setBatchStock] = useState('');

  // Form State - Stock Take
  const [countQuantity, setCountQuantity] = useState('');

  // --- Effects (Subscriptions) ---
  
  useEffect(() => {
      // Check config
      if (!isFirebaseConfigured()) {
          setDbConfigured(false);
          // Fallback to local storage only if DB not set, for demo purposes
          const savedP = localStorage.getItem('inventory_products_v2');
          if (savedP) setProducts(JSON.parse(savedP));
          return;
      }

      // Subscribe to LIVE updates
      const unsubProd = subscribeToProducts((data) => {
          setProducts(data);
          // Optional: Keep local backup
          localStorage.setItem('inventory_products_v2', JSON.stringify(data));
      });

      const unsubLogs = subscribeToLogs((data) => {
          setLogs(data);
          localStorage.setItem('inventory_logs_v2', JSON.stringify(data));
      });

      return () => {
          unsubProd();
          unsubLogs();
      };
  }, []);

  // --- Logic Helpers ---

  const uniqueStores = useMemo(() => {
    const stores = new Set<string>();
    products.forEach(p => p.batches.forEach(b => { if (b.store) stores.add(b.store) }));
    return Array.from(stores).sort();
  }, [products]);

  const uniqueManufacturers = useMemo(() => {
    const manufs = new Set<string>();
    products.forEach(p => p.batches.forEach(b => { if (b.manufacturer) manufs.add(b.manufacturer) }));
    return Array.from(manufs).sort();
  }, [products]);

  const uniqueProductNames = useMemo(() => {
    const names = new Set<string>();
    products.forEach(p => names.add(p.name));
    return Array.from(names).sort();
  }, [products]);

  // Search Filtering
  const filteredProducts = useMemo(() => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return products;
      return products.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.plu && p.plu.includes(q)) ||
        p.batches.some(b => b.ean && b.ean.includes(q))
      );
  }, [products, searchQuery]);

  // Recent Products (Last 2)
  const recentProducts = useMemo(() => {
      return [...products]
        .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
        .slice(0, 2);
  }, [products]);

  const getProductTotalStock = (p: Product) => p.batches.reduce((acc, b) => acc + b.currentStock, 0);

  const getConsumptionLast7Days = (productId: string) => {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    return logs
      .filter(l => 
        l.productId === productId && 
        l.type === TransactionType.STOCK_TAKE && 
        new Date(l.date) >= sevenDaysAgo &&
        (l.calculatedConsumption || 0) > 0
      )
      .reduce((acc, l) => acc + (l.calculatedConsumption || 0), 0);
  };

  const getCriticalThreshold = (productId: string) => {
    const consumption = getConsumptionLast7Days(productId);
    return consumption > 0 ? consumption * 1.15 : 5;
  };

  const isSaturday = new Date().getDay() === 6;

  // --- Locking System (Simplified for DB) ---
  const acquireLock = (product: Product) => {
      // In a real DB app, this would be a transaction. 
      // For this version, we just check current state from DB subscription.
      const now = Date.now();
      if (product.lockedBy && product.lockedBy !== CURRENT_USER_ID && product.lockTimestamp && (now - product.lockTimestamp < 5 * 60 * 1000)) {
          return false;
      }
      return true;
  };

  const releaseLock = async (product: Product) => {
      if (product.lockedBy === CURRENT_USER_ID) {
          const updated = { ...product, lockedBy: undefined, lockTimestamp: undefined };
          await saveProductToDb(updated);
      }
  };

  const forceUnlock = async (product: Product) => {
      const updated = { ...product, lockedBy: CURRENT_USER_ID, lockTimestamp: Date.now() };
      await saveProductToDb(updated);
      alert(`${t.forceUnlock}: ${product.name}`);
  };

  // --- Actions ---

  const resetBatchForm = () => {
    setBatchPlu(''); setBatchEan(''); setBatchManuf(''); 
    setBatchStore(''); setBatchPrice(''); setBatchExp(''); setBatchStock('');
  };

  const toggleExpand = (productId: string) => {
      const newSet = new Set(expandedProductIds);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      setExpandedProductIds(newSet);
  };

  const handleGenerateReport = async () => {
      setIsReportModalOpen(true);
      setIsReportLoading(true);
      setAiReport(null);
      
      try {
          const report = await generateInventoryReport(products, logs);
          setAiReport(report);
      } catch (err) {
          setAiReport("Eroare la generarea raportului.");
      } finally {
          setIsReportLoading(false);
      }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchExp) { alert("Data expirare obligatorie!"); return; }

    const existingByName = products.find(p => p.name.toLowerCase() === newProductName.toLowerCase());
    const existingByPlu = batchPlu ? products.find(p => p.plu === batchPlu) : null;
    const targetProduct = existingByPlu || existingByName;

    const newBatch: Batch = {
      id: crypto.randomUUID(),
      plu: batchPlu,
      ean: batchEan,
      manufacturer: batchManuf,
      store: batchStore,
      priceNoVat: parseFloat(batchPrice) || 0,
      expirationDate: batchExp,
      currentStock: parseFloat(batchStock) || 0,
      dateAdded: new Date().toISOString()
    };

    if (targetProduct) {
        // Update existing - DB Logic
        const updatedProduct = {
            ...targetProduct,
            plu: batchPlu || targetProduct.plu,
            batches: [...targetProduct.batches, newBatch],
            lastUpdated: new Date().toISOString()
        };
        
        const log: InventoryLog = {
            id: crypto.randomUUID(),
            productId: targetProduct.id,
            productName: targetProduct.name,
            batchId: newBatch.id,
            type: TransactionType.INFLOW,
            date: new Date().toISOString(),
            quantityChange: newBatch.currentStock,
            notes: `Lot adăugat automat (consolidare). Magazin: ${newBatch.store}`
        };

        await saveProductToDb(updatedProduct);
        await saveLogToDb(log);
        alert(`Produs existent (${targetProduct.name}). Lot adăugat.`);
    } else {
        // Create new
        const newProduct: Product = {
          id: crypto.randomUUID(),
          name: newProductName,
          plu: batchPlu,
          unit: newProductUnit,
          batches: [newBatch],
          lastUpdated: new Date().toISOString()
        };
        const log: InventoryLog = {
          id: crypto.randomUUID(),
          productId: newProduct.id,
          productName: newProduct.name,
          batchId: newBatch.id,
          type: TransactionType.CREATE,
          date: new Date().toISOString(),
          actualCount: newBatch.currentStock,
          notes: `Produs nou. Magazin: ${newBatch.store}`
        };
        await saveProductToDb(newProduct);
        await saveLogToDb(log);
    }
    setIsAddModalOpen(false);
    setNewProductName('');
    resetBatchForm();
  };

  const openAddStockModal = async (product: Product) => {
    if (!acquireLock(product)) {
        if (!window.confirm(`${t.alertLocked} ${t.lockedBy} ${product.lockedBy}. ${t.forceUnlock}?`)) {
            return;
        }
        await forceUnlock(product);
    } else {
        // Lock it
        const lockedP = { ...product, lockedBy: CURRENT_USER_ID, lockTimestamp: Date.now() };
        await saveProductToDb(lockedP);
    }

    setSelectedProduct(product);
    const lastBatch = [...product.batches].sort((a, b) => new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime())[0];
    const existingPlu = product.plu || lastBatch?.plu || '';
    setBatchPlu(existingPlu);

    if (lastBatch) {
        setBatchEan(lastBatch.ean || '');
        setBatchManuf(lastBatch.manufacturer || '');
        setBatchStore(''); setBatchPrice(''); setBatchExp(''); setBatchStock('');
    } else {
        setBatchEan(''); setBatchManuf(''); setBatchStore(''); 
        setBatchPrice(''); setBatchExp(''); setBatchStock('');
    }
    setIsBatchModalOpen(true);
  };

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!batchExp) { alert("Data expirare obligatorie!"); return; }

    const newBatch: Batch = {
      id: crypto.randomUUID(),
      plu: batchPlu,
      ean: batchEan,
      manufacturer: batchManuf,
      store: batchStore,
      priceNoVat: parseFloat(batchPrice) || 0,
      expirationDate: batchExp,
      currentStock: parseFloat(batchStock) || 0,
      dateAdded: new Date().toISOString()
    };

    const updatedProduct = {
          ...selectedProduct,
          plu: batchPlu || selectedProduct.plu,
          batches: [...selectedProduct.batches, newBatch],
          lastUpdated: new Date().toISOString(),
          lockedBy: undefined // Release lock on save
    };

    const log: InventoryLog = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      batchId: newBatch.id,
      type: TransactionType.INFLOW,
      date: new Date().toISOString(),
      quantityChange: newBatch.currentStock,
      notes: `Lot nou adăugat. Exp: ${newBatch.expirationDate}`
    };

    await saveProductToDb(updatedProduct);
    await saveLogToDb(log);
    setIsBatchModalOpen(false);
    resetBatchForm();
  };

  const openStockTakeModal = async (product: Product, batch: Batch) => {
    if (!acquireLock(product)) {
         if (!window.confirm(`${t.alertLocked} ${t.lockedBy} ${product.lockedBy}. ${t.forceUnlock}?`)) {
            return;
        }
        await forceUnlock(product);
    } else {
        const lockedP = { ...product, lockedBy: CURRENT_USER_ID, lockTimestamp: Date.now() };
        await saveProductToDb(lockedP);
    }

    setSelectedProduct(product);
    setSelectedBatch(batch);
    setCountQuantity('');
    setIsStockTakeModalOpen(true);
  };

  const handleStockTake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !selectedBatch) return;
    const actualQty = parseFloat(countQuantity);
    if (isNaN(actualQty)) return;
    const consumption = selectedBatch.currentStock - actualQty;

    const updatedBatches = selectedProduct.batches.map(b => b.id === selectedBatch.id ? { ...b, currentStock: actualQty } : b);
    const updatedProduct = { ...selectedProduct, batches: updatedBatches, lastUpdated: new Date().toISOString(), lockedBy: undefined };

    const log: InventoryLog = {
      id: crypto.randomUUID(),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      batchId: selectedBatch.id,
      batchDetails: `Lot: ${selectedBatch.store} / ${selectedBatch.manufacturer}`,
      type: TransactionType.STOCK_TAKE,
      date: new Date().toISOString(),
      previousStock: selectedBatch.currentStock,
      actualCount: actualQty,
      calculatedConsumption: consumption
    };

    await saveProductToDb(updatedProduct);
    await saveLogToDb(log);
    setIsStockTakeModalOpen(false);

    // Feedback visual imediat pentru consum
    const unit = selectedProduct.unit;
    alert(`Inventar actualizat!\n\nStoc anterior: ${selectedBatch.currentStock} ${unit}\nNumărat: ${actualQty} ${unit}\n\nCONSUM (Diferență): ${consumption.toFixed(2)} ${unit}`);
  };

  const closeModal = async (setter: (val: boolean) => void) => {
      // Try to release lock if closing without saving
      if (selectedProduct && selectedProduct.lockedBy === CURRENT_USER_ID) {
          await releaseLock(selectedProduct);
      }
      setter(false);
  };

  // --- Backup/Restore/Reports (Simplified) ---
  const handleBackup = () => {
      const data = { version: "2.0", date: new Date().toISOString(), products, logs };
      downloadJSON(data, `Inventar_Backup_${new Date().toISOString().split('T')[0]}.json`);
  };

  const handleRestoreClick = () => fileInputRef.current?.click();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.products && Array.isArray(json.products)) {
                  if (window.confirm("ATENȚIE: Restaurarea va suprascrie baza de date ONLINE! Ești sigur?")) {
                      // Bulk upload to firebase would go here, doing one by one for safety in this demo
                      json.products.forEach((p: Product) => saveProductToDb(p));
                      alert("Restaurare pornită. Datele se vor actualiza în câteva secunde.");
                  }
              }
          } catch (err) { alert("Eroare fișier."); }
      };
      reader.readAsText(file);
      e.target.value = '';
  };

  const handleExportCurrentStock = () => {
      const headers = "Nume Produs,Cod PLU,Stoc Total,Unitate,Valoare Totală (fără TVA)\n";
      const rows = products.map(p => {
         const totalStock = p.batches.reduce((acc, b) => acc + b.currentStock, 0);
         const totalValue = p.batches.reduce((acc, b) => acc + (b.currentStock * (b.priceNoVat || 0)), 0);
         return `"${p.name}","${p.plu || ''}",${totalStock},${p.unit},${totalValue.toFixed(2)}`;
      }).join('\n');
      downloadCSV(headers + rows, `Inventar_La_Zi.csv`);
  };

  // --- Computed Metrics ---
  const criticalItemsCount = products.filter(p => getProductTotalStock(p) < getCriticalThreshold(p.id)).length;
  const expiringItemsCount = products.reduce((acc, p) => acc + p.batches.filter(b => b.currentStock > 0 && getDaysUntilExpiration(b.expirationDate) <= 31).length, 0);

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-800">
      
      {!dbConfigured && (
          <div className="bg-red-600 text-white p-2 text-center text-sm font-bold flex items-center justify-center gap-2">
              <WifiOff className="w-4 h-4" />
              {t.dbError}
          </div>
      )}

      {/* Inputs hidden */}
      <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileChange} />
      <datalist id="stores-list">{uniqueStores.map(store => <option key={store} value={store} />)}</datalist>
      <datalist id="manuf-list">{uniqueManufacturers.map(man => <option key={man} value={man} />)}</datalist>
      <datalist id="product-names-list">{uniqueProductNames.map(name => <option key={name} value={name} />)}</datalist>

      {/* --- Header --- */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3">
          
          {/* Top Row: Title + User + Language + Tutorial */}
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
             <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-blue-600" />
                <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">{t.appTitle}</h1>
                    <span className="text-[10px] text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3"/> {CURRENT_USER_ID}
                    </span>
                </div>
             </div>
             
             {/* Right Side Controls */}
             <div className="flex items-center gap-2">
                 {/* Language Selector */}
                 <div className="flex bg-gray-100 rounded-lg p-1">
                     <button onClick={() => setLang('ro')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'ro' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>RO</button>
                     <button onClick={() => setLang('en')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'en' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>EN</button>
                     <button onClick={() => setLang('ne')} className={`px-2 py-1 text-xs font-bold rounded ${lang === 'ne' ? 'bg-white shadow text-blue-600' : 'text-gray-500'}`}>NE</button>
                 </div>

                 {/* Help Button */}
                 <button onClick={() => setIsTutorialOpen(true)} className="p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100">
                     <HelpCircle className="w-5 h-5" />
                 </button>
                 
                 {/* Desktop Tools - Always visible on desktop */}
                 <div className="hidden md:flex gap-2 border-l pl-2 ml-2">
                     <Button size="sm" variant="outline" onClick={handleBackup} icon={<Save className="w-3 h-3"/>} title={t.backup}>{t.backup}</Button>
                     <Button size="sm" variant="outline" onClick={handleRestoreClick} icon={<Upload className="w-3 h-3"/>} title={t.restore}>{t.restore}</Button>
                     <Button size="sm" variant="outline" onClick={handleExportCurrentStock} icon={<Download className="w-3 h-3"/>}>{t.export}</Button>
                     <Button size="sm" variant="outline" onClick={() => setIsShoppingListModalOpen(true)} icon={<ShoppingCart className="w-3 h-3"/>}>{t.list}</Button>
                 </div>
             </div>
          </div>
          
          {/* Stats Row for Desktop */}
          <div className="hidden md:grid grid-cols-4 gap-4 mb-4">
              <StatCard title={t.criticalStock} value={criticalItemsCount} icon={<AlertTriangle className="text-white w-5 h-5"/>} colorClass="bg-amber-500" textColor="text-amber-600" />
              <StatCard title={t.expiringSoon} value={expiringItemsCount} icon={<Clock className="text-white w-5 h-5"/>} colorClass="bg-orange-500" textColor="text-orange-600" />
              <StatCard title={t.totalProducts} value={products.length} icon={<Package className="text-white w-5 h-5"/>} colorClass="bg-blue-500" />
              <Button onClick={handleGenerateReport} className="h-full flex flex-col justify-center items-center" variant="secondary" icon={<Sparkles className="w-5 h-5"/>}>{t.report}</Button>
          </div>

          {/* Action Bar: New Product (First, Left) + Search */}
          <div className="flex gap-2 items-center">
              <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="bg-blue-600 text-white p-3 rounded-lg shadow-md active:scale-95 transition-transform flex items-center justify-center min-w-[50px]"
                  title={t.newProduct}
              >
                  <Plus className="w-6 h-6" />
              </button>
              
              <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                      type="text"
                      className="w-full pl-10 pr-8 py-3 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-base"
                      placeholder={t.searchPlaceholder}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                      <button 
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400"
                      >
                          <X className="w-4 h-4" />
                      </button>
                  )}
              </div>
               {/* Mobile Alert Icons */}
               <div className="flex md:hidden gap-2 items-center pl-2">
                 {criticalItemsCount > 0 && (
                     <div className="relative p-1">
                         <AlertTriangle className="w-6 h-6 text-amber-500 animate-pulse" />
                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{criticalItemsCount}</span>
                     </div>
                 )}
                 {expiringItemsCount > 0 && (
                     <div className="relative p-1">
                         <Clock className="w-6 h-6 text-orange-500" />
                         <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full font-bold">{expiringItemsCount}</span>
                     </div>
                 )}
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 space-y-4">
        
        {/* Recent Products Section */}
        {!searchQuery && recentProducts.length > 0 && (
            <div className="mb-6">
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1">Recent</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {recentProducts.map(p => (
                        <div key={`recent-${p.id}`} 
                             onClick={() => toggleExpand(p.id)}
                             className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex justify-between items-center shadow-sm cursor-pointer"
                        >
                            <div>
                                <p className="font-bold text-gray-800">{p.name}</p>
                                <p className="text-xs text-blue-600">Stoc: {getProductTotalStock(p)} {p.unit}</p>
                            </div>
                            <History className="w-4 h-4 text-blue-400" />
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Main List */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {filteredProducts.length === 0 ? (
              <li className="px-4 py-8 text-center text-gray-500">
                {searchQuery ? "Niciun produs găsit." : t.tutorialStep1}
              </li>
            ) : (
              filteredProducts.map((product) => {
                const totalStock = getProductTotalStock(product);
                const isCritical = totalStock < getCriticalThreshold(product.id);
                const isExpanded = expandedProductIds.has(product.id) || (searchQuery.length > 0 && filteredProducts.length < 5); // Auto expand on specific search
                
                // Check Lock Status
                const isLocked = product.lockedBy && product.lockedBy !== CURRENT_USER_ID && 
                                 product.lockTimestamp && (Date.now() - product.lockTimestamp < 5 * 60 * 1000);

                return (
                  <li key={product.id} className={`transition-colors hover:bg-gray-50 ${isLocked ? 'bg-red-50' : ''}`}>
                    {/* Product Header */}
                    <div 
                        className="px-4 py-4 cursor-pointer"
                        onClick={() => toggleExpand(product.id)}
                    >
                      <div className="flex justify-between items-start">
                          <div className="flex-1">
                              <div className="flex items-center gap-2">
                                  <h4 className="text-lg font-bold text-gray-900">{product.name}</h4>
                                  {isLocked && (
                                    <span title={`Blocat de ${product.lockedBy}`}>
                                      <Lock className="w-4 h-4 text-red-500" />
                                    </span>
                                  )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">PLU: {product.plu || '-'}</span>
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                                    isCritical ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-green-100 text-green-800'
                                  }`}>
                                    {t.quantity}: {totalStock} {product.unit}
                                  </span>
                              </div>
                          </div>
                          <div className="ml-2 flex flex-col gap-2">
                             <Button 
                                size="sm" 
                                variant="outline" 
                                onClick={(e) => { e.stopPropagation(); openAddStockModal(product); }}
                                className="text-xs h-8 whitespace-nowrap"
                            >
                                <Plus className="w-3 h-3 mr-1" />
                                Lot
                            </Button>
                             {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-400 self-end" /> : <ChevronRight className="w-5 h-5 text-gray-400 self-end" />}
                          </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-gray-100 px-3 py-3 sm:px-8">
                        {product.batches.length === 0 && <p className="text-sm text-gray-500 italic">Fără stoc.</p>}
                        
                        <div className="space-y-3 sm:space-y-0 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-4">
                            {product.batches.map(batch => {
                                const daysExp = getDaysUntilExpiration(batch.expirationDate);
                                const isExpiringSoon = daysExp <= 30 && daysExp >= 0;
                                const isExpired = daysExp < 0;
                                
                                return (
                                <div key={batch.id} className={`bg-white border rounded-lg p-3 shadow-sm relative transition-all hover:shadow-md ${isExpired ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : (isExpiringSoon ? 'border-amber-400 bg-amber-50' : 'border-gray-200')}`}>
                                    
                                    {/* Status Badge */}
                                    {(isExpired || isExpiringSoon) && (
                                        <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm flex items-center gap-1 z-10 ${isExpired ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                                            {isExpired && <AlertOctagon className="w-3 h-3" />}
                                            {isExpired ? t.expiredStatus : `${daysExp} ${t.daysLeft}`}
                                        </div>
                                    )}

                                    {/* Layout requested: Manufacturer/Store top */}
                                    <div className="flex justify-between items-start mb-2 border-b border-gray-100 pb-1">
                                         <span className="font-bold text-sm text-gray-800 leading-tight truncate pr-2">{batch.manufacturer || 'N/A'}</span>
                                         <span className="text-xs text-gray-500 whitespace-nowrap">{batch.store || 'N/A'}</span>
                                    </div>
                                    
                                    {/* Quantity Row - Main Focus */}
                                    <div className="flex items-baseline gap-1 justify-center py-1">
                                        <span className="text-3xl font-bold text-blue-600">{batch.currentStock}</span>
                                        <span className="text-sm font-bold text-gray-500 uppercase">{product.unit}</span>
                                    </div>

                                    {/* Middle Row: Exp Date | Price */}
                                    <div className="flex justify-between items-center text-sm font-medium mt-2 bg-gray-50 p-1 rounded bg-opacity-50">
                                        <div className="flex items-center gap-1">
                                            <span className={isExpired ? "text-red-700 font-bold" : (isExpiringSoon ? "text-amber-700 font-bold" : "text-gray-700")}>
                                                {t.expiration}: {batch.expirationDate}
                                            </span>
                                        </div>
                                        <div className="text-gray-900">{batch.priceNoVat} L</div>
                                    </div>

                                    {/* Bottom Row: PLU | EAN */}
                                    <div className="flex justify-between text-[10px] text-gray-400 mt-2 pt-1 border-t border-gray-100">
                                        <span>PLU: {product.plu || batch.plu || '-'}</span>
                                        <span>EAN: {batch.ean || '-'}</span>
                                    </div>

                                    <div className="mt-3">
                                        <Button 
                                            size="sm" 
                                            className="w-full text-xs py-1" 
                                            onClick={() => openStockTakeModal(product, batch)}
                                        >
                                            <ClipboardCheck className="w-3 h-3 mr-1" />
                                            {t.inventoryTitle}
                                        </Button>
                                    </div>
                                </div>
                            )})}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      </main>

      {/* --- Modals --- */}

      {/* Tutorial Modal */}
      <Modal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} title={t.tutorialTitle}>
         <div className="space-y-6">
             <div className="flex gap-4 items-start bg-green-50 p-3 rounded-lg border border-green-200">
                 <div className="bg-green-600 text-white p-2 rounded-full shrink-0"><Plus className="w-6 h-6"/></div>
                 <div>
                     <h4 className="font-bold text-green-900">{t.tutorialStep1}</h4>
                     <p className="text-sm text-green-800">{t.tutorialDesc1}</p>
                 </div>
             </div>
             
             <div className="flex gap-4 items-start bg-blue-50 p-3 rounded-lg border border-blue-200">
                 <div className="bg-white border border-blue-300 text-blue-600 p-2 rounded-full shrink-0"><Plus className="w-6 h-6"/></div>
                 <div>
                     <h4 className="font-bold text-blue-900">{t.tutorialStep2}</h4>
                     <p className="text-sm text-blue-800">{t.tutorialDesc2}</p>
                 </div>
             </div>

             <div className="flex gap-4 items-start bg-amber-50 p-3 rounded-lg border border-amber-200">
                 <div className="bg-amber-100 text-amber-600 p-2 rounded-full shrink-0"><ClipboardCheck className="w-6 h-6"/></div>
                 <div>
                     <h4 className="font-bold text-amber-900">{t.tutorialStep3}</h4>
                     <p className="text-sm text-amber-800">{t.tutorialDesc3}</p>
                 </div>
             </div>

             <div className="pt-4">
                 <Button onClick={() => setIsTutorialOpen(false)} className="w-full py-3 text-lg">{t.tutorialClose}</Button>
             </div>
         </div>
      </Modal>

      {/* 1. Add Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => closeModal(setIsAddModalOpen)} title={t.newProduct}>
        <form onSubmit={handleCreateProduct} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
          <div className="bg-blue-50 p-2 text-xs text-blue-800 rounded border border-blue-200 mb-2">
              ℹ️ {lang === 'ro' ? "Scrie numele exact așa cum apare pe factură/cutie." : "Write name exactly as on the invoice/box."}
          </div>
          <div>
            <label className="label">{t.nameLabel}</label>
            <input type="text" list="product-names-list" required className="input-field" value={newProductName} 
                onChange={e => {
                    setNewProductName(e.target.value);
                    const exist = products.find(p => p.name.toLowerCase() === e.target.value.toLowerCase());
                    if(exist && exist.plu) setBatchPlu(exist.plu);
                }} placeholder="ex: Zahar Margaritar" />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
                 <label className="label">{t.unit}</label>
                 <select className="input-field" value={newProductUnit} onChange={e => setNewProductUnit(e.target.value)}>
                     <option value="KG">KG</option>
                     <option value="L">L</option>
                 </select>
             </div>
             <div><label className="label">{t.plu}</label><input type="text" className="input-field" value={batchPlu} onChange={e => setBatchPlu(e.target.value)} /></div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-200">
             <h4 className="text-xs font-bold text-gray-700 mb-2 uppercase">{t.firstBatch}</h4>
             <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-2"><input type="text" className="input-field" placeholder="Scan EAN..." value={batchEan} onChange={e => setBatchEan(e.target.value)} /></div>
                 <div><input type="text" list="manuf-list" className="input-field" placeholder={t.manufacturer} value={batchManuf} onChange={e => setBatchManuf(e.target.value)} /></div>
                 <div><input type="text" list="stores-list" className="input-field" placeholder={t.store} value={batchStore} onChange={e => setBatchStore(e.target.value)} /></div>
                 <div><label className="label">{t.price}</label><input type="number" step="0.01" className="input-field" value={batchPrice} onChange={e => setBatchPrice(e.target.value)} /></div>
                 <div><label className="label text-red-600">{t.expiration}*</label><input type="date" required className="input-field" value={batchExp} onChange={e => setBatchExp(e.target.value)} /></div>
                 <div className="col-span-2"><label className="label text-green-700 font-bold">{t.quantity}*</label><input type="number" step="0.01" required className="input-field border-green-400 bg-green-50" value={batchStock} onChange={e => setBatchStock(e.target.value)} /></div>
             </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => closeModal(setIsAddModalOpen)}>{t.cancel}</Button>
            <Button type="submit">{t.save}</Button>
          </div>
        </form>
      </Modal>

      {/* 2. Add Stock Modal */}
      <Modal isOpen={isBatchModalOpen} onClose={() => closeModal(setIsBatchModalOpen)} title={selectedProduct?.lockedBy && selectedProduct.lockedBy !== CURRENT_USER_ID ? `${t.alertLocked} (${selectedProduct.lockedBy})` : t.addStockTitle}>
         <form onSubmit={handleAddBatch} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
             {selectedProduct?.lockedBy && selectedProduct.lockedBy !== CURRENT_USER_ID && (
                 <div className="bg-red-100 text-red-800 p-3 rounded text-sm mb-2 border border-red-300">
                     {t.alertLocked}
                 </div>
             )}
             <div className="grid grid-cols-2 gap-3">
                 <div className="col-span-2"><input type="text" className="input-field" placeholder="Scan EAN..." value={batchEan} onChange={e => setBatchEan(e.target.value)} /></div>
                 <div><input type="text" list="manuf-list" className="input-field" placeholder={t.manufacturer} value={batchManuf} onChange={e => setBatchManuf(e.target.value)} /></div>
                 <div><input type="text" list="stores-list" className="input-field" placeholder={t.store} value={batchStore} onChange={e => setBatchStore(e.target.value)} /></div>
                 <div><label className="label">{t.expiration}*</label><input type="date" required className="input-field" value={batchExp} onChange={e => setBatchExp(e.target.value)} /></div>
                 <div><label className="label">{t.quantity}*</label><input type="number" required className="input-field border-green-400 bg-green-50" placeholder={t.quantity} value={batchStock} onChange={e => setBatchStock(e.target.value)} /></div>
             </div>
             <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => closeModal(setIsBatchModalOpen)}>{t.cancel}</Button>
                <Button type="submit">{t.add}</Button>
             </div>
         </form>
      </Modal>

      {/* 3. Stock Take Modal */}
      <Modal isOpen={isStockTakeModalOpen} onClose={() => closeModal(setIsStockTakeModalOpen)} title={t.inventoryTitle}>
        <form onSubmit={handleStockTake} className="space-y-4">
            <div className="bg-slate-100 p-3 rounded text-sm">
                <p className="font-bold">{selectedProduct?.name}</p>
                <p>{selectedBatch?.manufacturer} (Exp: {selectedBatch?.expirationDate})</p>
                <p className="text-gray-500">{t.systemStock}: {selectedBatch?.currentStock}</p>
            </div>
            <div>
                <label className="block text-lg font-bold text-center mb-1">{t.countQuestion}</label>
                <input type="number" step="0.01" required autoFocus className="block w-full text-center text-3xl p-4 border rounded-lg border-blue-300 focus:ring-4 focus:ring-blue-200 outline-none" 
                    value={countQuantity} onChange={e => setCountQuantity(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="outline" onClick={() => closeModal(setIsStockTakeModalOpen)}>{t.cancel}</Button>
                <Button type="submit">{t.confirm}</Button>
            </div>
        </form>
      </Modal>

      {/* 4. Shopping List Modal */}
      <Modal isOpen={isShoppingListModalOpen} onClose={() => setIsShoppingListModalOpen(false)} title={t.list}>
         <div className="text-center py-4">
            <Button onClick={handleExportCurrentStock} icon={<Download className="w-4 h-4"/>}>CSV</Button>
         </div>
      </Modal>

      {/* 5. Report Modal */}
      <Modal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} title={t.report}>
         <div className="space-y-4 max-h-[60vh] overflow-y-auto">
           {isReportLoading ? <p className="text-center py-4">Loading...</p> : 
             <div className="prose prose-sm">{aiReport?.split('\n').map((l,i) => <p key={i}>{l}</p>)}</div>}
           <Button className="w-full" onClick={() => setIsReportModalOpen(false)}>{t.cancel}</Button>
         </div>
      </Modal>

      {/* Floating Action for Report on Mobile */}
      <button 
        onClick={handleGenerateReport} 
        className="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white p-3 rounded-full shadow-lg z-30"
        title={t.report}
      >
          <Sparkles className="w-6 h-6" />
      </button>

      <style>{`
        .input-field { @apply mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-base p-2.5 border; }
        .label { @apply block text-xs font-bold text-gray-700 uppercase tracking-wide; }
      `}</style>
    </div>
  );
};

export default App;