import nodemailer from "nodemailer";

// Configuration for Gmail
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
    // Adding extra reliability flags
    socketTimeout: 30000,
    connectionTimeout: 30000
  });
};

export const handler = async (event: any, context: any) => {
  // Only allow POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const data = JSON.parse(event.body || "{}");
    const { 
      customerName, 
      phoneNumber, 
      emailAddress, 
      projectLocation, 
      projectType, 
      projectAreaSqft, 
      estimatedBudget, 
      completionTimeline, 
      leadSource, 
      requirements 
    } = data;

    if (!customerName) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing customerName" }) };
    }

    const transporter = createTransporter();

    // 1. Send Email Notification to Sales Team
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2 style="color: #2c3e50;">New ARKOO Lead Assignment</h2>
      <p>Dear Sales Team,</p>
      <p>A new lead has been generated and assigned for follow-up. Please find the details below:</p>
      
      <table style="border-collapse: collapse; width: 100%; max-width: 600px; margin-bottom: 20px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; width: 40%;"><strong>Lead Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${customerName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Contact Number</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${phoneNumber || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Email ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${emailAddress || 'N/A'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Location</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectLocation || 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Type</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectType || 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Project Area</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${projectAreaSqft > 0 ? projectAreaSqft + ' Sq. Ft.' : 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Estimated Budget</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${estimatedBudget && estimatedBudget !== '0' ? estimatedBudget : 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Timeline</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${completionTimeline || 'Not Specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9;"><strong>Lead Source</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><span style="padding: 3px 8px; border-radius: 4px; background: #e3f2fd; color: #0d47a1; font-weight: bold;">${leadSource || 'Landing Page'}</span></td></tr>
      </table>

      <h3>Customer Requirements:</h3>
      <p style="background: #f4f4f4; padding: 10px; border-left: 4px solid #0056b3; font-style: italic;">${requirements || 'None specified'}</p>

      <p><strong>Action Required:</strong> Please connect with the customer at the earliest and update the lead status in the system after the interaction.</p>

      <p>Regards,<br><strong>ARKOO Lead Management System</strong><br>ARKOO</p>
    </div>
    `;

    await transporter.sendMail({
      from: `"ARKOO Pre-Build AI" <${process.env.GMAIL_USER || 'arkooprebuildai@gmail.com'}>`,
      to: process.env.SALES_REP_EMAIL || 'newleadnotification001@gmail.com',
      replyTo: process.env.GMAIL_USER || 'arkooprebuildai@gmail.com',
      subject: `New Project Inquiry: ${customerName} (${projectType || 'Project'})`,
      html: htmlContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
        'Importance': 'High'
      }
    });

    // 2. Send Thank You Email to Customer (if email is provided)
    if (emailAddress) {
      const baseUrl = process.env.URL || "https://arkooprebuild.com"; // Netlify URL
      const customerHtmlContent = `
      <div style="font-family: Calibri, Arial, sans-serif; font-size: 16px; line-height: 1.5; color: #222222; max-width: 600px;">
        <p>Hi ${customerName},</p>
        <p>Thanks for reaching out to us at Arkoo Prebuild regarding your project. I received your enquiry and would love to help you get started on the layout designs.</p>
        <p>To help our engineering team draft a custom design layout and feasibility report for you, could you please take a minute to fill in your project specifications here?</p>
        <p style="margin: 20px 0;">
          👉 <a href="${baseUrl}/apply" style="color: #1a0dab; font-weight: bold; text-decoration: underline; font-size: 16px;">Open Project Specification Form</a>
        </p>
        <p>Please submit this at your earliest convenience so I can pass it to our drafting division.</p>
        <p>Let me know if you have any questions!</p>
        <br>
        <p>Best regards,</p>
        <p><strong>Arkoo Prebuild Team</strong><br>
        Arkoo Pre-Build Pvt. Ltd.</p>
      </div>
      `;

      await transporter.sendMail({
        from: `"ARKOO Prebuild Team" <${process.env.GMAIL_USER || 'arkooprebuildai@gmail.com'}>`,
        to: emailAddress,
        subject: `Next Steps: Your Arkoo Prebuild Technical Layout Request`,
        html: customerHtmlContent,
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Emails sent successfully" })
    };

  } catch (error: any) {
    console.error("Error sending email:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
