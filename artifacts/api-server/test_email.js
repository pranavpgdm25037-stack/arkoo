import "dotenv/config";
import nodemailer from "nodemailer";

const user = "arkooprebuildai@gmail.com";
const pass = "tqphvevoalzsdbvb"; // from .env file

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: user,
    pass: pass,
  },
  debug: true,
  logger: true
});

async function run() {
  console.log("Sending simple test email...");
  try {
    const info = await transporter.sendMail({
      from: `"ARKOO test" <${user}>`,
      to: "itspranavingale@gmail.com",
      subject: "Simple Test Email " + Date.now(),
      text: "Hello, this is a simple text test email to verify delivery.",
    });
    console.log("Email sent! Info:", info.messageId);
  } catch (err) {
    console.error("Error sending email:", err);
  }
}

run();
