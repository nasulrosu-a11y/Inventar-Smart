import { initializeApp } from "firebase/app";
// @ts-ignore
import { getFirestore, collection, onSnapshot, doc, setDoc, updateDoc, addDoc, query, orderBy, limit } from "firebase/firestore";
import { Product, InventoryLog } from "../types";

// --- CONFIGURARE ---
// 1. Mergi la console.firebase.google.com
// 2. Creează un proiect nou
// 3. Adaugă o aplicație Web (</>)
// 4. Copiază "firebaseConfig" de acolo și înlocuiește mai jos:

const firebaseConfig = {
  apiKey: "AIzaSyAN3DQkhu_Edf1GkcxxVtN6AFqGw03mvLw",
  authDomain: "inventar-smart-ingredients.firebaseapp.com",
  projectId: "inventar-smart-ingredients",
  storageBucket: "inventar-smart-ingredients.firebasestorage.app",
  messagingSenderId: "11781887344",
  appId: "1:11781887344:web:8ed9057ef84ce08d836bb5",
  measurementId: "G-8D0CSWV7WV"
};

// Inițializare (se activează doar dacă ai completat configul)
let db: any;
try {
    if (firebaseConfig.projectId !== "proiectul-tau") {
        const app = initializeApp(firebaseConfig);
        db = getFirestore(app);
        console.log("Firebase conectat cu succes!");
    } else {
        console.warn("Firebase nu este configurat. Aplicația nu va salva datele online.");
    }
} catch (e) {
    console.error("Eroare inițializare Firebase:", e);
}

// --- Functii ---

export const subscribeToProducts = (callback: (products: Product[]) => void) => {
    if (!db) return () => {};
    
    // Ascultă LIVE orice schimbare în colecția 'products'
    const q = query(collection(db, "products"));
    return onSnapshot(q, (snapshot) => {
        const products = snapshot.docs.map(doc => doc.data() as Product);
        callback(products);
    });
};

export const subscribeToLogs = (callback: (logs: InventoryLog[]) => void) => {
    if (!db) return () => {};

    // Ascultă ultimele 100 loguri
    const q = query(collection(db, "logs"), orderBy("date", "desc"), limit(100));
    return onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map(doc => doc.data() as InventoryLog);
        callback(logs);
    });
};

export const saveProductToDb = async (product: Product) => {
    if (!db) return;
    await setDoc(doc(db, "products", product.id), product);
};

export const saveLogToDb = async (log: InventoryLog) => {
    if (!db) return;
    await setDoc(doc(db, "logs", log.id), log);
};

export const isFirebaseConfigured = () => !!db;