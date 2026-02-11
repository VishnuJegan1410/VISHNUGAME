import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getGamerAdvice = async (userQuery: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: userQuery,
      config: {
        systemInstruction: "You are 'VISHNU AI', a helpful AI assistant for VISHNU Game Center. You speak like a pro gamer (using terms like GG, frames, latency, loadout) but remain polite and helpful. Help users choose games based on genres, explain booking rules (mock rules: ₹100/hr for PC, open 24/7), or just chat about gaming news. Keep responses concise (under 50 words).",
      }
    });
    return response.text || "Glitch in the matrix. Try again.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Connection lost. Reconnecting...";
  }
};