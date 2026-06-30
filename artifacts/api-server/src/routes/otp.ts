import { Router } from "express";
import nodemailer from "nodemailer";
import crypto from "crypto";

const router = Router();

// ============================================================
// GET /api/otp/config
// Exposes the public Firebase Web config to the frontend client
// ============================================================
router.get("/config", (req, res) => {
  return res.status(200).json({
    apiKey: process.env.FIREBASE_API_KEY || "",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "arkoo-prebuild.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "arkoo-prebuild",
    storageBucket: "arkoo-prebuild.firebasestorage.app",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "",
    appId: process.env.FIREBASE_APP_ID || ""
  });
});

// ============================================================
// IN-MEMORY OTP STORE
// Key: email/phone (normalized), Value: { otp, expiresAt, verified, attempts }
// TTL: 10 minutes. Max 3 wrong attempts, then block.
// ============================================================
interface OtpEntry {
  otp: string;
  expiresAt: number;
  verified: boolean;
  attempts: number;       // wrong-attempt counter
  sentAt: number;         // for 60-second resend guard
}
const otpStore = new Map<string, OtpEntry>();
const MAX_ATTEMPTS = 3;

// Cleanup expired OTPs every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of otpStore.entries()) {
    if (entry.expiresAt < now) otpStore.delete(key);
  }
}, 15 * 60 * 1000);

function generateOtp(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// ============================================================
// SMTP TRANSPORTER — Gmail App Password
// ============================================================
function createSMTPTransporter() {
  const user = process.env.GMAIL_USER || "arkooprebuildai@gmail.com";
  const pass = (process.env.GMAIL_APP_PASSWORD || "suzvwpodhtuencza").replace(/\s/g, "");
  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass },
    socketTimeout: 30000,
    connectionTimeout: 30000,
  });
}

// ============================================================
// FAST2SMS — Production SMS Gateway (India, Free tier available)
// Docs: https://docs.fast2sms.com/
// Sign up free → https://www.fast2sms.com/
// After signup, go to Developer → API → Copy your API Key
// Paste the key in .env as FAST2SMS_API_KEY
// ============================================================
async function sendSmsVieFast2Sms(phone: string, otp: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error("[Fast2SMS] FAST2SMS_API_KEY is not set in .env. SMS will NOT be sent.");
    // In development, log the OTP so you can test without SMS
    console.log(`[Fast2SMS DEV-FALLBACK] OTP for ${phone} = ${otp}`);
    return { success: true }; // silently succeed so devs can test
  }

  // Normalize phone: strip country code prefixes for Fast2SMS (it expects 10-digit Indian number)
  const normalizedPhone = phone.replace(/^\+91/, "").replace(/\D/g, "").slice(-10);

  if (normalizedPhone.length !== 10) {
    console.error(`[Fast2SMS] Invalid Indian phone number after normalization: ${normalizedPhone}`);
    return { success: false, error: "Please enter a valid 10-digit Indian mobile number." };
  }

  const message = `${otp} is your Arkoo Prebuild verification OTP. Valid for 10 minutes. Do not share with anyone.`;

  try {
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        route: "q",                   // "q" = Quick SMS (no DLT needed), "dlt" = DLT registered
        message: message,
        language: "english",
        flash: 0,
        numbers: normalizedPhone,
      }),
    });

    const data: any = await response.json();

    if (data.return === true) {
      console.log(`[Fast2SMS] ✅ SMS sent to ${normalizedPhone}. Request ID: ${data.request_id}`);
      return { success: true };
    } else {
      const errMsg = Array.isArray(data.message) ? data.message.join(", ") : (data.message || "Unknown Fast2SMS error");
      console.error(`[Fast2SMS] ❌ Failed to send SMS to ${normalizedPhone}:`, errMsg);
      return { success: false, error: `SMS delivery failed: ${errMsg}` };
    }
  } catch (err: any) {
    console.error(`[Fast2SMS] ❌ Network error while sending SMS:`, err.message);
    return { success: false, error: "SMS service is temporarily unavailable. Please try again." };
  }
}


// ============================================================
// POST /api/otp/email/send
// Body: { email: string }
// Sends a 6-digit OTP to the email via Gmail SMTP
// ============================================================
router.post("/email/send", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, error: "Valid email address is required." });
    }

    const emailKey = email.toLowerCase().trim();
    const existing = otpStore.get(emailKey);

    // Rate-limit: block resend if less than 60 seconds since last send
    if (existing && (Date.now() - existing.sentAt) < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - existing.sentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
      });
    }

    const otp = generateOtp();
    const now = Date.now();
    otpStore.set(emailKey, {
      otp,
      expiresAt: now + 10 * 60 * 1000,
      verified: false,
      attempts: 0,
      sentAt: now,
    });

    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #0f172a; border-radius: 12px; border: 1px solid #1e293b; color: #e2e8f0;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #818cf8; margin: 0; font-size: 22px; letter-spacing: -0.5px;">Arkoo Prebuild</h2>
          <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Email Verification</p>
        </div>
        <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 8px;">Hello,</p>
        <p style="font-size: 15px; color: #cbd5e1; margin-bottom: 24px;">
          Use the one-time password below to verify your email address.
          This code is valid for <strong style="color: #f59e0b;">10 minutes</strong> and can only be used once.
        </p>
        <div style="background: #1e293b; border: 1px solid #334155; border-radius: 10px; padding: 24px; text-align: center; margin-bottom: 24px;">
          <span style="font-size: 40px; font-weight: 800; letter-spacing: 12px; color: #818cf8; font-family: 'Courier New', monospace;">${otp}</span>
        </div>
        <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          ⚠️ If you did not initiate this, please ignore this email. Never share your OTP with anyone — Arkoo Prebuild will never ask for it.
        </p>
        <hr style="border: none; border-top: 1px solid #1e293b; margin: 20px 0;" />
        <p style="font-size: 12px; color: #475569; text-align: center; margin: 0;">
          Arkoo Pre-Build Pvt. Ltd. · <a href="https://www.arkooprebuild.com" style="color: #818cf8; text-decoration:none;">arkooprebuild.com</a>
        </p>
      </div>
    `;

    const textBody = `Your Arkoo Prebuild email verification OTP is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.`;

    const transporter = createSMTPTransporter();
    await transporter.sendMail({
      from: `"Arkoo Prebuild" <${process.env.GMAIL_USER || "arkooprebuildai@gmail.com"}>`,
      to: email,
      subject: `${otp} — Your Arkoo Prebuild Verification Code`,
      text: textBody,
      html: htmlBody,
    });

    console.log(`[OTP] ✅ Email OTP sent to ${email}`);
    return res.status(200).json({ success: true, message: "OTP sent successfully. Please check your inbox." });
  } catch (error: any) {
    console.error("[OTP] ❌ Failed to send email OTP:", error.message);
    return res.status(500).json({ success: false, error: "Failed to send OTP. Please try again." });
  }
});

// ============================================================
// POST /api/otp/email/verify
// Body: { email: string, otp: string }
// ============================================================
router.post("/email/verify", (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ success: false, error: "Email and OTP are required." });
    }

    const emailKey = email.toLowerCase().trim();
    const entry = otpStore.get(emailKey);

    if (!entry) {
      return res.status(400).json({ success: false, error: "No OTP found. Please request a new one." });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(emailKey);
      return res.status(400).json({ success: false, error: "OTP has expired. Please request a new one." });
    }
    if (entry.verified) {
      return res.status(400).json({ success: false, error: "This OTP has already been used." });
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(emailKey);
      return res.status(400).json({ success: false, error: `Too many incorrect attempts. Please request a new OTP.` });
    }
    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      otpStore.set(emailKey, entry);
      const remaining = MAX_ATTEMPTS - entry.attempts;
      return res.status(400).json({
        success: false,
        error: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new OTP."
      });
    }

    entry.verified = true;
    otpStore.set(emailKey, entry);

    console.log(`[OTP] ✅ Email ${email} verified successfully`);
    return res.status(200).json({ success: true, message: "Email verified successfully." });
  } catch (error: any) {
    console.error("[OTP] Email verification error:", error.message);
    return res.status(500).json({ success: false, error: "Verification failed. Please try again." });
  }
});

// ============================================================
// POST /api/otp/phone/send
// Body: { phone: string }
// Sends a 6-digit SMS OTP via Fast2SMS (Production — India)
// 
// SETUP (2 minutes, Free):
//   1. Go to https://www.fast2sms.com/ → Sign Up
//   2. Verify your email to activate the account
//   3. Dashboard → Developer → API → Copy "API Key"
//   4. Paste in .env as:  FAST2SMS_API_KEY="your_key_here"
//   5. Done! Free credits included on signup.
// ============================================================
router.post("/phone/send", async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || typeof phone !== "string") {
      return res.status(400).json({ success: false, error: "Valid phone number is required." });
    }

    const phoneKey = phone.trim().replace(/\s+/g, "");
    const existing = otpStore.get(phoneKey);

    // Rate-limit: block resend if less than 60 seconds since last send
    if (existing && (Date.now() - existing.sentAt) < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (Date.now() - existing.sentAt)) / 1000);
      return res.status(429).json({
        success: false,
        error: `Please wait ${waitSeconds} seconds before requesting a new OTP.`
      });
    }

    const otp = generateOtp();
    const now = Date.now();
    otpStore.set(phoneKey, {
      otp,
      expiresAt: now + 10 * 60 * 1000,
      verified: false,
      attempts: 0,
      sentAt: now,
    });

    const smsResult = await sendSmsVieFast2Sms(phoneKey, otp);

    if (!smsResult.success) {
      // Remove the OTP entry so the user can retry immediately
      otpStore.delete(phoneKey);
      return res.status(500).json({ success: false, error: smsResult.error || "Failed to send OTP. Please try again." });
    }

    return res.status(200).json({ success: true, message: "OTP sent to your mobile number." });
  } catch (error: any) {
    console.error("[OTP] Phone OTP send error:", error.message);
    return res.status(500).json({ success: false, error: "Failed to send phone OTP. Please try again." });
  }
});

// ============================================================
// POST /api/otp/phone/verify
// Body: { phone: string, otp: string }
// ============================================================
router.post("/phone/verify", (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ success: false, error: "Phone number and OTP are required." });
    }

    const phoneKey = phone.trim().replace(/\s+/g, "");
    const entry = otpStore.get(phoneKey);

    if (!entry) {
      return res.status(400).json({ success: false, error: "No OTP found. Please request a new one." });
    }
    if (Date.now() > entry.expiresAt) {
      otpStore.delete(phoneKey);
      return res.status(400).json({ success: false, error: "OTP has expired. Please request a new one." });
    }
    if (entry.verified) {
      return res.status(400).json({ success: false, error: "This OTP has already been used." });
    }
    if (entry.attempts >= MAX_ATTEMPTS) {
      otpStore.delete(phoneKey);
      return res.status(400).json({ success: false, error: "Too many incorrect attempts. Please request a new OTP." });
    }
    if (entry.otp !== otp.trim()) {
      entry.attempts += 1;
      otpStore.set(phoneKey, entry);
      const remaining = MAX_ATTEMPTS - entry.attempts;
      return res.status(400).json({
        success: false,
        error: remaining > 0
          ? `Incorrect OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
          : "Too many incorrect attempts. Please request a new OTP."
      });
    }

    entry.verified = true;
    otpStore.set(phoneKey, entry);

    console.log(`[OTP] ✅ Phone ${phoneKey} verified successfully`);
    return res.status(200).json({ success: true, message: "Phone number verified successfully." });
  } catch (error: any) {
    console.error("[OTP] Phone verification error:", error.message);
    return res.status(500).json({ success: false, error: "Verification failed. Please try again." });
  }
});

export default router;
