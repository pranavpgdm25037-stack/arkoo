import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";
import { ilike } from "drizzle-orm";
import { qualifyLead, type LeadInputData } from "../services/ai-qualification";
import fs from "fs";
import path from "path";

const router = Router();

// ============================================================
// META / INSTAGRAM WEBHOOK HANDLER
// ============================================================
//
// SETUP INSTRUCTIONS:
// -------------------------------------------------------------------
// 1. Go to https://developers.facebook.com/apps/
// 2. Create an App → "Business" type
// 3. Add Product: "Webhooks"
// 4. Under Webhooks → Page → Subscribe to "leadgen" field
// 5. Set Callback URL to: https://YOUR-DOMAIN/api/webhooks/meta
// 6. Set Verify Token to the value of META_VERIFY_TOKEN in your .env
// 7. Click "Verify and Save" — Meta will call the GET route below
// 8. Then connect your Facebook Page / Instagram Business Account
//
// INSTAGRAM LEAD ADS:
// - Go to Meta Ads Manager → Lead Center
// - Your Instagram ad leads will POST to this endpoint automatically
// -------------------------------------------------------------------

const META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "arkoo_meta_verify_2026";
const LEDGER_PATH = path.resolve(process.cwd(), "../../arkoo_leads.json");

function appendToLedger(entry: Record<string, any>): void {
  try {
    let existing: any[] = [];
    if (fs.existsSync(LEDGER_PATH)) {
      const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    }
    existing.push(entry);
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
  } catch (err: any) {
    console.error("⚠️  [LEDGER] Write failed:", err.message);
  }
}

// ─── STEP 1: META WEBHOOK VERIFICATION (GET) ────────────────────────────────
// Meta calls this once when you register your webhook in the Developer Console.
// It sends hub.mode, hub.verify_token, hub.challenge as query params.
// We respond with the challenge to prove we own the endpoint.
router.get("/webhooks/meta", (req: Request, res: Response) => {
  const mode      = req.query["hub.mode"] as string;
  const token     = req.query["hub.verify_token"] as string;
  const challenge = req.query["hub.challenge"] as string;

  console.log("\n🔵 [META] Webhook verification request received");
  console.log(`   Mode: ${mode} | Token Match: ${token === META_VERIFY_TOKEN}`);

  if (mode === "subscribe" && token === META_VERIFY_TOKEN) {
    console.log("✅ [META] Webhook verified successfully! Instagram is now connected.");
    return res.status(200).send(challenge); // Must respond with raw challenge string
  }

  console.error("❌ [META] Verification failed — token mismatch or wrong mode");
  return res.status(403).json({ error: "Verification failed. Token mismatch." });
});

// ─── STEP 2: META LEAD EVENT RECEIVER (POST) ────────────────────────────────
// Meta sends lead data here when someone fills a Lead Ad form on
// Instagram or Facebook. Payload contains 'entry' array with 'changes'.
router.post("/webhooks/meta", async (req: Request, res: Response) => {
  try {
    const body = req.body;

    console.log("\n📸 [META/INSTAGRAM] Incoming webhook event:", JSON.stringify(body, null, 2));

    // Meta sends a top-level 'object' field: "page" for Facebook, "instagram" for IG
    if (body.object !== "page" && body.object !== "instagram") {
      return res.status(200).send("EVENT_RECEIVED"); // Always respond 200 to Meta
    }

    // Process each entry (each entry is one page/account event)
    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {

        // Only process leadgen field changes
        if (change.field !== "leadgen") continue;

        const leadgenId = change.value?.leadgen_id;
        const pageId    = change.value?.page_id;
        const formId    = change.value?.form_id;
        const adId      = change.value?.ad_id;

        console.log(`\n📋 [META] New Lead Gen form submission received`);
        console.log(`   Lead ID: ${leadgenId} | Page: ${pageId} | Form: ${formId}`);

        // NOTE: In production, use the Meta Graph API to retrieve full lead details:
        // GET https://graph.facebook.com/{leadgen_id}?access_token={PAGE_ACCESS_TOKEN}
        // The webhook only sends IDs, not the actual field values for privacy.
        // The full lead data retrieval requires a PAGE_ACCESS_TOKEN.

        const ledgerEntry = {
          id: `META-${leadgenId || Date.now()}`,
          fullName: "Meta Lead (Retrieve via Graph API)",
          leadSource: "Instagram",
          contactInfo: { phone: "", email: "" },
          message: `Instagram Lead Ad submission. Lead ID: ${leadgenId}, Ad ID: ${adId}, Form ID: ${formId}`,
          metaLeadgenId: leadgenId,
          metaPageId: pageId,
          metaFormId: formId,
          metaAdId: adId,
          retrievalUrl: `https://graph.facebook.com/${leadgenId}?access_token=YOUR_PAGE_ACCESS_TOKEN`,
          timestamp: new Date().toISOString(),
          rawPayload: body,
        };

        appendToLedger(ledgerEntry);

        console.log("✅ [META] Lead event saved to ledger. Retrieve full details from Graph API:");
        console.log(`   GET https://graph.facebook.com/${leadgenId}?access_token=YOUR_PAGE_ACCESS_TOKEN`);
      }
    }

    // Always respond with 200 immediately — Meta will retry if you don't
    return res.status(200).send("EVENT_RECEIVED");

  } catch (error: any) {
    console.error("❌ [META] Webhook processing error:", error.message);
    return res.status(200).send("EVENT_RECEIVED"); // Always 200 to prevent Meta retries
  }
});

// ─── STEP 3: META LEAD RETRIEVAL ENDPOINT ───────────────────────────────────
// Helper endpoint: call this with a leadgen_id to fetch the full lead from Meta
// Usage: GET /api/webhooks/meta/retrieve-lead?leadgen_id=XXX&access_token=YYY
router.get("/webhooks/meta/retrieve-lead", async (req: Request, res: Response) => {
  const { leadgen_id, access_token } = req.query as Record<string, string>;

  if (!leadgen_id || !access_token) {
    return res.status(400).json({
      error: "Missing required params: leadgen_id and access_token",
      instructions: "Use your Meta Page Access Token from the Facebook Developer Console",
    });
  }

  try {
    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${leadgen_id}?access_token=${access_token}`
    );
    const leadData = await metaRes.json() as any;

    if (leadData.error) {
      return res.status(400).json({ error: "Meta API Error", details: leadData.error });
    }

    // Parse field_data array from Meta response
    const fields: Record<string, string> = {};
    for (const f of leadData.field_data || []) {
      fields[f.name] = f.values?.[0] || "";
    }

    const customerName = fields["full_name"] || fields["name"] || "Unknown";
    const emailAddress = fields["email"] || "";
    const phoneNumber  = fields["phone_number"] || fields["phone"] || "";
    const requirements = fields["comments"] || fields["message"] || fields["project_type"] || "";

    // Insert into CRM via existing webhook
    const internalPayload = {
      leadSource: "Instagram",
      fullName: customerName,
      emailAddress,
      phoneNumber,
      requirements,
      metaLeadgenId: leadgen_id,
    };

    const ingestRes = await fetch(`http://localhost:${process.env.PORT || 3002}/api/webhooks/arkoo-lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(internalPayload),
    });
    const ingestData = await ingestRes.json();

    return res.status(200).json({
      success: true,
      metaLeadData: { leadgen_id, fields },
      crmIngestion: ingestData,
    });

  } catch (err: any) {
    return res.status(500).json({ error: "Failed to retrieve lead from Meta", details: err.message });
  }
});

export default router;
