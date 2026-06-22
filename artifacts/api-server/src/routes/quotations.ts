import { Router } from "express";
import { generateQuotationHtml, generateQuotationPdf, type QuotationData } from "../services/quotation-engine";
import { requireAuth } from "../middleware/auth";
import { db, quotationsTable } from "@workspace/db";
import multer from "multer";
import { extractTextFromBuffer, extractQuotationData } from "../services/ai-extraction";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to generate and preview a quotation HTML
router.post("/quotations/preview", async (req, res) => {
  try {
    const data: QuotationData = req.body;
    
    // Basic validation
    if (!data.customerName || !data.projectType || !data.areaSqft || !data.ratePerSqft) {
       res.status(400).json({ error: "Missing required fields: customerName, projectType, areaSqft, ratePerSqft" });
       return;
    }

    const html = await generateQuotationHtml({
      ...data,
      taxRate: data.taxRate || 0.18 // Default to 18% GST for construction/steel
    });
    
    res.send(html);
  } catch (error) {
    console.error("Quotation Preview Error:", error);
    res.status(500).json({ error: "Failed to generate quotation preview" });
  }
});

// Endpoint for AI text extraction from uploaded quotation
router.post("/quotations/extract-quote", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    
    // Check if .doc
    if (req.file.originalname.endsWith(".doc")) {
       res.status(400).json({ error: "Old .doc format detected. Please open in MS Word, Save As .docx, and re-upload." });
       return;
    }

    const text = await extractTextFromBuffer(req.file.buffer, req.file.mimetype || (req.file.originalname.endsWith(".pdf") ? "application/pdf" : "application/docx"));
    const data = await extractQuotationData(text);
    
    res.status(200).json(data);
  } catch (error: any) {
    console.error("Extraction error:", error);
    if (error.message === "Unsupported file format" || error.message.includes("Could not parse")) {
       res.status(400).json({ error: "This does not appear to be an APBPL quotation document. Please upload a valid quote file." });
    } else {
       res.status(500).json({ error: "Failed to extract quotation data" });
    }
  }
});

// Endpoint to generate PDF and save it
router.post("/quotations/generate", async (req, res) => {
  try {
    const data: QuotationData = req.body;
    
    if (!data.customerName || !data.projectType || !data.areaSqft || !data.ratePerSqft) {
       res.status(400).json({ error: "Missing required fields: customerName, projectType, areaSqft, ratePerSqft" });
       return;
    }

    const pdfUrl = await generateQuotationPdf({
      ...data,
      taxRate: data.taxRate || 0.18
    });

    // Save to DB
    try {
      await db.insert(quotationsTable).values({
        projectId: data.projectId || null, // Assuming projectId is passed or optional
        pdfUrl: pdfUrl,
        totalAmount: (data.areaSqft * data.ratePerSqft * (1 + (data.taxRate || 0.18))).toString(),
        status: "generated"
      });
    } catch (dbError) {
      console.error("Error saving quotation to DB:", dbError);
    }
    
    res.status(200).json({
      success: true,
      message: "Quotation generated successfully",
      pdfUrl: pdfUrl
    });
  } catch (error) {
    console.error("Quotation Generation Error:", error);
    res.status(500).json({ error: "Failed to generate quotation PDF" });
  }
});

export default router;
