import { Router } from "express";
import dns from "dns";
import { promisify } from "util";

const resolveMx = promisify(dns.resolveMx);

export const emailValidationRouter = Router();

emailValidationRouter.post("/validate", async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ valid: false, error: "Invalid email format" });
    }

    const domain = email.split("@")[1];
    if (!domain) {
      return res.status(400).json({ valid: false, error: "Invalid email domain" });
    }

    try {
      const mxRecords = await resolveMx(domain);
      if (mxRecords && mxRecords.length > 0) {
        return res.status(200).json({ valid: true });
      } else {
        return res.status(200).json({ valid: false, error: "Domain cannot receive email" });
      }
    } catch (dnsError: any) {
      // ENOTFOUND, ENODATA means domain does not exist or has no MX records
      return res.status(200).json({ valid: false, error: "Domain does not exist or has no mail servers" });
    }
  } catch (error: any) {
    console.error("Email Validation Endpoint Error:", error);
    return res.status(500).json({ valid: false, error: "Internal server error during validation" });
  }
});
