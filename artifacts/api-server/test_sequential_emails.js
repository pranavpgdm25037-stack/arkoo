import "dotenv/config";
import nodemailer from "nodemailer";

const createTransporter = () => {
  const user = process.env.GMAIL_USER || 'arkooprebuildai@gmail.com';
  const pass = (process.env.GMAIL_APP_PASSWORD || 'tqphvevoalzsdbvb').replace(/\s/g, "");

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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

async function testSequential() {
  console.log("Starting sequential email test...");
  
  const transporter1 = createTransporter();
  console.log("Sending Email 1 (Sales Rep notification)...");
  try {
    const info1 = await transporter1.sendMail({
      from: `"ARKOO Pre-Build AI" <arkooprebuildai@gmail.com>`,
      to: "newleadnotification001@gmail.com",
      subject: "Test Sales Notification",
      html: "<p>New lead received!</p>"
    });
    console.log("Email 1 sent successfully:", info1.messageId);
  } catch (err) {
    console.error("Email 1 failed:", err.message);
  }

  const transporter2 = createTransporter();
  console.log("\nSending Email 2 (Customer notification)...");
  try {
    const info2 = await transporter2.sendMail({
      from: `"ARKOO Engineering Division" <arkooprebuildai@gmail.com>`,
      to: "itspranavingale@gmail.com",
      subject: "Test Customer Form",
      html: "<p>Please complete your form.</p>"
    });
    console.log("Email 2 sent successfully:", info2.messageId);
  } catch (err) {
    console.error("Email 2 failed:", err.message);
  }
}

testSequential();
