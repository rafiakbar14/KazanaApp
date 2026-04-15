import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI: GoogleGenerativeAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey);
}

export async function generateProductionAdvice(prompt: string) {
    if (!genAI) {
        throw new Error("API Key Gemini belum disetuju di .env. Hubungi Admin.");
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err: any) {
        console.error("Gemini API Error:", err);
        throw new Error(`Gagal mendapatkan saran AI: ${err.message}`);
    }
}

export async function generateBusinessInsights(data: any) {
    if (!genAI) {
        throw new Error("API Key Gemini belum disetuju di .env. Hubungi Admin.");
    }
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const prompt = `
            Anda adalah analis bisnis profesional untuk Kazana ERP. 
            Analisis data inventaris berikut dan berikan 3-4 wawasan strategis yang singkat, padat, dan langsung bisa ditindaklanjuti.
            Format output harus berupa JSON array berisi objek dengan field "title", "content", dan "type" (info|warning|success).
            
            Data Inventaris:
            ${JSON.stringify(data, null, 2)}
            
            Berikan wawasan dalam Bahasa Indonesia yang profesional.
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        
        // Clean up markdown code blocks if AI included them
        const cleanJson = text.replace(/```json|```/g, "").trim();
        return JSON.parse(cleanJson);
    } catch (err: any) {
        console.error("Gemini AI Insight Error:", err);
        // Fallback insights if AI fails
        return [
            { 
                title: "Analisis Manual Diperlukan", 
                content: "Sistem AI sedang sibuk. Silakan cek laporan stok rendah secara manual untuk memastikan ketersediaan barang.",
                type: "info"
            }
        ];
    }
}
