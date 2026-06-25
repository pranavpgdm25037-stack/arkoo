import { Router } from "express";
import { db, leadsTable, projectsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import path from "path";
import os from "os";

const router = Router();

let ai: GoogleGenAI | null = null;
function getAI() {
  if (!ai) {
    ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY || "YOUR_GEMINI_API_KEY_HERE"
    });
  }
  return ai;
}

router.post("/bom/generate/:leadId", async (req, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    if (isNaN(leadId)) {
      res.status(400).json({ error: "Invalid leadId" });
      return;
    }

    // 1. Fetch Lead
    const leads = await db.select().from(leadsTable).where(eq(leadsTable.id, leadId)).limit(1);
    if (leads.length === 0) {
      res.status(404).json({ error: "Lead not found" });
      return;
    }
    const lead = leads[0];
    const rawData = lead.rawData as any;

    if (!rawData || !rawData.uploadedDocuments || Object.keys(rawData.uploadedDocuments).length === 0) {
      res.status(400).json({ error: "No drawings uploaded for this lead." });
      return;
    }

    // 2. Prepare Gemini Prompt
    const ai = getAI();
    const prompt = `
      You are an expert Structural Engineer and Estimator for Arkoo Pre-Build.
      You are provided with architectural/structural/tender drawings.
      Analyze them carefully and generate a comprehensive Bill of Materials (BOM).
      Include:
      1. Primary Structural Members (Columns, Rafters, etc.) with estimated quantities/weights if possible.
      2. Secondary Members (Purlins, Girts, etc.)
      3. Sheeting & Insulation (Roof & Wall sheeting, skylights, insulation types)
      4. Accessories (Rolling shutters, sliding doors, cranes, gutters, downpipes)
      
      Output the BOM in a structured, readable Markdown format with tables where appropriate.
    `;

    const contents: any[] = [];
    contents.push(prompt);

    // 3. Process Uploaded Files
    // The uploadedDocuments object contains keys like 'fileArchitectural', 'fileTender', 'fileSupporting'
    // Values are like '/uploads/filename.pdf'
    for (const fileUrl of Object.values(rawData.uploadedDocuments) as string[]) {
      const filename = path.basename(fileUrl);
      const filePath = path.resolve(__dirname, "../../../../uploads", filename);
      
      if (!fs.existsSync(filePath)) {
        console.warn("File not found for BOM generation:", filePath);
        continue;
      }

      const ext = path.extname(filename).toLowerCase();
      let mimeType = "application/pdf";
      if (ext === ".png") mimeType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";
      else if (ext === ".svg") mimeType = "image/svg+xml";

      // Upload to Gemini File API
      const uploadResult = await ai.files.upload({
        file: filePath,
        config: { mimeType }
      });

      if (!uploadResult.name) {
        console.warn("Upload failed for:", filename);
        continue;
      }

      let fileObj = await ai.files.get({ name: uploadResult.name });
      while (fileObj.state === "PROCESSING") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        fileObj = await ai.files.get({ name: uploadResult.name });
      }

      if (fileObj.state === "FAILED") {
        console.warn("File processing failed for:", filename);
        continue;
      }

      contents.push({
        fileData: {
          fileUri: uploadResult.uri || fileObj.uri,
          mimeType
        }
      });
    }

    if (contents.length === 1) {
      res.status(500).json({ error: "Failed to process the uploaded files for AI." });
      return;
    }

    // 4. Generate BOM
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: contents,
    });

    const bomText = response.text || "Failed to generate BOM.";

    // 5. Save BOM to leadsTable rawData
    const updatedRawData = { ...rawData, generatedBOM: bomText };
    await db.update(leadsTable)
      .set({ rawData: updatedRawData })
      .where(eq(leadsTable.id, lead.id));

    res.status(200).json({ success: true, bom: bomText });
  } catch (error: any) {
    console.error("BOM Generation Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate BOM" });
  }
});

export default router;
