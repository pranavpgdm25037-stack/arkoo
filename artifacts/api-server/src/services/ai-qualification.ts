export interface LeadInputData {
  source: string;
  name: string;
  contactInfo: string;
  budget: number;
  location: string;
  projectAreaSqft: number | null;
  projectType: string;
  timeline: string;
  landOwnership?: string;
  governmentApprovals?: string;
  architectHired?: string;
  architectDetailsProvided?: boolean;
  drawingsUploadedCount?: number;
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
      You need to score the following lead out of 100 and categorize it strictly as HOT, WARM, or COLD.
      
      CRITICAL CATEGORIZATION RULES:
      Evaluate these rules and assign points. Base your final category on the combined strength.
      
      1. Project Location:
         - HOT: Pune, Mumbai, Delhi, or nearby cities. (+20)
         - WARM: Cities a little far from Pune but in the same state/region. (+10)
         - COLD: Way far cities or other states. (0)
      
      2. Project Type:
         - HOT: PEB Warehouse, Multistory, Industry Shed. (+15)
         - WARM: Any other project type. (+5)
      
      3. Project Area:
         - HOT: More than 7000 sqft. (+15)
         - WARM: Around 5000 - 7000 sqft. (+10)
         - COLD: Below 3000 sqft. (0)
      
      4. Budget:
         - HOT: Budget is open/any input is generally good. (+10)
      
      5. Completion Timeline:
         - HOT: 1 - 6 months. (+10)
         - WARM: 6 - 9 months. (+5)
         - COLD: More than 1 year. (0)
      
      6. Land Ownership:
         - HOT: Owned land. (+10)
         - WARM: Rented land. (+5)
         - COLD: No land / Not Specified. (0)
      
      7. Government Approvals:
         - HOT: Yes / Approved. (+10)
         - COLD: No / Not specified. (0)
      
      8. Architect Hired:
         - HOT: Yes (+5). If Architect Name and Number is provided (+10).
         - WARM: No. (+2)
      
      9. Uploaded Drawings:
         - HOT: 3 drawings uploaded (Architectural, Tender, Supporting). (+10)
         - WARM: 2 drawings uploaded. (+5)
         - COLD: 1 or 0 drawings uploaded. (0)
      
      CATEGORY ASSIGNMENT:
      - Add up the total points. 
      - HOT: 70+
      - WARM: 40-69
      - COLD: Below 40
      
      LEAD DETAILS:
      - Name: ${data.name}
      - Project Type: ${data.projectType}
      - Budget: ${data.budget > 0 ? data.budget : 'Open'}
      - Location: ${data.location}
      - Area: ${data.projectAreaSqft || 0} Sqft
      - Timeline: ${data.timeline}
      - Land Ownership: ${data.landOwnership || 'Not Specified'}
      - Government Approvals: ${data.governmentApprovals || 'Not Specified'}
      - Architect Hired: ${data.architectHired || 'Not Specified'}
      - Architect Details Provided: ${data.architectDetailsProvided ? 'Yes' : 'No'}
      - Drawings Uploaded Count: ${data.drawingsUploadedCount || 0}
      
      Respond STRICTLY in JSON format without markdown blocks:
      {
        "score": 85,
        "category": "HOT",
        "reason": "Brief summary of why it falls in this category."
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
