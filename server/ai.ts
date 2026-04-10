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
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (err: any) {
        console.error("Gemini API Error:", err);
        throw new Error(`Gagal mendapatkan saran AI: ${err.message}`);
    }
}
