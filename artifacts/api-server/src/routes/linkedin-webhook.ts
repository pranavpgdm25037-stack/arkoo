import { Router, type Request, type Response } from "express";
import crypto from "crypto";
import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";
import { ilike } from "drizzle-orm";
import { qualifyLead, type LeadInputData } from "../services/ai-qualification";
import fs from "fs";
import path from "path";

const router = Router();

// ============================================================
// LINKEDIN LEAD GEN WEBHOOK HANDLER
// ============================================================
//
// SETUP INSTRUCTIONS:
// -------------------------------------------------------------------
// 1. Go to https://www.linkedin.com/developers/apps → Create App
//    - App Name: Arkoo CRM Lead Receiver
//    - Company: Arkoo Infra Trade Pvt Ltd
//    - Privacy Policy URL: https://arkooprebuild.com/privacy
//
// 2. Under Products tab → Request access to "Lead Gen Forms API"
//    (LinkedIn requires manual approval — takes 1-5 business days)
//
// 3. Under Auth tab → Add OAuth 2.0 scopes:
//    - r_liteprofile, r_emailaddress, r_1st3connections_size
//    - rw_leads, r_ads_leadgen_automation
//
// 4. Under Webhooks tab (after Lead Gen API approval):
//    - Click "Add Webhook"
//    - URL: https://YOUR-DOMAIN/api/webhooks/linkedin
//    - Events: "Lead Gen Form Response"
//    - Click "Verify"
//
// 5. LinkedIn will POST a challenge JSON body to your webhook.
//    Our handler responds with the challenge value automatically.
//
// 6. Copy the CLIENT_ID, CLIENT_SECRET, and WEBHOOK_SECRET into .env
// -------------------------------------------------------------------

const LINKEDIN_CLIENT_ID     = process.env.LINKEDIN_CLIENT_ID     || "";
const LINKEDIN_CLIENT_SECRET = process.env.LINKEDIN_CLIENT_SECRET || "";
const LINKEDIN_WEBHOOK_SECRET = process.env.LINKEDIN_WEBHOOK_SECRET || "arkoo_linkedin_secret_2026";
const LINKEDIN_REDIRECT_URI  = process.env.LINKEDIN_REDIRECT_URI  || "https://arkoo-infra.onrender.com/api/webhooks/linkedin/callback";

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

// ─── LINKEDIN SIGNATURE VERIFICATION ────────────────────────────────────────
// LinkedIn signs every webhook POST with HMAC-SHA256 using your webhook secret.
// The signature is in the 'x-li-signature' header (Base64 encoded).
function verifyLinkedInSignature(rawBody: Buffer, signature: string): boolean {
  if (!LINKEDIN_WEBHOOK_SECRET || !signature) return false;
  try {
    const expected = crypto
      .createHmac("sha256", LINKEDIN_WEBHOOK_SECRET)
      .update(rawBody)
      .digest("base64");
    return crypto.timingSafeEqual(
      Buffer.from(expected),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

// ─── ROUTE 1: LINKEDIN OAUTH — Authorization URL Generator ─────────────────
// Call this to generate the OAuth login URL for your LinkedIn App
// Usage: GET /api/webhooks/linkedin/auth-url
router.get("/webhooks/linkedin/auth-url", (req: Request, res: Response) => {
  if (!LINKEDIN_CLIENT_ID) {
    return res.status(400).json({
      error: "LINKEDIN_CLIENT_ID not set in environment",
      instructions: "Add LINKEDIN_CLIENT_ID to your .env file from the LinkedIn Developer Console",
    });
  }

  const scopes = [
    "r_liteprofile",
    "r_emailaddress",
    "rw_leads",
    "r_ads_leadgen_automation",
  ].join("%20");

  const state = crypto.randomBytes(16).toString("hex");
  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(LINKEDIN_REDIRECT_URI)}&scope=${scopes}&state=${state}`;

  console.log("\n🔗 [LINKEDIN] OAuth Authorization URL generated");
  console.log(`   URL: ${authUrl}`);

  return res.status(200).json({
    message: "Open this URL in your browser to authorize the LinkedIn App",
    authorizationUrl: authUrl,
    state,
    nextStep: `After login, LinkedIn will redirect to ${LINKEDIN_REDIRECT_URI}?code=XXX — use that code to call /api/webhooks/linkedin/callback`,
  });
});

// ─── ROUTE 2: LINKEDIN OAUTH — Callback Handler ─────────────────────────────
// LinkedIn redirects here after the user approves the app
// Exchanges the authorization code for an access token
router.get("/webhooks/linkedin/callback", async (req: Request, res: Response) => {
  const { code, state, error } = req.query as Record<string, string>;

  if (error) {
    return res.status(400).json({ error: `LinkedIn OAuth denied: ${error}` });
  }
  if (!code) {
    return res.status(400).json({ error: "No authorization code received from LinkedIn" });
  }

  try {
    console.log("\n🔗 [LINKEDIN] OAuth callback received — exchanging code for access token...");

    const tokenRes = await fetch("https://www.linkedin.com/oauth/v2/accessToken", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        redirect_uri:  LINKEDIN_REDIRECT_URI,
        client_id:     LINKEDIN_CLIENT_ID,
        client_secret: LINKEDIN_CLIENT_SECRET,
      }),
    });

    const tokenData = await tokenRes.json() as any;

    if (tokenData.error) {
      return res.status(400).json({ error: "Token exchange failed", details: tokenData });
    }

    const accessToken = tokenData.access_token;
    console.log("✅ [LINKEDIN] Access token obtained successfully!");
    console.log("   Add this to your .env as LINKEDIN_ACCESS_TOKEN (expires in ~60 days):");
    console.log(`   LINKEDIN_ACCESS_TOKEN="${accessToken}"`);

    return res.status(200).json({
      success: true,
      message: "LinkedIn access token obtained! Copy the token to your .env file.",
      accessToken,
      expiresIn: tokenData.expires_in,
      refreshToken: tokenData.refresh_token || "Not provided (re-auth required after expiry)",
      nextStep: "Store LINKEDIN_ACCESS_TOKEN in your .env, then use /api/webhooks/linkedin to receive leads",
    });

  } catch (err: any) {
    return res.status(500).json({ error: "Token exchange failed", details: err.message });
  }
});

// ─── ROUTE 3: LINKEDIN WEBHOOK — Lead Gen Event Receiver (POST) ─────────────
// LinkedIn POSTs lead data here when someone fills a Lead Gen Form on your
// LinkedIn Company Page ad: https://www.linkedin.com/company/arkoo-infra-trade-pvt-ltd/
router.post("/webhooks/linkedin", async (req: Request, res: Response) => {
  try {
    // ── LinkedIn Challenge Verification ──────────────────────────────────────
    // When you register the webhook in LinkedIn Developer Console,
    // LinkedIn sends a challenge POST to verify you own the endpoint.
    const body = req.body;

    if (body.challengeCode) {
      console.log("\n🔵 [LINKEDIN] Challenge verification request received");
      console.log(`   Challenge: ${body.challengeCode}`);
      // LinkedIn expects: { "challengeCode": "same-value-they-sent" }
      return res.status(200).json({ challengeCode: body.challengeCode });
    }

    // ── Signature Verification ───────────────────────────────────────────────
    const liSignature = req.headers["x-li-signature"] as string || "";
    const rawBody = (req as any).rawBody as Buffer;

    if (rawBody && liSignature) {
      const isValid = verifyLinkedInSignature(rawBody, liSignature);
      if (!isValid) {
        console.error("❌ [LINKEDIN] Signature verification failed — possible spoofed request");
        return res.status(401).json({ error: "Invalid signature" });
      }
      console.log("✅ [LINKEDIN] Signature verified");
    }

    // ── Parse Lead Gen Form Response ─────────────────────────────────────────
    console.log("\n💼 [LINKEDIN] Incoming lead gen event:", JSON.stringify(body, null, 2));

    // LinkedIn Lead Gen Form payload structure:
    // { "elements": [{ "leadGenerationFormResponse": { ... }, "form": { "id": "..." } }] }
    const elements = body.elements || [];

    for (const element of elements) {
      const formResponse = element.leadGenerationFormResponse || {};
      const formId       = element.form?.id || "unknown";

      // Extract field values from LinkedIn's response schema
      const fieldValues: Record<string, string> = {};
      for (const fv of formResponse.fieldValues || []) {
        const fieldId = fv.profileField || fv.questionId || fv.customQuestionId || "unknown";
        fieldValues[fieldId] = fv.value || "";
      }

      // Map LinkedIn standard profile fields to our schema
      const firstName    = fieldValues["firstName"]     || fieldValues["FIRST_NAME"]     || "";
      const lastName     = fieldValues["lastName"]      || fieldValues["LAST_NAME"]      || "";
      const customerName = `${firstName} ${lastName}`.trim() || "LinkedIn Lead";
      const emailAddress = fieldValues["emailAddress"]  || fieldValues["EMAIL_ADDRESS"]  || "";
      const phoneNumber  = fieldValues["phoneNumber"]   || fieldValues["PHONE_NUMBER"]   ||
                           fieldValues["mobilePhone"]   || "";
      const companyName  = fieldValues["company"]       || fieldValues["COMPANY"]        || "";
      const jobTitle     = fieldValues["title"]         || fieldValues["JOB_TITLE"]      || "";
      const message      = fieldValues["message"]       || fieldValues["COMMENTS"]       ||
                           `LinkedIn Lead Gen from ${companyName} — ${jobTitle}`;

      console.log(`\n📋 [LINKEDIN] Lead parsed:`);
      console.log(`   Name: ${customerName} | Email: ${emailAddress} | Phone: ${phoneNumber}`);
      console.log(`   Company: ${companyName} | Title: ${jobTitle} | Form: ${formId}`);

      // Append to local ledger first (always runs)
      const ledgerEntry = {
        id: `LI-${formResponse.id || Date.now()}`,
        fullName: customerName,
        leadSource: "LinkedIn",
        contactInfo: { phone: phoneNumber, email: emailAddress },
        message,
        companyName,
        jobTitle,
        linkedInFormId: formId,
        linkedInResponseId: formResponse.id,
        timestamp: new Date().toISOString(),
        rawPayload: body,
      };
      appendToLedger(ledgerEntry);

      // Forward to main CRM ingestion endpoint
      if (customerName && (phoneNumber || emailAddress)) {
        try {
          const ingestRes = await fetch(
            `http://localhost:${process.env.PORT || 3002}/api/webhooks/arkoo-lead`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                leadSource: "LinkedIn",
                fullName: customerName,
                emailAddress,
                phoneNumber,
                requirements: message,
                projectLocation: fieldValues["location"] || "Not Specified",
              }),
            }
          );
          const ingestData = await ingestRes.json();
          console.log("✅ [LINKEDIN] Lead forwarded to CRM:", ingestData);
        } catch (fwdErr: any) {
          console.error("⚠️  [LINKEDIN] CRM forward failed:", fwdErr.message);
        }
      }
    }

    return res.status(200).json({ success: true, message: "LinkedIn lead(s) processed" });

  } catch (error: any) {
    console.error("❌ [LINKEDIN] Webhook error:", error.message);
    return res.status(500).json({ error: "LinkedIn webhook processing failed" });
  }
});

// ─── ROUTE 4: WEBHOOK REGISTRATION STATUS ────────────────────────────────────
// Check the current LinkedIn webhook registration status
// Usage: GET /api/webhooks/linkedin/status
router.get("/webhooks/linkedin/status", async (req: Request, res: Response) => {
  const accessToken = process.env.LINKEDIN_ACCESS_TOKEN || "";
  const appId       = LINKEDIN_CLIENT_ID;

  if (!accessToken || !appId) {
    return res.status(200).json({
      status: "NOT_CONFIGURED",
      message: "LinkedIn is not yet configured",
      missingVars: [
        !accessToken ? "LINKEDIN_ACCESS_TOKEN" : null,
        !appId       ? "LINKEDIN_CLIENT_ID"    : null,
      ].filter(Boolean),
      setupSteps: [
        "1. Go to https://developers.linkedin.com → Create App",
        "2. Request 'Lead Gen Forms API' product access",
        "3. Get Client ID and Client Secret → add to .env",
        "4. Call GET /api/webhooks/linkedin/auth-url → open URL in browser → authorize",
        "5. LinkedIn redirects to /api/webhooks/linkedin/callback → access token auto-saved",
        "6. Register webhook at https://developers.linkedin.com → Webhooks → Add Webhook",
        `   Webhook URL: https://arkoo-infra.onrender.com/api/webhooks/linkedin`,
        "7. LinkedIn will POST a challenge here → auto-verified",
      ],
      webhookUrl: "https://arkoo-infra.onrender.com/api/webhooks/linkedin",
    });
  }

  try {
    // List registered webhooks for this app
    const liRes = await fetch(
      `https://api.linkedin.com/rest/webhookSubscriptions?application=urn:li:developerApplication:${appId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "LinkedIn-Version": "202312",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );
    const liData = await liRes.json() as any;

    return res.status(200).json({
      status: "CONFIGURED",
      linkedInWebhooks: liData,
      webhookUrl: "https://arkoo-infra.onrender.com/api/webhooks/linkedin",
    });
  } catch (err: any) {
    return res.status(500).json({ error: "Could not fetch LinkedIn webhook status", details: err.message });
  }
});

export default router;
