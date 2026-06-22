import { Router } from "express";
import { qualifyLead, type LeadInputData } from "../services/ai-qualification";
import { requireAuth } from "../middleware/auth";
import { notifySalesTeamOfHotLead, sendWhatsAppMessage } from "../services/notifications";
import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";

const router = Router();

// Ingestion endpoint for Meta / Web forms / Zapier
router.post("/webhooks/ingest", async (req, res) => {
  try {
    const rawData = req.body;
    
    // Normalize incoming data (Assuming a standard format is mapped before this or sent from the website)
    const leadInput: LeadInputData = {
      source: rawData.source || "website",
      name: rawData.name || "Unknown",
      contactInfo: rawData.contactInfo || rawData.email || rawData.phone || "",
      budget: Number(rawData.budget) || 0,
      location: rawData.location || "",
      projectAreaSqft: Number(rawData.projectAreaSqft) || null,
      projectType: rawData.projectType || "Not Specified",
      timeline: rawData.timeline || "Not Specified",
      rawDetails: JSON.stringify(rawData)
    };

    // 1. Run AI Qualification Engine
    const qualification = await qualifyLead(leadInput);

    // 2. Insert into DB
    let leadId: number;
    try {
      const [lead] = await db.insert(leadsTable).values({
        source: leadInput.source,
        rawData: rawData,
        aiScore: qualification.score,
        aiCategory: qualification.category,
        status: "New"
      }).returning();

      leadId = lead.id;

      const [customer] = await db.insert(customersTable).values({
        leadId: lead.id,
        name: leadInput.name,
        contactInfo: typeof leadInput.contactInfo === 'string' ? JSON.stringify({ contact: leadInput.contactInfo }) : JSON.stringify(leadInput.contactInfo),
        address: leadInput.location
      }).returning();

      await db.insert(projectsTable).values({
        customerId: customer.id,
        type: leadInput.projectType,
        areaSqft: leadInput.projectAreaSqft,
        budget: leadInput.budget.toString(),
        timeline: leadInput.timeline
      });
    } catch (error: any) {
      console.error("Error saving lead to DB:", error);
      // We continue to notifications even if DB fails for now, or you might want to return 500
    }

    // 3. Trigger Notification / Auto-Assign (Phase 6)
    
    if (qualification.category === "HOT") {
      await notifySalesTeamOfHotLead(leadInput.name, leadInput.budget, leadInput.location);
    }

    // Optionally send an auto-reply to the customer
    if (leadInput.contactInfo.includes("+")) {
      await sendWhatsAppMessage(leadInput.contactInfo, `Hi ${leadInput.name}, thank you for reaching out to Arkoo! We have received your project details and our design team will contact you shortly.`);
    }
    
    // Return success to the webhook provider
    res.status(200).json({ 
      success: true, 
      message: "Lead ingested and qualified successfully",
      qualification
    });

  } catch (error) {
    console.error("Webhook ingestion error:", error);
    res.status(500).json({ error: "Internal Server Error during lead ingestion" });
  }
});

export default router;
