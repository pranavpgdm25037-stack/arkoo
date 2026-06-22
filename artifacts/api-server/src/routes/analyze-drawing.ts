import { Router } from "express";
import { GoogleGenAI } from "@google/genai";
import fs from "fs";
import os from "os";
import path from "path";
import { extractTextFromBuffer } from "../services/ai-extraction";

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

router.post("/analyze-drawing", async (req, res) => {
  try {
    const { fileData, fileName, mimeType } = req.body;
    
    if (!fileData) {
       res.status(400).json({ error: "Missing file data" });
       return;
    }

    const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;
    
    // Detect the file mime type automatically based on the file extension
    const ext = path.extname(fileName || "").toLowerCase();
    let detectedMimeType = "application/pdf";
    if (ext === ".svg") detectedMimeType = "image/svg+xml";
    else if (ext === ".png") detectedMimeType = "image/png";
    else if (ext === ".jpg" || ext === ".jpeg") detectedMimeType = "image/jpeg";
    else if (ext === ".pdf") detectedMimeType = "application/pdf";
    else if (ext === ".docx") detectedMimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    else if (ext === ".xlsx") detectedMimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    else if (ext === ".xls") detectedMimeType = "application/vnd.ms-excel";
    else if (ext === ".csv") detectedMimeType = "text/csv";
    else if (ext === ".txt") detectedMimeType = "text/plain";

    const actualMimeType = mimeType || detectedMimeType;
    
    const ai = getAI();
    const prompt = `
      You are an expert Structural Engineer and Estimator for Arkoo Pre-Build.
      Analyze the attached architectural/structural drawing or project requirement document (PIF / RFQ) and extract the building parameters.
      If a specific value is not clearly written, do your best to estimate it based on standard conventions or return null.
      PAY CLOSE ATTENTION TO:
      1. Eave Height vs Ridge Height. Always extract EAVE HEIGHT or CLEAR SPAN HEIGHT as extractedHeight (e.g., 7.5m), NOT Ridge Height.
      2. Bay configuration and spacing (e.g., 10 bays @ 6m).
      3. EOT Crane span and capacity (e.g., 5T EOT Crane spanning Bays 3-8).
      4. Sliding doors and rolling shutters sizes and locations.
      5. Wind speed (e.g., 44 m/s) and Seismic Zones (e.g., Zone III).
      6. Roof/Wall insulation requirements.
      7. Client Name (Look for "Client:", "To:", "For:", or inside the Title Block).
      
      Respond STRICTLY in JSON format with the following keys exactly:
      {
        "extractedLength": number (in meters),
        "extractedWidth": number (in meters),
        "extractedHeight": number (in meters, EAVE height or CLEAR SPAN height only, NOT Ridge),
        "extractedAreaSqm": number (in square meters, length x width),
        "extractedFloors": number,
        "extractedStructuralType": string (e.g. "Steel PEB", "RCC", "Hybrid"),
        "mezzanineAreaSqm": number (in square meters, 0 if none),
        "extractedCanopySqm": number (in square meters, canopy length x width, 0 if none),
        "extractedSkylightSqm": number (in square meters, 0 if none),
        "extractedCraneCapacity": number (in tons, 0 if none),
        "extractedShutters": number (count of rolling shutters, 0 if none),
        "extractedTonnage": number (estimated steel weight in MT, null if not mentioned),
        "extractedBayConfig": string (e.g. "10 bays @ 6m", null if not found),
        "extractedCranes": string (Detailed description of cranes, e.g., "5T EOT crane spanning Bays 3-8", null if none),
        "extractedSlidingDoors": string (Description and sizes of sliding doors, e.g. "2 nos (6m x 5.5m)", null if none),
        "extractedRollingShuttersDesc": string (Description of rolling shutters, e.g. "1 no (4m x 4.2m) at Bay 5", null if none),
        "extractedInsulationRequired": boolean (true if roof/wall insulation is required, else false),
        "extractedWindSpeed": number (Wind speed in m/s, null if not specified),
        "extractedSeismicZone": string (e.g., "Zone III", null if not specified),
        "extractedClientName": string (The name of the client or company, null if not found)
      }
    `;

    const contents: any[] = [];
    const isTextBased = [
      "image/svg+xml",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/docx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/xlsx",
      "application/vnd.ms-excel",
      "text/csv",
      "text/plain"
    ].includes(actualMimeType) || actualMimeType.includes("spreadsheet") || actualMimeType.includes("excel") || actualMimeType.includes("wordprocessingml");

    if (isTextBased) {
      let textContent = "";
      if (actualMimeType === "image/svg+xml") {
        textContent = Buffer.from(base64Data, "base64").toString("utf-8");
      } else {
        const buffer = Buffer.from(base64Data, "base64");
        textContent = await extractTextFromBuffer(buffer, actualMimeType);
      }
      contents.push({ text: `Document content:\n${textContent}` });
    } else {
      // Step A: Upload the drawing file to Gemini Files API (for PDFs and Images)
      const tempFilePath = path.join(os.tmpdir(), fileName || "upload_drawing.pdf");
      fs.writeFileSync(tempFilePath, Buffer.from(base64Data, "base64"));
      
      const uploadResult = await ai.files.upload({
        file: tempFilePath,
        config: {
          mimeType: actualMimeType
        }
      });

      // Wait for file processing if necessary
      if (!uploadResult.name) {
        throw new Error("File upload failed, no name returned.");
      }
      let fileObj = await ai.files.get({ name: uploadResult.name });
      while (fileObj.state === "PROCESSING") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        fileObj = await ai.files.get({ name: uploadResult.name });
      }

      if (fileObj.state === "FAILED") {
        throw new Error("File processing failed.");
      }

      // Step B: Include fileUri with prompt
      contents.push({
        fileData: {
          fileUri: uploadResult.uri || fileObj.uri,
          mimeType: actualMimeType
        }
      });

      // Clean up the temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn("Failed to delete temp file:", err);
      }
    }
    contents.push(prompt);

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: contents,
      config: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const resultText = response.text || "{}";
    const parsed = JSON.parse(resultText);
    
    // Fill in derived area if missing
    if (!parsed.extractedAreaSqm && parsed.extractedLength && parsed.extractedWidth) {
      parsed.extractedAreaSqm = parsed.extractedLength * parsed.extractedWidth;
    }

    res.status(200).json(parsed);
  } catch (error: any) {
    console.error("Gemini Drawing Analysis Error:", error);
    res.status(500).json({ error: "Failed to analyze drawing" });
  }
});

router.get("/dev/load-test-file", async (req, res) => {
  try {
    const filename = req.query.filename as string;
    if (!filename) {
      res.status(400).json({ error: "Missing filename parameter" });
      return;
    }

    const allowedFiles = ["For PEB.pdf", "Layout.pdf", "PIF-1831-Rishi Vashi - R0.xlsx"];
    if (!allowedFiles.includes(filename)) {
      res.status(400).json({ error: "File not allowed" });
      return;
    }

    const filePath = path.join(process.cwd(), filename);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "File not found" });
      return;
    }

    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString("base64");
    
    let mimeType = "application/pdf";
    if (filename.endsWith(".xlsx")) {
      mimeType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    }

    res.status(200).json({
      fileName: filename,
      fileData: `data:${mimeType};base64,${base64Data}`,
      mimeType
    });
  } catch (error: any) {
    console.error("Load test file error:", error);
    res.status(500).json({ error: "Failed to load test file" });
  }
});

export default router;
