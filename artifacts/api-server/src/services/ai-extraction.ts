import { GoogleGenAI, Type, Schema } from "@google/genai";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");
import AdmZip from "adm-zip";
import { DOMParser } from "@xmldom/xmldom";
import XLSX from "xlsx";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const extractionSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    clientName: { type: Type.STRING, description: "Extracted from 'Client:' or 'Clint:'" },
    projectName: { type: Type.STRING, description: "Extracted from 'Project:'" },
    quoteRef: { type: Type.STRING, description: "Quote Reference Number, e.g., APBPL/PEB/EQ-XXXX" },
    date: { type: Type.STRING, description: "Extracted from 'Date:'" },
    phoneEmail: { type: Type.STRING, description: "Director contact phone and email in the letter sign-off" },
    structuralType: { type: Type.STRING, description: "Inferred from title: 'PEB Building', 'Mezzanine', 'Civil Works', 'Cold Storage', etc." },
    length: { type: Type.NUMBER, description: "Length (m) from Technical Specs table" },
    width: { type: Type.NUMBER, description: "Width (m) from Technical Specs table" },
    clearHeight: { type: Type.NUMBER, description: "Clear height from FFL (m) from Technical Specs table" },
    tonnage: { type: Type.NUMBER, description: "Approximate Tonnage from text just above pricing table" },
    mezzanineSqm: { type: Type.NUMBER, description: "Mezzanine area from Technical Specs table" },
    canopySqm: { type: Type.NUMBER, description: "Canopy from Technical Specs table" },
    skylightSqm: { type: Type.NUMBER, description: "Sky Light from Technical Specs table" },
    shutters: { type: Type.NUMBER, description: "Frame Opening for Rolling shutter count from Technical Specs table" },
    craneTons: { type: Type.NUMBER, description: "Crane capacity in Tons from Technical Specs table" },
    gstRate: { type: Type.NUMBER, description: "GST rate percentage (e.g. 18 or 12) from payment terms" },
    civilScope: { type: Type.STRING, description: "If document mentions civil works, 'In-Scope', else 'Out-of-Scope'" },
    hasClintTypo: { type: Type.BOOLEAN, description: "True if the document literally contains the typo 'Clint:' instead of 'Client:'" },
    hasDuplicateIntro: { type: Type.BOOLEAN, description: "True if the paragraph 'This proposal is indexed for easy reference...' appears more than once in the document." },
    hasInsulation: { type: Type.BOOLEAN, description: "True if document mentions 'Insulation', 'PUF', or 'rockwool'" },
    hasGlassFacade: { type: Type.BOOLEAN, description: "True if document mentions 'Glass', 'glazing', or 'curtain wall'" },
    hasSolar: { type: Type.BOOLEAN, description: "True if document mentions 'Solar' or 'photovoltaic'" },
    hasHVAC: { type: Type.BOOLEAN, description: "True if document mentions 'HVAC', 'VRF', or 'air conditioning'" }
  },
  required: [
    "clientName", "projectName", "quoteRef", "date", "phoneEmail", "structuralType", 
    "length", "width", "clearHeight", "tonnage", "mezzanineSqm", "canopySqm", 
    "skylightSqm", "shutters", "craneTons", "gstRate", "civilScope", "hasClintTypo", 
    "hasDuplicateIntro", "hasInsulation", "hasGlassFacade", "hasSolar", "hasHVAC"
  ]
};

export async function extractTextFromBuffer(buffer: Buffer, mimetype: string): Promise<string> {
  if (mimetype === "application/pdf") {
    try {
      const data = await pdfParse(buffer);
      return data.text;
    } catch (e) {
      console.error("PDF Parse error", e);
      throw new Error("Could not parse PDF");
    }
  } else if (mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" || mimetype === "application/docx") {
    try {
      const zip = new AdmZip(buffer);
      const documentXmlEntry = zip.getEntries().find((e: any) => e.entryName === "word/document.xml");
      if (!documentXmlEntry) throw new Error("Invalid docx format");
      
      const xml = documentXmlEntry.getData().toString("utf8");
      // Use xmldom to get text
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, "text/xml");
      const paragraphs = doc.getElementsByTagName("w:p");
      
      let text = "";
      for (let i = 0; i < paragraphs.length; i++) {
        const tNodes = paragraphs[i].getElementsByTagName("w:t");
        let pText = "";
        for (let j = 0; j < tNodes.length; j++) {
          pText += tNodes[j].textContent;
        }
        text += pText + "\n";
      }
      return text;
    } catch (e) {
      console.error("DOCX Parse error", e);
      throw new Error("Could not parse DOCX");
    }
  } else if (mimetype === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || mimetype === "application/xlsx" || mimetype === "application/vnd.ms-excel" || mimetype.includes("spreadsheet") || mimetype.includes("excel")) {
    try {
      const workbook = XLSX.read(buffer, { type: "buffer" });
      let text = "";
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        text += `\n--- Sheet: ${sheetName} ---\n`;
        text += XLSX.utils.sheet_to_txt(sheet);
      }
      return text;
    } catch (e) {
      console.error("XLSX Parse error", e);
      throw new Error("Could not parse XLSX");
    }
  } else if (mimetype === "text/csv" || mimetype === "text/plain") {
    return buffer.toString("utf-8");
  } else {
    throw new Error("Unsupported file format");
  }
}

export async function extractQuotationData(text: string) {
  // Use Gemini to extract JSON
  try {
    const prompt = `You are an expert data extractor for APBPL (Arkoo Pre Build Pvt Ltd).
Analyze the following quotation document text and extract the required fields exactly as specified in the schema.
For numbers, output the numeric value (or 0 if not present).
For text fields, extract the exact string (or "" if not found).
Pay close attention to typos like "Clint:" instead of "Client:".
Check if the exact string "This proposal is indexed for easy reference" appears more than once.

Document Text:
=========================================
${text}
=========================================`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: extractionSchema,
        temperature: 0.1
      }
    });

    if (!response.text) throw new Error("No response from AI");
    const json = JSON.parse(response.text);
    return json;
  } catch (error) {
    console.error("AI Extraction error:", error);
    throw new Error("Failed to extract data using AI");
  }
}
