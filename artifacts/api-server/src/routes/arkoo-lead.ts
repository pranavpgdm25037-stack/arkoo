import { Router } from "express";
import nodemailer from "nodemailer";
import { db, leadsTable, customersTable, projectsTable } from "@workspace/db";
import { ilike, eq, desc } from "drizzle-orm";
import { qualifyLead, type LeadInputData } from "../services/ai-qualification";
import fs from "fs";
import path from "path";
import multer from "multer";

const router = Router();

// Configure Multer for File Uploads (Memory Storage for DB Base64)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit per file
});

// ============================================================
// LOCAL LEDGER CONFIGURATION
// Persists every lead to a secure local JSON file regardless
// of Supabase connectivity status.
// ============================================================
const LEDGER_PATH = path.resolve(process.cwd(), "../../arkoo_leads.json");

function writeToLocalLedger(leadEntry: Record<string, any>): void {
  try {
    let existing: any[] = [];
    if (fs.existsSync(LEDGER_PATH)) {
      const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
      existing = JSON.parse(raw);
      if (!Array.isArray(existing)) existing = [];
    }
    existing.push(leadEntry);
    fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
    console.log(`\n✅ [ARKOO LEADS LEDGER] Lead saved to local ledger → ID #${existing.length}`);
    console.log(`   Source: ${leadEntry.leadSource} | Name: ${leadEntry.fullName} | Contact: ${leadEntry.contactInfo}`);
  } catch (err: any) {
    console.error("⚠️  [ARKOO LEADS LEDGER] Failed to write to local ledger:", err.message);
  }
}

// Normalize lead source names from various API payload formats
function normalizeLeadSource(raw: string): string {
  const l = raw.toLowerCase().trim();
  if (l.includes("landing page") || l.includes("landing")) return "Landing Page";
  if (l.includes("instagram") || l.includes("meta") || l === "ig" || l.startsWith("ig ")) return "Instagram";
  if (l.includes("linkedin") || l === "li" || l.startsWith("li ") || l.includes("lead gen")) return "LinkedIn";
  if (l.includes("google") || l.includes("forms") || l.includes("sheets")) return "Google Forms";
  if (l.includes("arkoo lms") || l.includes("lms form") || l.includes("arkoo form")) return "Arkoo LMS Form";
  if (l.includes("website") || l.includes("web") || l.includes("contact")) return "Website";
  return raw.trim() || "Website";
}

const getSmtpUser = () => process.env.SMTP_USER || process.env.GMAIL_USER || 'arkooprebuildai@gmail.com';

// ============================================================
// EMAIL SENDING — Dual-path: Resend HTTP API (Render) + SMTP fallback (local)
// ============================================================

/**
 * Send email via Resend HTTP API (works on Render — uses port 443).
 */
async function sendEmailViaResend(options: { from: string; to: string; subject: string; html: string; text?: string; replyTo?: string }): Promise<{ messageId: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set');

  const payload: any = {
    from: options.from,
    to: [options.to],
    subject: options.subject,
    html: options.html,
  };
  if (options.text) payload.text = options.text;
  if (options.replyTo) payload.reply_to = options.replyTo;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Resend API error (${response.status}): ${errorBody}`);
  }
  const result = await response.json() as any;
  return { messageId: result.id || 'resend-ok' };
}

/**
 * Unified email sender: tries Resend first (HTTP API), falls back to SMTP.
 */
async function sendLeadEmail(options: { from: string; to: string; subject: string; html: string; text?: string; replyTo?: string; headers?: Record<string, string>; attachments?: any[] }): Promise<{ messageId: string }> {
  // Primary: Resend HTTP API (works on Render)
  if (process.env.RESEND_API_KEY) {
    // Replace sender with verified Resend domain
    const resendFrom = `"Arkoo Prebuild" <info@mansam.cloud>`;
    console.log(`[LEAD EMAIL] Sending via Resend to ${options.to}...`);
    const result = await sendEmailViaResend({ ...options, from: resendFrom });
    console.log(`[LEAD EMAIL] ✅ Sent via Resend: ${result.messageId}`);
    return result;
  }

  // Fallback: SMTP (works locally)
  console.log(`[LEAD EMAIL] Sending via SMTP to ${options.to}...`);
  const user = getSmtpUser();
  const pass = (process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD || 'suzvwpodhtuencza').replace(/\s/g, "");
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true';

  const transporter = nodemailer.createTransport({
    host, port, secure,
    auth: { user, pass },
    socketTimeout: 30000,
    connectionTimeout: 30000,
  });

  const info = await transporter.sendMail(options);
  console.log(`[LEAD EMAIL] ✅ Sent via SMTP: ${info.messageId}`);
  return { messageId: info.messageId };
}

// Helper function to extract structured project details from free-text requirements
function parseRequirements(requirements: string) {
  let projectType = "PEB Structure"; // default for Arkoo Prebuild
  let projectLocation = "Not Specified";
  let projectAreaSqft = 0;
  let estimatedBudget = "0";
  let completionTimeline = "Not Specified";

  const reqLower = requirements.toLowerCase();

  // 1. Extract Project Type
  if (reqLower.includes("warehouse") || reqLower.includes("godown")) {
    projectType = "PEB Warehouse";
  } else if (reqLower.includes("factory") || reqLower.includes("shed")) {
    projectType = "Industrial Shed";
  } else if (reqLower.includes("commercial") || reqLower.includes("office") || reqLower.includes("shop")) {
    projectType = "Commercial Space";
  } else if (reqLower.includes("interior") || reqLower.includes("office fitout")) {
    projectType = "Interior Design";
  } else if (reqLower.includes("peb") || reqLower.includes("prebuild") || reqLower.includes("pre-engineered")) {
    projectType = "PEB Structure";
  }

  // 2. Extract Project Area in Sq. Ft.
  const areaRegex = /(\d+[,.\d]*)\s*(?:sqft|sq\s*ft|sq\.?\s*ft\.?|square\s*feet|sqmtrs)/i;
  const areaMatch = requirements.match(areaRegex);
  if (areaMatch) {
    projectAreaSqft = parseInt(areaMatch[1].replace(/,/g, "")) || 0;
  }

  // 3. Extract Location (Look for premium and other target cities)
  const premiumLocations = ["pune", "goa", "nagpur", "chakan", "mumbai", "navi mumbai", "thane", "satara", "kolhapur"];
  for (const loc of premiumLocations) {
    if (reqLower.includes(loc)) {
      projectLocation = loc.charAt(0).toUpperCase() + loc.slice(1);
      break;
    }
  }
  if (projectLocation === "Not Specified") {
    const locationRegex = /(?:in|at|location:?)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/;
    const locationMatch = requirements.match(locationRegex);
    if (locationMatch) {
      projectLocation = locationMatch[1];
    }
  }

  // 4. Extract Budget (Lakhs or Crores)
  const budgetRegex = /(\d+[,.\d]*)\s*(?:lakh|lakhs|l|cr|crore|crores)\b/i;
  const budgetMatch = requirements.match(budgetRegex);
  if (budgetMatch) {
    const val = parseFloat(budgetMatch[1]);
    const unit = budgetMatch[0].toLowerCase();
    if (unit.includes("cr") || unit.includes("crore")) {
      estimatedBudget = `${val} Cr`;
    } else {
      estimatedBudget = `${val} Lakhs`;
    }
  }

  // 5. Extract Timeline
  if (reqLower.includes("immediate") || reqLower.includes("urgent") || reqLower.includes("asap")) {
    completionTimeline = "Immediate";
  } else if (reqLower.includes("month") || reqLower.includes("months")) {
    const monthRegex = /(\d+)\s*(?:month|months)/i;
    const monthMatch = requirements.match(monthRegex);
    if (monthMatch) {
      completionTimeline = `${monthMatch[1]} Months`;
    } else {
      completionTimeline = "1-3 Months";
    }
  }

  return {
    projectType,
    projectLocation,
    projectAreaSqft,
    estimatedBudget,
    completionTimeline
  };
}

// ============================================================
// BASE URL DETECTION — works with localhost, ngrok, or domain
// The /apply form is served by THIS Express server, so the base URL
// is simply the server's own host. No port-swapping needed.
// Priority: APP_BASE_URL env > X-Forwarded-Host (ngrok/proxy) > Host header
// ============================================================
function detectBaseUrl(req: any): string {
  // Always use the live frontend URL in production
  return process.env.APP_BASE_URL || "https://ubiquitous-fox-d6f702.netlify.app";
}

// ============================================================
// CUSTOMER DETAILED FORM EMAIL OUTBOX HANDLER
// ============================================================
async function sendCustomerEmail(customerName: string, emailAddress: string, phoneNumber: string, leadId: string, baseUrl: string, extraData?: any): Promise<string | null> {
  if (!emailAddress) return null;
  
  const queryObj: any = {
    name: customerName,
    email: emailAddress,
    phone: phoneNumber || "",
    leadId: leadId
  };

  if (extraData) {
    if (extraData.projectlocation && extraData.projectlocation !== 'Not Specified') queryObj.loc = extraData.projectlocation;
    if (extraData.projecttype && extraData.projecttype !== 'PEB Structure') queryObj.ptype = extraData.projecttype;
    if (extraData.proposedarea && extraData.proposedarea > 0) queryObj.area = extraData.proposedarea;
    if (extraData.estimatedbudget && extraData.estimatedbudget !== '0' && extraData.estimatedbudget !== 'Not Specified') queryObj.budget = extraData.estimatedbudget;
    if (extraData.completiontimeline && extraData.completiontimeline !== 'Not Specified') queryObj.timeline = extraData.completiontimeline;
  }

  const queryParams = new URLSearchParams(queryObj).toString();
  const formUrl = `${baseUrl}/apply?${queryParams}`;

  const textContent = `Hi ${customerName},

Thanks for reaching out to us at Arkoo Prebuild regarding your project. I received your enquiry and would love to help you get started on the layout designs.

To help our engineering team draft a custom design layout and feasibility report for you, could you please take a minute to fill in your project specifications here?
Open Project Specification Form: ${formUrl}

Please submit this at your earliest convenience so I can pass it to our drafting division.
Let me know if you have any questions!

Best regards,
Arkoo Prebuild Team
Arkoo Pre-Build Pvt. Ltd.`;

  const customerHtmlContent = `
  <div style="font-family: Calibri, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #222222; max-width: 600px;">
    <p>Hi ${customerName},</p>
    <p>Thanks for reaching out to us at Arkoo Prebuild regarding your project. I received your enquiry and would love to help you get started on the layout designs.</p>
    <p>To help our engineering team draft a custom design layout and feasibility report for you, could you please take a minute to fill in your project specifications here?</p>
    <p style="margin: 20px 0;">
      👉 <a href="${formUrl}" style="color: #1a0dab; font-weight: bold; text-decoration: underline; font-size: 16px;">Open Project Specification Form</a>
    </p>
    <p>Please submit this at your earliest convenience so I can pass it to our drafting division.</p>
    <p>Let me know if you have any questions!</p>
    <br>
    <p>Best regards,</p>
    <p><strong>Arkoo Prebuild Team</strong><br>
    Arkoo Pre-Build Pvt. Ltd.</p>
  </div>
  `;

  try {
    const info = await sendLeadEmail({
      from: `"ARKOO Prebuild Team" <${getSmtpUser()}>`,
      to: emailAddress,
      subject: `Next Steps: Your Arkoo Prebuild Technical Layout Request`,
      text: textContent,
      html: customerHtmlContent,
    });
    console.log(`[CUSTOMER EMAIL] Form link sent successfully to ${emailAddress}: ${info.messageId}`);
    return null; 
  } catch (error: any) {
    console.error(`⚠️ Failed to send customer email to ${emailAddress}:`, error.message);
    return null;
  }
}

const handleArkooLead = async (req: any, res: any) => {
  try {
    const data = req.body;

    // Normalize nested landing page data structure if present
    if (data.contact) {
      data.name = data.contact.name;
      data.phone = data.contact.phone;
      data.email = data.contact.email;
    }
    if (data.project) {
      data.projectLocation = data.project.location;
      data.projectType = data.project.type;
      data.projectAreaSqft = data.project.area;
      data.estimatedBudget = data.project.budget;
      data.completionTimeline = data.project.completionTime;
      data.requirements = `Project Type: ${data.project.type}\nLocation: ${data.project.location}\nArea: ${data.project.area} Sq. Ft.\nBudget: ${data.project.budget}\nTimeline: ${data.project.completionTime}`;
    }

    // 1. Validation & Mapping: Support Website, Instagram, LinkedIn, Google Forms payloads
    // Instagram Graph API uses 'name', 'phone_number', 'email', 'retailer_item_id'
    // LinkedIn Lead Gen uses 'firstName'+'lastName', 'phoneNumbers', 'emailAddress'
    const rawSource = String(data.leadSource || data['Lead Source'] || data.source || data.channel || "Website").trim();
    const leadSource = normalizeLeadSource(rawSource);

    // Name normalization: handle LinkedIn split names
    const linkedInFullName = (data.firstName || data.first_name) && (data.lastName || data.last_name)
      ? `${data.firstName || data.first_name} ${data.lastName || data.last_name}`.trim()
      : null;
    const customerName = String(
      linkedInFullName ||
      data.fullName || data['Full Name'] || data['Customer Name'] ||
      data.name || "Not Specified"
    ).trim();

    // Email normalization: handle LinkedIn array of emails
    const rawEmail = data.emailAddress || data['Email Address'] || data.email ||
      (Array.isArray(data.emailAddresses) ? data.emailAddresses[0] : undefined) || "";
    let emailAddress = String(rawEmail).trim();
    if (emailAddress.toLowerCase() === "null" || emailAddress.toLowerCase() === "undefined") {
      emailAddress = "";
    }

    // Phone normalization: handle LinkedIn array of phones
    const rawPhone = data.phoneNumber || data['Phone Number'] || data.phone || data.phone_number ||
      (Array.isArray(data.phoneNumbers) ? data.phoneNumbers[0] : undefined) ||
      (data.phone_numbers && data.phone_numbers[0]) || "";
    let phoneNumber = String(rawPhone).trim();
    if (phoneNumber.toLowerCase() === "null" || phoneNumber.toLowerCase() === "undefined") {
      phoneNumber = "";
    }

    // Message/inquiry normalization from all sources
    const requirementsBase = data.requirements || data['Requirements'] || data['Customer Requirements'] ||
      data.message || data.inquiry || data.comments || data.note || "";
    const igAdTag = data.retailer_item_id ? ` [Instagram Ad: ${data.retailer_item_id}]` : "";
    const requirements = String(requirementsBase + igAdTag).trim();

    if (!customerName || customerName === "Not Specified") {
      return res.status(400).json({ error: "Missing required field: Full Name" });
    }
    // Allow phone OR email as a valid contact (Instagram/LinkedIn may not always provide phone)
    if (!phoneNumber && !emailAddress) {
      return res.status(400).json({ error: "Missing contact info: Provide Phone Number or Email" });
    }

    // Process requirements to fill database fields dynamically if details aren't provided explicitly
    const parsed = parseRequirements(requirements);

    const projectType = data['Project Type'] || data.projectType || parsed.projectType;
    const projectLocation = data['Project Location'] || data.projectLocation || parsed.projectLocation;
    const projectAreaSqft = parseInt(data['Project Area'] || data.projectAreaSqft) || parsed.projectAreaSqft;
    const estimatedBudget = String(data['Estimated Budget'] || data.estimatedBudget || parsed.estimatedBudget).trim();
    const completionTimeline = String(data['Completion Timeline'] || data.completionTimeline || parsed.completionTimeline).trim();
    
    // Explicitly store the original string in data so it's preserved in rawData for the frontend
    data.estimatedBudget = estimatedBudget;

    // Convert estimated budget string to number if possible for AI qualification
    const numericBudget = parseFloat(estimatedBudget.replace(/[^0-9.]/g, '')) || 0;
    const qualification = { score: 0, category: "PENDING" as any, reason: "Awaiting detailed specification form" };
    const qualStatus = "PENDING";

    try {
      let duplicateFound = false;

      if (phoneNumber && phoneNumber.trim() !== "") {
        const existingCustomerByPhone = await db.select()
          .from(customersTable)
          .where(ilike(customersTable.contactInfo, `%${phoneNumber}%`))
          .limit(1);
        if (existingCustomerByPhone.length > 0) {
          duplicateFound = true;
        }
      }

      if (!duplicateFound && emailAddress && emailAddress.trim() !== "") {
        const existingCustomerByEmail = await db.select()
          .from(customersTable)
          .where(ilike(customersTable.contactInfo, `%${emailAddress}%`))
          .limit(1);
        if (existingCustomerByEmail.length > 0) {
          duplicateFound = true;
        }
      }

      if (duplicateFound) {
        console.log(`ℹ️ [DUPLICATE CHECK] Lead with contact info already exists, but we are creating a new entry so it displays in the dashboard.`);
      }
    } catch (error: any) {
      console.error("Error checking for duplicate lead:", error.message);
    }

    // 3b. Write to Local Ledger (arkoo_leads.json) — always runs, regardless of DB status
    const isLandingLead = leadSource === "Landing Page";
    const ledgerEntry = {
      id: `ARKOO-${Date.now()}`,
      fullName: customerName,
      leadSource: leadSource,
      contactInfo: { phone: phoneNumber, email: emailAddress },
      message: requirements,
      projectType,
      projectLocation,
      projectAreaSqft,
      estimatedBudget,
      aiScore: 0,
      aiCategory: "PENDING",
      status: "Form Pending",
      formSubmitted: false,
      qualification: null,
      timestamp: new Date().toISOString(),
      rawPayload: data,
    };
    writeToLocalLedger(ledgerEntry);

    // Mission Control notification summary
    console.log("\n" + "=".repeat(60));
    console.log("  🚨 ARKOO MISSION CONTROL — NEW LEAD RECEIVED");
    console.log("=".repeat(60));
    console.log(`  📌 Source     : ${leadSource}`);
    console.log(`  👤 Name       : ${customerName}`);
    console.log(`  📞 Phone      : ${phoneNumber || "N/A"}`);
    console.log(`  📧 Email      : ${emailAddress || "N/A"}`);
    console.log(`  📍 Location   : ${projectLocation}`);
    console.log(`  🏗  Type       : ${projectType}`);
    console.log(`  🔥 AI Score   : PENDING (Awaiting detailed form completion)`);
    console.log(`  🕐 Timestamp  : ${ledgerEntry.timestamp}`);
    console.log("=".repeat(60) + "\n");

    // 4. Save to Supabase via Drizzle ORM
    let leadId: number | undefined;
    let dbSaved = true;
    let dbErrorMsg = "";
    try {
      const [lead] = await db.insert(leadsTable).values({
        source: leadSource,
        rawData: JSON.parse(JSON.stringify(data)),
        aiScore: 0,
        aiCategory: "PENDING",
        status: "Form Pending"
      }).returning();

      leadId = lead.id;

      const [customer] = await db.insert(customersTable).values({
        leadId: lead.id,
        name: customerName,
        contactInfo: JSON.stringify({ phone: phoneNumber, email: emailAddress }),
        address: projectLocation
      }).returning();

      await db.insert(projectsTable).values({
        customerId: customer.id,
        type: projectType,
        areaSqft: projectAreaSqft,
        budget: numericBudget > 0 ? numericBudget.toString() : "0", // Store clean numerical value to prevent PostgreSQL crashes
        timeline: completionTimeline
      });
    } catch (error: any) {
      console.error("Error inserting into Supabase DB:", error);
      dbSaved = false;
      dbErrorMsg = error.message || String(error);
      // DO NOT crash or abort the request! We proceed so that email notifications still work!
    }

    // 5. Send Email Notification
    const dbWarningHtml = dbSaved ? "" : `
      <div style="margin-bottom: 20px; padding: 12px; background-color: #fff3cd; border: 1px solid #ffeeba; border-radius: 4px; color: #856404; font-family: sans-serif; font-size: 14px;">
        <strong>⚠️ Database Sync Warning:</strong><br>
        This lead was received and qualified successfully, but your local development server was unable to sync it to the Supabase database. This is usually caused by running on an <strong>IPv4-only independent network</strong> when Supabase requires IPv6 for direct PostgreSQL connections.<br>
        <span style="font-size: 12px; color: #533f03;"><strong>Error details:</strong> ${dbErrorMsg}</span>
      </div>
    `;

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${dbWarningHtml}
      <h2 style="color: #2c3e50;">New ARKOO Lead Assignment</h2>
      <p>Dear Sales Team,</p>
      <p>A new lead has been generated and assigned for follow-up. Please find the details below:</p>
      
      <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 40%;"><strong>Lead Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${customerName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Contact Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phoneNumber}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Email ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${emailAddress}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectLocation}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectType}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Area</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectAreaSqft > 0 ? projectAreaSqft + ' Sq. Ft.' : 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Estimated Budget</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${estimatedBudget !== '0' ? estimatedBudget : 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Timeline</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${completionTimeline}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Lead Source</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><span style="padding: 3px 8px; border-radius: 4px; background: #e3f2fd; color: #0d47a1; font-weight: bold;">${leadSource}</span></td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Qualification Status</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><strong style="color: #7f8c8d;">PENDING</strong> (Awaiting detailed specification form)</td></tr>
      </table>

      <h3>Customer Requirements:</h3>
      <p style="background: #f4f4f4; padding: 10px; border-left: 4px solid #0056b3; font-style: italic;">${requirements || 'None specified'}</p>

      <p><strong>Action Required:</strong> Please connect with the customer at the earliest and update the lead status in the system after the interaction.</p>

      <p>Regards,<br><strong>ARKOO Lead Management System</strong><br>ARKOO</p>
    </div>
    `;

    // Send response early to prevent Netlify from timing out
    res.status(200).json({ 
      success: true, 
      message: "Lead captured, saved to DB, and notification processing in background.",
      dbSaved,
      dbError: dbSaved ? undefined : dbErrorMsg
    });

    let customerPreviewUrl: string | null = null;

    try {
      const info = await sendLeadEmail({
        from: `"ARKOO Pre-Build AI" <${getSmtpUser()}>`,
        to: process.env.SALES_REP_EMAIL || 'newleadnotification001@gmail.com',
        replyTo: getSmtpUser(),
        subject: `New Project Inquiry: ${customerName} (${projectType})`,
        html: htmlContent,
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'High'
        }
      });
      console.log("Email sent successfully:", info.messageId);

      // Send customer email with pre-filled PIF form link for ALL leads that have an email address
      if (emailAddress) {
        customerPreviewUrl = await sendCustomerEmail(
          customerName, 
          emailAddress, 
          phoneNumber, 
          leadId ? leadId.toString() : ledgerEntry.id, 
          detectBaseUrl(req),
          {
            projectlocation: projectLocation,
            projecttype: projectType,
            proposedarea: projectAreaSqft,
            estimatedbudget: estimatedBudget,
            completiontimeline: completionTimeline
          }
        );

        if (leadId) {
          await db.update(leadsTable).set({ status: "Form Pending" }).where(eq(leadsTable.id, leadId));
          console.log(`[STATUS UPDATE] Automatically updated lead ID ${leadId} to 'Form Pending' after sending customer email.`);
        }
      }

    } catch (error: any) {
      console.error("Email sending error:", error.message);
      
      // Still attempt to send customer email even if sales notification failed
      if (emailAddress) {
        try {
          customerPreviewUrl = await sendCustomerEmail(customerName, emailAddress, phoneNumber, leadId ? leadId.toString() : ledgerEntry.id, detectBaseUrl(req), {
            projectlocation: projectLocation,
            projecttype: projectType,
            proposedarea: projectAreaSqft,
            estimatedbudget: estimatedBudget,
            completiontimeline: completionTimeline
          });

          if (leadId) {
            await db.update(leadsTable).set({ status: "Form Pending" }).where(eq(leadsTable.id, leadId));
            console.log(`[STATUS UPDATE] Automatically updated lead ID ${leadId} to 'Form Pending' after sending customer Ethereal email.`);
          }
        }

      } catch (fallbackError: any) {
        console.error("All email attempts failed:", fallbackError.message);
      }
    }

    return;
  } catch (error) {
    console.error("Webhook processing error:", error);
    res.status(500).json({ error: "Internal Server Error during webhook processing" });
    return;
  }
};

// ============================================================
// GOOGLE FORM SUBMISSION WEBHOOK HANDLER
// ============================================================
function getFieldValue(body: Record<string, any>, possibleKeys: string[], defaultValue = "Not Specified"): string {
  for (const k of Object.keys(body)) {
    const kLower = k.toLowerCase().replace(/[^a-z0-9]/g, "");
    for (const pk of possibleKeys) {
      const pkLower = pk.toLowerCase().replace(/[^a-z0-9]/g, "");
      if (kLower === pkLower || kLower.includes(pkLower)) {
        const val = body[k];
        if (val === null || val === undefined) return "";
        const strVal = String(val).trim();
        if (strVal.toLowerCase() === "null" || strVal.toLowerCase() === "undefined") return "";
        return strVal;
      }
    }
  }
  return defaultValue;
}

const handleGoogleFormSubmit = async (req: any, res: any) => {
  try {
    const data = req.body;
    console.log("📝 Received Google Form Submission:", JSON.stringify(data, null, 2));

    const customerName = getFieldValue(data, ["fullname", "customername", "name"], "Customer");
    const emailAddress = getFieldValue(data, ["emailaddress", "emailid", "email"], "");
    const phoneNumber = getFieldValue(data, ["phonenumber", "phone", "contactnumber", "contact"], "Not Specified");
    const projectLocation = getFieldValue(data, ["projectlocation", "location", "sitelocation", "city"], "Not Specified");
    const projectType = getFieldValue(data, ["projecttype", "type", "structuretype"], "PEB Structure");
    const proposedArea = getFieldValue(data, ["proposedarea", "area", "areasqft", "size"], "Not Specified");
    const estimatedBudget = getFieldValue(data, ["estimatedbudget", "budget", "cost"], "Not Specified");
    
    // Explicitly store the original string in data so it's preserved in rawData for the frontend
    data.estimatedBudget = estimatedBudget;

    const timeline = getFieldValue(data, ["completiontimeline", "timeline", "duration"], "Not Specified");
    const additionalRequirements = getFieldValue(data, ["additionalrequirements", "requirements", "comments", "notes", "message"], "None");
    const landownership = getFieldValue(data, ["landownership"], "Not Specified");
    const govapprovals = getFieldValue(data, ["govapprovals"], "Not Specified");
    const hiredarchitect = getFieldValue(data, ["hiredarchitect"], "Not Specified");

    // Handle File Uploads (Base64 string direct to DB)
    const uploadedFiles: Record<string, string> = {};
    if (data.files && typeof data.files === 'object') {
      for (const [key, fileData] of Object.entries(data.files) as any) {
        if (fileData && typeof fileData === 'object' && fileData.base64) {
          try {
            const mimeType = fileData.mimetype || fileData.type || "application/pdf";
            uploadedFiles[key] = `data:${mimeType};base64,${fileData.base64}`;
          } catch (e) {
            console.error(`Failed to parse file ${key}:`, e);
          }
        }
      }
    }

    // Attach documents and new fields to data payload for ledger storage
    data.uploadedDocuments = uploadedFiles;
    data.landownership = landownership;
    data.govapprovals = govapprovals;
    data.hiredarchitect = hiredarchitect;


    // Parse Area to a numerical value
    const numericArea = parseInt(proposedArea.replace(/[^0-9]/g, '')) || 0;

    // Parse Budget to a clean numerical value (Lakhs/Crores aware)
    let numericBudget = 0;
    const budgetLower = estimatedBudget.toLowerCase();
    const valMatch = estimatedBudget.match(/(\d+[,.\d]*)/);
    if (valMatch) {
      const val = parseFloat(valMatch[1].replace(/,/g, ''));
      if (budgetLower.includes("cr") || budgetLower.includes("crore")) {
        numericBudget = val * 10000000;
      } else if (budgetLower.includes("lakh") || budgetLower.includes("lakhs") || budgetLower.includes("l")) {
        numericBudget = val * 100000;
      } else {
        if (val < 1000) {
          numericBudget = val * 100000; // Assume Lakhs if small number under 1000
        } else {
          numericBudget = val;
        }
      }
    }

    // 🚀 RESPOND IMMEDIATELY TO ELIMINATE LATENCY
    res.status(200).json({
      success: true,
      message: "Form submission received and processing started in the background."
    });

    // BACKGROUND PROCESSING (AI Qualification, Emails, DB Update)
    (async () => {
      try {
        // Call the AI Qualification engine using the detailed Google Form values
        const qualification = await qualifyLead({
      source: "Google Forms",
      name: customerName,
      contactInfo: phoneNumber || emailAddress || "Not Specified",
      budget: numericBudget,
      location: projectLocation,
      projectAreaSqft: numericArea > 0 ? numericArea : null,
      projectType: projectType,
      timeline: timeline,
      rawDetails: JSON.stringify(data)
    });

    // 1. Send Thank You Email to Customer
    let customerEmailSent = false;
    if (emailAddress) {
      const thankYouHtml = `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #222222; max-width: 600px;">
        <p>Hi ${customerName},</p>
        <p>Thanks for submitting your detailed project specification form!</p>
        <p>Our engineering design team has successfully received your parameters, and we are already starting on your preliminary custom structural layout and cost estimation drawings.</p>
        <p>A senior project consultant will connect with you shortly to present these blueprints and discuss the project details.</p>
        
        <p>Here is a quick summary of the specifications we received:</p>
        <ul>
          <li><strong>Project Type:</strong> ${projectType}</li>
          <li><strong>Proposed Area:</strong> ${proposedArea}</li>
          <li><strong>Project Location:</strong> ${projectLocation}</li>
          <li><strong>Timeline:</strong> ${timeline}</li>
        </ul>
        
        <p>If you have any site plans or drawings you'd like to share in the meantime, feel free to reply directly to this email.</p>
        <br>
        <p>Best regards,</p>
        <p><strong>Arkoo Prebuild Team</strong><br>
        Arkoo Pre-Build Pvt. Ltd.</p>
      </div>
      `;

      try {
        await sendLeadEmail({
          from: `"ARKOO Prebuild Team" <${getSmtpUser()}>`,
          to: emailAddress,
          subject: `Received your specifications - Arkoo Prebuild`,
          html: thankYouHtml,
        });
        console.log(`[GOOGLE FORM SUCCESS] Thank you email sent to customer at ${emailAddress}`);
        customerEmailSent = true;
      } catch (err: any) {
        console.error(`⚠️ Failed to send thank you email to ${emailAddress}:`, err.message);
      }
    }

    // 2. Send Notification Email to Sales Team with Premium AI Qualification Banner
    let salesEmailSent = false;
    const salesNotificationHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
      <h2 style="color: #2563eb; margin-top: 0; font-family: sans-serif;">📋 PROJECT SPECIFICATION SUBMITTED</h2>
      <p>Dear Sales Team,</p>
      <p>Great news! The customer <strong>${customerName}</strong> has filled out and submitted the <strong>Detailed Project Specification Form</strong> via Google Forms.</p>
      <p>Our AI system has analyzed their inputs and qualified this lead.</p>
      
      <!-- Premium AI Qualification Status Banner -->
      <div style="margin: 20px 0; padding: 15px; background: ${qualification.category === 'HOT' ? '#fdf2f2' : qualification.category === 'WARM' ? '#fffbeb' : '#f0fdf4'}; border-left: 5px solid ${qualification.category === 'HOT' ? '#ef4444' : qualification.category === 'WARM' ? '#f59e0b' : '#22c55e'}; border-radius: 4px; font-family: sans-serif;">
        <h3 style="margin: 0 0 5px 0; color: ${qualification.category === 'HOT' ? '#991b1b' : qualification.category === 'WARM' ? '#92400e' : '#166534'};">
          ${qualification.category === 'HOT' ? '🔥' : qualification.category === 'WARM' ? '⚡' : '❄️'} AI Qualification: ${qualification.category} LEAD
        </h3>
        <p style="margin: 0; font-size: 14px; color: #374151;">
          This lead has been analyzed and classified with an AI score of <strong>${qualification.score}/100</strong> based on budget size, location feasibility, structure type, and timeline urgency.
        </p>
      </div>
      
      <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0; font-size: 14px;">
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold; width: 40%;">Lead Name</td><td style="padding: 10px 0;">${customerName}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Contact Number</td><td style="padding: 10px 0;">${phoneNumber}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Email ID</td><td style="padding: 10px 0;">${emailAddress || "N/A"}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Project Location</td><td style="padding: 10px 0;">${projectLocation}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Project Type</td><td style="padding: 10px 0;">${projectType}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Proposed Area</td><td style="padding: 10px 0;">${proposedArea}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Estimated Budget</td><td style="padding: 10px 0;">${estimatedBudget}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Timeline</td><td style="padding: 10px 0;">${timeline}</td></tr>
        <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Lead Source</td><td style="padding: 10px 0;"><span style="padding: 3px 8px; border-radius: 4px; background: #e8f5e9; color: #2e7d32; font-weight: bold;">Google Forms (PIF)</span></td></tr>
      </table>

      <h3 style="color: #0f172a; margin-bottom: 5px;">Additional Requirements / Design Notes:</h3>
      <p style="background: #f8fafc; padding: 12px; border-left: 4px solid #2563eb; font-style: italic; margin-top: 0; font-size: 14px; color: #334155;">
        ${additionalRequirements}
      </p>

      <p style="font-weight: bold; color: #2563eb; margin-top: 25px;">
        Action Required: Please go through their inputs and the AI Score, update their records in the LMS CRM, connect with the customer as soon as possible, and please review the project specifications.
      </p>

      <p style="font-size: 13px; color: #334155; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
        Regards,<br>
        <strong>ARKOO Lead Management System</strong><br>
        ARKOO Pre-Build Pvt. Ltd.
      </p>
    </div>
    `;

      try {
        await sendLeadEmail({
          from: `"ARKOO Pre-Build AI" <${getSmtpUser()}>`,
          to: process.env.SALES_REP_EMAIL || 'newleadnotification001@gmail.com',
          replyTo: getSmtpUser(),
          subject: `[FORM FILLED] Project PIF Submitted: ${customerName} (${projectType})`,
          html: salesNotificationHtml,
          headers: {
            'X-Priority': '1',
            'X-MSMail-Priority': 'High',
            'Importance': 'High'
          }
        });
        console.log(`[GOOGLE FORM SUCCESS] Notification email sent to sales representative`);
        salesEmailSent = true;
      } catch (err: any) {
        console.error(`⚠️ Failed to send notification email to sales team:`, err.message, err);
      }

    // 3. Update Lead Status and AI score in DB (idempotent lookup by email or phone)
    let leadStatusUpdated = false;
    if (emailAddress || (phoneNumber && phoneNumber !== "Not Specified")) {
      try {
        let customerRecord = null;
        if (emailAddress) {
          const records = await db.select()
            .from(customersTable)
            .where(ilike(customersTable.contactInfo, `%${emailAddress}%`))
            .orderBy(desc(customersTable.id))
            .limit(1);
          if (records.length > 0) customerRecord = records[0];
        }
        if (!customerRecord && phoneNumber && phoneNumber !== "Not Specified") {
          const records = await db.select()
            .from(customersTable)
            .where(ilike(customersTable.contactInfo, `%${phoneNumber}%`))
            .orderBy(desc(customersTable.id))
            .limit(1);
          if (records.length > 0) customerRecord = records[0];
        }

        if (customerRecord && customerRecord.leadId) {
          await db.update(leadsTable)
            .set({ 
              status: "Form Filled",
              aiScore: qualification.score,
              aiCategory: qualification.category
            })
            .where(eq(leadsTable.id, customerRecord.leadId));
          console.log(`[STATUS UPDATE] Successfully updated Lead ID ${customerRecord.leadId} to status: Form Filled with AI Score: ${qualification.score} (${qualification.category})`);
          leadStatusUpdated = true;

          // Also update the project record with detailed specifications
          try {
            await db.update(projectsTable)
              .set({
                type: projectType,
                areaSqft: numericArea > 0 ? numericArea : null,
                budget: numericBudget > 0 ? numericBudget.toString() : "0",
                timeline: timeline
              })
              .where(eq(projectsTable.customerId, customerRecord.id));
            console.log(`[PROJECT UPDATE] Successfully updated Project details for Customer ID ${customerRecord.id}`);
          } catch (projErr: any) {
            console.error("⚠️ Failed to update project details in DB:", projErr.message);
          }
        } else {
          console.log("⚠️ Could not match customer record in DB for status update");
        }
      } catch (err: any) {
        console.error("⚠️ Failed to update lead status in database:", err.message);
      }
    }

    // 4. Sync to local ledger (arkoo_leads.json)
    try {
      if (fs.existsSync(LEDGER_PATH)) {
        const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
        const existing = JSON.parse(raw);
        if (Array.isArray(existing)) {
          let updatedLedger = false;
          // Loop backwards to update the MOST RECENT lead matching this info
          for (let i = existing.length - 1; i >= 0; i--) {
            const entry = existing[i];
            const entryEmail = entry.contactInfo?.email || "";
            const entryPhone = entry.contactInfo?.phone || "";
            
            const emailMatch = emailAddress && entryEmail && entryEmail.toLowerCase().trim() === emailAddress.toLowerCase().trim();
            const phoneMatch = phoneNumber && phoneNumber !== "Not Specified" && entryPhone && entryPhone.trim() === phoneNumber.trim();
            
            if (emailMatch || phoneMatch) {
              entry.aiScore = qualification.score;
              entry.aiCategory = qualification.category;
              entry.status = "Form Filled";
              entry.googleFormPayload = data;
              entry.lastUpdated = new Date().toISOString();
              updatedLedger = true;
              break;
            }
          }
          if (updatedLedger) {
            fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
            console.log(`✅ [ARKOO LEADS LEDGER] Updated lead in local ledger with AI Score: ${qualification.score} (${qualification.category})`);
          } else {
            // Append as a new entry if not found
            const ledgerEntry = {
              id: `ARKOO-GF-${Date.now()}`,
              fullName: customerName,
              leadSource: "Google Forms",
              contactInfo: { phone: phoneNumber, email: emailAddress },
              message: additionalRequirements,
              projectType,
              projectLocation,
              projectAreaSqft: proposedArea,
              estimatedBudget,
              aiScore: qualification.score,
              aiCategory: qualification.category,
              status: "Form Filled",
              timestamp: new Date().toISOString(),
              rawPayload: data,
            };
            existing.push(ledgerEntry);
            fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
            console.log(`✅ [ARKOO LEADS LEDGER] Created new Google Form submission entry in local ledger with AI Score: ${qualification.score}`);
          }
        }
      }
    } catch (err: any) {
      console.error("⚠️ [ARKOO LEADS LEDGER] Failed to update local ledger:", err.message);
    }

      } catch (backgroundError: any) {
        console.error("⚠️ Error during background processing for Google Form submission:", backgroundError.message);
      }
    })(); // End of background IIFE

  } catch (error: any) {
    console.error("⚠️ Error handling Google Form submission webhook:", error.message);
    res.status(500).json({ error: "Internal Server Error during Google Form processing" });
  }
};

router.post("/webhooks/arkoo-lead", handleArkooLead);
router.post("/lms/leads/ingest", handleArkooLead);
router.post("/webhooks/google-form", handleGoogleFormSubmit);
router.post("/lms/google-form/submit", handleGoogleFormSubmit);

// ============================================================
// PIF (PROJECT SPECIFICATION FORM) SUBMIT HANDLER
// ============================================================
const handlePifSubmit = async (req: any, res: any) => {
  try {
    // 1. Immediately respond to the client to avoid the 10-second Netlify proxy timeout!
    res.status(200).json({
      success: true,
      message: "Form submission received successfully. Processing in background."
    });

    // 2. Offload AI and Email processing to a background task
    (async () => {
      try {
        const data = req.body;
        console.log("📝 Received PIF Submission (Background Task Started)");

        const customerName = getFieldValue(data, ["fullname", "customername", "name"], "Customer");
        const emailAddress = getFieldValue(data, ["emailaddress", "emailid", "email"], "");
        const phoneNumber = getFieldValue(data, ["phonenumber", "phone", "contactnumber", "contact"], "Not Specified");
        const projectLocation = getFieldValue(data, ["projectlocation", "location", "sitelocation", "city"], "Not Specified");
        const projectType = getFieldValue(data, ["projecttype", "type", "structuretype"], "PEB Structure");
        const proposedArea = getFieldValue(data, ["proposedarea", "area", "areasqft", "size"], "Not Specified");
        const estimatedBudget = getFieldValue(data, ["estimatedbudget", "budget", "cost"], "Not Specified");
        const timeline = getFieldValue(data, ["completiontimeline", "timeline", "duration"], "Not Specified");
        const additionalRequirements = getFieldValue(data, ["additionalrequirements", "requirements", "comments", "notes", "message"], "None");

        // Handle File Uploads via Multer (Convert to Base64 data URLs & prepare email attachments)
        const uploadedFiles: Record<string, string> = {};
        const emailAttachments: any[] = [];
        if (req.files) {
          for (const [key, filesArray] of Object.entries(req.files) as any) {
             const fileArray = filesArray as Express.Multer.File[];
             if (fileArray && fileArray.length > 0) {
                const file = fileArray[0];
                if (file.buffer) {
                  const base64Str = file.buffer.toString("base64");
                  uploadedFiles[key] = `data:${file.mimetype || 'application/pdf'};base64,${base64Str}`;
                  emailAttachments.push({
                     filename: file.originalname || `${key}.pdf`,
                     content: file.buffer,
                     contentType: file.mimetype
                   });
                }
             }
          }
        }
        data.uploadedDocuments = uploadedFiles;

        const numericArea = parseInt(proposedArea.replace(/[^0-9]/g, '')) || 0;
        let numericBudget = 0;
        const budgetLower = estimatedBudget.toLowerCase();
        const valMatch = estimatedBudget.match(/(\d+[,.\d]*)/);
        if (valMatch) {
          const val = parseFloat(valMatch[1].replace(/,/g, ''));
          if (budgetLower.includes("cr") || budgetLower.includes("crore")) {
            numericBudget = val * 10000000;
          } else if (budgetLower.includes("lakh") || budgetLower.includes("lakhs") || budgetLower.includes("l")) {
            numericBudget = val * 100000;
          } else {
            numericBudget = val < 1000 ? val * 100000 : val;
          }
        }

        const landownership = getFieldValue(data, ["landownership", "landStatus"], "Not Specified");
        const govapprovals = getFieldValue(data, ["govapprovals", "govtApprovals"], "Not Specified");
        const hiredarchitect = getFieldValue(data, ["hiredarchitect", "hasArchitect"], "Not Specified");
        const architectName = getFieldValue(data, ["architectName"], "");
        const architectContact = getFieldValue(data, ["architectContact"], "");
        const architectDetailsProvided = !!(architectName || architectContact);
        const drawingsUploadedCount = Object.keys(uploadedFiles).length;

        // Call AI Qualification (This takes time, which is why it's in the background)
        const qualification = await qualifyLead({
          source: "Arkoo LMS Form",
          name: customerName,
          contactInfo: phoneNumber || emailAddress || "Not Specified",
          budget: numericBudget,
          location: projectLocation,
          projectAreaSqft: numericArea > 0 ? numericArea : null,
          projectType: projectType,
          timeline: timeline,
          landOwnership: landownership,
          governmentApprovals: govapprovals,
          architectHired: hiredarchitect,
          architectDetailsProvided: architectDetailsProvided,
          drawingsUploadedCount: drawingsUploadedCount,
          rawDetails: JSON.stringify(data)
        });

        // Send Thank You Email to Customer
        if (emailAddress) {
          const thankYouHtml = `
          <div style="font-family: Calibri, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #222222; max-width: 600px;">
            <p>Hi ${customerName},</p>
            <p>Thanks for submitting your detailed project specification form!</p>
            <p>Our engineering design team has successfully received your parameters, and we are already starting on your preliminary custom structural layout and cost estimation drawings.</p>
            <p>A senior project consultant will connect with you shortly to present these blueprints and discuss the project details.</p>
            <br>
            <p>Best regards,</p>
            <p><strong>Arkoo Prebuild Team</strong></p>
          </div>
          `;
          try {
            await sendLeadEmail({
              from: `"ARKOO Prebuild Team" <${getSmtpUser()}>`,
              to: emailAddress,
              subject: `Received your specifications - Arkoo Prebuild`,
              html: thankYouHtml,
            });
            console.log(`[PIF BACKGROUND] Thank you email sent to ${emailAddress}`);
          } catch (err: any) {
            console.error(`⚠️ [PIF BACKGROUND] Failed to send email to ${emailAddress}:`, err.message);
          }
        }

        // Sync to Postgres DB
        const leadId = data.leadId || "";
        let leadIdToUpdate: number | null = null;
        if (leadId) {
          const parsedId = parseInt(leadId, 10);
          if (!isNaN(parsedId)) {
            leadIdToUpdate = parsedId;
          }
        }

        if (emailAddress || (phoneNumber && phoneNumber !== "Not Specified") || leadIdToUpdate) {
          try {
            let customerRecord = null;
            let targetLeadId = leadIdToUpdate;

            if (!targetLeadId) {
              if (emailAddress) {
                const records = await db.select()
                  .from(customersTable)
                  .where(ilike(customersTable.contactInfo, `%${emailAddress}%`))
                  .orderBy(desc(customersTable.id))
                  .limit(1);
                if (records.length > 0) customerRecord = records[0];
              }
              if (!customerRecord && phoneNumber && phoneNumber !== "Not Specified") {
                const records = await db.select()
                  .from(customersTable)
                  .where(ilike(customersTable.contactInfo, `%${phoneNumber}%`))
                  .orderBy(desc(customersTable.id))
                  .limit(1);
                if (records.length > 0) customerRecord = records[0];
              }
              if (customerRecord && customerRecord.leadId) {
                targetLeadId = customerRecord.leadId;
              }
            }

            if (!targetLeadId) {
              console.log("⚠️ Could not match customer record in DB. Creating a new organic PIF lead.");
              const [newCust] = await db.insert(customersTable)
                .values({
                  name: customerName,
                  contactInfo: emailAddress || phoneNumber || "Not Specified"
                })
                .returning();
              
              const [newLead] = await db.insert(leadsTable)
                .values({
                  status: "Form Filled",
                  source: "Organic PIF",
                  aiScore: qualification.score,
                  aiCategory: qualification.category,
                  rawData: JSON.parse(JSON.stringify(data))
                })
                .returning();

              targetLeadId = newLead.id;

              await db.update(customersTable)
                .set({ leadId: targetLeadId })
                .where(eq(customersTable.id, newCust.id));

              await db.insert(projectsTable)
                .values({
                  customerId: newCust.id,
                  type: projectType,
                  areaSqft: numericArea > 0 ? numericArea : null,
                  budget: numericBudget > 0 ? numericBudget.toString() : "0",
                  timeline: timeline
                });
            } else {
              await db.update(leadsTable)
                .set({ 
                  status: "Form Filled",
                  aiScore: qualification.score,
                  aiCategory: qualification.category,
                  rawData: JSON.parse(JSON.stringify(data))
                })
                .where(eq(leadsTable.id, targetLeadId));
              console.log(`[PIF STATUS UPDATE] Successfully updated Lead ID ${targetLeadId} to status: Form Filled with AI Score: ${qualification.score} (${qualification.category})`);

              // Also update the project record with detailed specifications
              let customerIdToUpdate = customerRecord?.id;
              if (!customerIdToUpdate) {
                const [cust] = await db.select({ id: customersTable.id }).from(customersTable).where(eq(customersTable.leadId, targetLeadId)).limit(1);
                if (cust) customerIdToUpdate = cust.id;
              }

              if (customerIdToUpdate) {
                try {
                  await db.update(projectsTable)
                    .set({
                      type: projectType,
                      areaSqft: numericArea > 0 ? numericArea : null,
                      budget: numericBudget > 0 ? numericBudget.toString() : "0",
                      timeline: timeline
                    })
                    .where(eq(projectsTable.customerId, customerIdToUpdate));
                  console.log(`[PROJECT UPDATE] Successfully updated Project details for Customer ID ${customerIdToUpdate}`);
                } catch (projErr: any) {
                  console.error("⚠️ Failed to update project details in DB:", projErr.message);
                }
              }
            }

            // Send Notification Email to Sales Team (Now fires for both updates and new creations)
            if (targetLeadId) {
              const DASHBOARD_BASE_URL = process.env.DASHBOARD_BASE_URL || "https://joyful-cranachan-b9c054.netlify.app";
              const leadDetailUrl = `${DASHBOARD_BASE_URL}/leads/${targetLeadId}`;
              const salesNotificationHtml = `
              <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
                <h2 style="color: #2563eb; margin-top: 0; font-family: sans-serif;">📋 PROJECT SPECIFICATION SUBMITTED</h2>
                <p>Dear Sales Team,</p>
                <p>Great news! The customer <strong>${customerName}</strong> has filled out and submitted the <strong>Detailed Project Specification Form</strong>.</p>
                <p>Our AI system has analyzed their inputs and qualified this lead.</p>
                
                <!-- Premium AI Qualification Status Banner -->
                <div style="margin: 20px 0; padding: 15px; background: ${qualification.category === 'HOT' ? '#fdf2f2' : qualification.category === 'WARM' ? '#fffbeb' : '#f0fdf4'}; border-left: 5px solid ${qualification.category === 'HOT' ? '#ef4444' : qualification.category === 'WARM' ? '#f59e0b' : '#22c55e'}; border-radius: 4px; font-family: sans-serif;">
                  <h3 style="margin: 0 0 5px 0; color: ${qualification.category === 'HOT' ? '#991b1b' : qualification.category === 'WARM' ? '#92400e' : '#166534'};">
                    ${qualification.category === 'HOT' ? '🔥' : qualification.category === 'WARM' ? '⚡' : '❄️'} AI Qualification: ${qualification.category} LEAD
                  </h3>
                  <p style="margin: 0; font-size: 14px; color: #374151;">
                    This lead has been analyzed and classified with an AI score of <strong>${qualification.score}/100</strong> based on budget size, location feasibility, structure type, and timeline urgency.
                  </p>
                </div>
                
                <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin: 20px 0; font-size: 14px;">
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold; width: 40%;">Lead Name</td><td style="padding: 10px 0;">${customerName}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Contact Number</td><td style="padding: 10px 0;">${phoneNumber}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Email ID</td><td style="padding: 10px 0;">${emailAddress || "N/A"}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Project Location</td><td style="padding: 10px 0;">${projectLocation}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Project Type</td><td style="padding: 10px 0;">${projectType}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Proposed Area</td><td style="padding: 10px 0;">${proposedArea}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Estimated Budget</td><td style="padding: 10px 0;">${estimatedBudget}</td></tr>
                  <tr style="border-bottom: 1px solid #e2e8f0;"><td style="padding: 10px 0; font-weight: bold;">Timeline</td><td style="padding: 10px 0;">${timeline}</td></tr>
                </table>

                <p style="font-weight: bold; color: #2563eb; margin-top: 25px;">
                  👉 <a href="${leadDetailUrl}" style="color: #ffffff; background-color: #2563eb; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">View Lead Details in CRM</a>
                </p>

                <p style="font-size: 13px; color: #334155; margin-top: 20px; border-top: 1px dashed #e2e8f0; padding-top: 10px;">
                  Regards,<br>
                  <strong>ARKOO Lead Management System</strong><br>
                  ARKOO Pre-Build Pvt. Ltd.
                </p>
              </div>
              `;

              try {
                await sendLeadEmail({
                  from: `"ARKOO Pre-Build AI" <${getSmtpUser()}>`,
                  to: process.env.SALES_REP_EMAIL || 'newleadnotification001@gmail.com',
                  replyTo: getSmtpUser(),
                  subject: `[FORM FILLED] Project PIF Submitted: ${customerName} (${projectType})`,
                  html: salesNotificationHtml,
                  attachments: emailAttachments,
                  headers: {
                    'X-Priority': '1',
                    'X-MSMail-Priority': 'High',
                    'Importance': 'High'
                  }
                });
                console.log(`[PIF BACKGROUND] Notification email sent to sales representative`);
              } catch (err: any) {
                console.error(`⚠️ [PIF BACKGROUND] Failed to send notification email to sales team:`, err.message);
              }
            }
          } catch (err: any) {
            console.error("⚠️ Failed to update PIF lead status in database: " + (err.stack || String(err)));
          }
        }

        // Sync to local ledger
        try {
          if (fs.existsSync(LEDGER_PATH)) {
            const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
            const existing = JSON.parse(raw);
            if (Array.isArray(existing)) {
              let updatedLedger = false;
              for (let i = existing.length - 1; i >= 0; i--) {
                const entry = existing[i];
                const entryEmail = entry.contactInfo?.email || "";
                const entryPhone = entry.contactInfo?.phone || "";
                
                const emailMatch = emailAddress && entryEmail && entryEmail.toLowerCase().trim() === emailAddress.toLowerCase().trim();
                const phoneMatch = phoneNumber && phoneNumber !== "Not Specified" && entryPhone && entryPhone.trim() === phoneNumber.trim();
                
                if (emailMatch || phoneMatch) {
                  entry.aiScore = qualification.score;
                  entry.aiCategory = qualification.category;
                  entry.status = "Form Filled";
                  entry.googleFormPayload = data; // Store full payload including file paths
                  entry.lastUpdated = new Date().toISOString();
                  updatedLedger = true;
                  break;
                }
              }
              if (updatedLedger) {
                fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
              } else {
                existing.push({
                  id: `ARKOO-PIF-${Date.now()}`,
                  fullName: customerName,
                  leadSource: "Arkoo LMS Form",
                  contactInfo: { phone: phoneNumber, email: emailAddress },
                  projectType,
                  projectLocation,
                  projectAreaSqft: proposedArea,
                  estimatedBudget,
                  aiScore: qualification.score,
                  aiCategory: qualification.category,
                  status: "Form Filled",
                  timestamp: new Date().toISOString(),
                  rawPayload: data,
                });
                fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
              }
            }
          }
        } catch (err: any) {
          console.error("⚠️ [PIF BACKGROUND] Failed to update local ledger:", err.message);
        }

        console.log("✅ [PIF BACKGROUND] Processing complete.");
      } catch (bgError) {
        console.error("⚠️ [PIF BACKGROUND] Unexpected error:", bgError);
      }
    })(); // Execute the async IIFE without awaiting it
  } catch (error: any) {
    console.error("⚠️ Error handling PIF submission:", error.message);
    if (!res.headersSent) {
       res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

const handleSendFormEmail = async (req: any, res: any) => {
  try {
    const leadId = parseInt(req.params.id, 10);
    if (isNaN(leadId)) {
      return res.status(400).json({ error: "Invalid lead ID" });
    }

    // 1. Fetch lead details
    const [lead] = await db.select({
      id: leadsTable.id,
      name: customersTable.name,
      contactInfo: customersTable.contactInfo,
      source: leadsTable.source,
      status: leadsTable.status,
      project_type: projectsTable.type,
      budget: projectsTable.budget,
      area_sqft: projectsTable.areaSqft,
      location: customersTable.address,
      timeline: projectsTable.timeline
    })
    .from(leadsTable)
    .leftJoin(customersTable, eq(leadsTable.id, customersTable.leadId))
    .leftJoin(projectsTable, eq(customersTable.id, projectsTable.customerId))
    .where(eq(leadsTable.id, leadId))
    .limit(1);

    if (!lead) {
      return res.status(404).json({ error: "Lead not found" });
    }

    // Parse contactInfo
    let contact = lead.contactInfo;
    try {
      if (typeof contact === 'string' && contact.startsWith('{')) {
        contact = JSON.parse(contact);
      }
    } catch (e) {}

    const emailAddress = typeof contact === 'object' && contact ? (contact as any).email : "";
    const phoneNumber = typeof contact === 'object' && contact ? (contact as any).phone : "";

    if (!emailAddress) {
      return res.status(400).json({ error: "Lead does not have a valid email address" });
    }

    // 2. Send Email
    const previewUrl = await sendCustomerEmail(
      lead.name || "Customer",
      emailAddress,
      phoneNumber,
      lead.id.toString(),
      detectBaseUrl(req),
      {
        projectlocation: lead.location,
        projecttype: lead.project_type,
        proposedarea: lead.area_sqft,
        estimatedbudget: lead.budget,
        completiontimeline: lead.timeline
      }
    );

    // 3. Update status to "Form Pending"
    await db.update(leadsTable)
      .set({ status: "Form Pending" })
      .where(eq(leadsTable.id, lead.id));

    // Update local ledger too
    try {
      if (fs.existsSync(LEDGER_PATH)) {
        const raw = fs.readFileSync(LEDGER_PATH, "utf-8");
        const existing = JSON.parse(raw);
        if (Array.isArray(existing)) {
          let updatedLedger = false;
          for (let i = existing.length - 1; i >= 0; i--) {
            const entry = existing[i];
            const entryEmail = entry.contactInfo?.email || "";
            if (entryEmail.toLowerCase().trim() === emailAddress.toLowerCase().trim()) {
              entry.status = "Form Pending";
              entry.lastUpdated = new Date().toISOString();
              updatedLedger = true;
              break;
            }
          }
          if (updatedLedger) {
            fs.writeFileSync(LEDGER_PATH, JSON.stringify(existing, null, 2), "utf-8");
          }
        }
      }
    } catch (err: any) {
      console.error("⚠️ Failed to update local ledger:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: "Project Specification Form email sent successfully",
      previewUrl
    });
  } catch (error: any) {
    console.error("Error sending manual form email:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

router.post("/lms/pif/submit", upload.fields([
  { name: 'fileArchitectural', maxCount: 1 },
  { name: 'fileTender', maxCount: 1 },
  { name: 'fileSupporting', maxCount: 1 }
]), handlePifSubmit);

router.post("/leads/:id/send-form", handleSendFormEmail);

export default router;
