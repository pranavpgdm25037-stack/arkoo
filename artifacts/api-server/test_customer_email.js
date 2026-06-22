import "dotenv/config";
import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.GMAIL_USER || 'arkooprebuildai@gmail.com';
  const pass = (process.env.GMAIL_APP_PASSWORD || 'tqphvevoalzsdbvb').replace(/\s/g, "");

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    auth: {
      user: user,
      pass: pass,
    },
    socketTimeout: 30000,
    connectionTimeout: 30000,
    debug: true,
    logger: true
  });
};

async function sendCustomerEmail(customerName, emailAddress, leadId) {
  if (!emailAddress) return null;
  
  const customerHtmlContent = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #cbd5e1; border-radius: 8px;">
    <h2 style="color: #f59e0b; margin-top: 0; font-family: sans-serif;">ARKOO PREBUILD PVT. LTD.</h2>
    <p>Dear ${customerName},</p>
    <p>Thank you for expressing interest in <strong>Arkoo Pre-Build Pvt. Ltd.</strong> We have successfully received your initial enquiry regarding our structural PEB solutions.</p>
    <p>To help our engineering design division perform a feasibility assessment and create a preliminary custom design layout for your project, we require a few detailed technical parameters.</p>
    <p>Please click the button below to fill out our <strong>Detailed Project Specification Form</strong>:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.APP_BASE_URL || 'http://localhost:5173'}/apply" style="background: #f59e0b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; display: inline-block; box-shadow: 0 4px 6px rgba(245,158,11,0.2);">Provide Technical Specifications</a>
    </div>
  </div>
  `;

  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"ARKOO Engineering Division" <${process.env.GMAIL_USER || 'arkooprebuildai@gmail.com'}>`,
      to: emailAddress,
      subject: "ACTION REQUIRED: Complete Detailed PEB Structural Specification Form",
      html: customerHtmlContent,
    });
    console.log(`[CUSTOMER EMAIL] Form link sent successfully via Gmail to ${emailAddress}: ${info.messageId}`);
    return null; 
  } catch (error) {
    console.error(`⚠️ Gmail failed for customer email to ${emailAddress}, attempting Ethereal fallback:`, error.message);
    try {
      const testAccount = await nodemailer.createTestAccount();
      const fallbackTransporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });

      const info = await fallbackTransporter.sendMail({
        from: '"ARKOO Technical Division" <no-reply@arkoo.in>',
        to: emailAddress,
        subject: `[VERIFICATION] Completion Form Link - ${customerName}`,
        html: customerHtmlContent + `<p><br>---<br><em>Note: This is a verification email sent to the customer via Ethereal fallback.</em></p>`,
      });

      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log(`[CUSTOMER EMAIL] Verification Email Sent to ${emailAddress}! View here:`, previewUrl);
      return previewUrl || null;
    } catch (fallbackError) {
      console.error(`⚠️ Fallback Ethereal failed for customer email to ${emailAddress}:`, fallbackError.message);
      return null;
    }
  }
}

async function test() {
  console.log("Running standalone customer email test...");
  await sendCustomerEmail("Pranav Ingale Test", "itspranavingale@gmail.com", "ARKOO-TEST-123");
}

test();
