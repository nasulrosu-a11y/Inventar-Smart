import { GoogleGenAI } from "@google/genai";
import { Product, InventoryLog, TransactionType } from "../types";

// Initialize AI with the environment variable directly as per guidelines
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateInventoryReport = async (
  products: Product[], 
  logs: InventoryLog[]
): Promise<string> => {
  if (!process.env.API_KEY) {
    return "Cheia API Gemini nu este configurată. Vă rugăm să setați API_KEY.";
  }

  // Filter logs for the last 7 days to keep context manageable
  const recentLogs = logs.slice(0, 50); 

  const prompt = `
    Ești un asistent expert în logistică și inventar. Analizează următoarele date despre stocuri și tranzacții.
    
    Date curente produse:
    ${JSON.stringify(products.map(p => ({ 
      name: p.name, 
      stock: p.batches.reduce((acc, b) => acc + b.currentStock, 0), 
      unit: p.unit 
    })))}

    Istoric tranzacții recente:
    ${JSON.stringify(recentLogs.map(l => ({
      type: l.type === TransactionType.INFLOW ? "Intrare Marfă" : "Inventar (Verificare)",
      item: l.productName,
      consumption: l.calculatedConsumption ? l.calculatedConsumption : 0,
      date: l.date
    })))}

    Te rog să generezi un raport scurt și util pentru muncitor/gestionar în limba Română care să includă:
    1. Ce produse au avut cel mai mare consum (diferențe la inventar).
    2. Avertismente pentru produse cu stoc critic (sub 5 unități).
    3. O scurtă concluzie despre eficiența gestiunii.
    
    Folosește un ton profesional dar prietenos. Formatează răspunsul folosind Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Nu s-a putut genera raportul.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "A apărut o eroare la generarea raportului cu AI.";
  }
};