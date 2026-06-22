export interface LeadInputData {
  source: string;
  name: string;
  contactInfo: string;
  budget: number;
  location: string;
  projectAreaSqft: number | null;
  projectType: string;
  timeline: string;
  rawDetails: string;
}

export interface QualificationResult {
  score: number;
  category: "HOT" | "WARM" | "COLD";
  reason: string;
}

import { GoogleGenAI } from "@google/genai";

// Cache a single genAI instance
let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE" });
  }
  return ai;
}

export async function qualifyLead(data: LeadInputData): Promise<QualificationResult> {
  try {
    const ai = getAI();
    const prompt = `
      You are an expert Sales Manager and Lead Qualification AI for Arkoo Pre-Build.
      You need to score the following lead out of 100 and categorize it as HOT, WARM, or COLD.
      
      SCORING RULES:
      - Budget: Above 10 Lakhs is high value (+40 pts). 5-10 Lakhs (+30 pts).
      - Location: Premium locations like Pune, Goa, Nagpur, Mumbai, Thane (+30 pts). Other (+10 pts).
      - Area: >1000 sqft (+10 pts).
      - Timeline: Immediate/Urgent/1 Month (+10 pts). Exploring/Next year (0 pts).
      
      CATEGORY:
      - HOT: 70+
      - WARM: 40-69
      - COLD: Below 40
      
      LEAD DETAILS:
      - Name: ${data.name}
      - Project Type: ${data.projectType}
      - Budget: ${data.budget}
      - Location: ${data.location}
      - Area: ${data.projectAreaSqft} Sqft
      - Timeline: ${data.timeline}
      
      Respond STRICTLY in JSON format without markdown blocks:
      {
        "score": 85,
        "category": "HOT",
        "reason": "High budget in premium location with immediate timeline."
      }
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.2
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    
    return {
      score: parsed.score || 0,
      category: parsed.category || "COLD",
      reason: parsed.reason || "Unable to determine"
    };
  } catch (error) {
    console.error("Gemini AI Qualification Error:", error);
    // Fallback static rules if AI fails
    let score = 0;
    if (data.budget >= 500000) score += 30;
    const premiumLocations = ["pune", "goa", "nagpur", "mumbai", "thane"];
    if (premiumLocations.some(loc => data.location.toLowerCase().includes(loc))) score += 30;
    if (data.timeline.toLowerCase().includes("immediate") || data.timeline.toLowerCase().includes("month")) score += 10;
    
    let category: "HOT"|"WARM"|"COLD" = score >= 70 ? "HOT" : (score >= 40 ? "WARM" : "COLD");
    return { score, category, reason: "Fallback static calculation used." };
  }
}
