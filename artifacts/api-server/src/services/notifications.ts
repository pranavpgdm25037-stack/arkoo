export async function sendWhatsAppMessage(phone: string, message: string): Promise<boolean> {
  // Mock WhatsApp Business API Integration
  console.log(`[WhatsApp API Mock] Sending message to ${phone}...`);
  console.log(`[WhatsApp API Mock] Message Content: "${message}"`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[WhatsApp API Mock] Message sent successfully to ${phone}.`);
      resolve(true);
    }, 500);
  });
}

export async function sendEmailNotification(email: string, subject: string, body: string): Promise<boolean> {
  // Mock SendGrid / SES Integration
  console.log(`[Email API Mock] Sending email to ${email}...`);
  console.log(`[Email API Mock] Subject: "${subject}"`);
  
  return new Promise((resolve) => {
    setTimeout(() => {
      console.log(`[Email API Mock] Email sent successfully to ${email}.`);
      resolve(true);
    }, 500);
  });
}

export async function notifySalesTeamOfHotLead(leadName: string, budget: number, location: string) {
  const adminEmail = "sales@arkooprebuild.com";
  const subject = "🔥 NEW HOT LEAD ALERT!";
  const body = `We just received a HOT lead!\nName: ${leadName}\nBudget: ₹${budget}\nLocation: ${location}\nPlease check the CRM dashboard immediately.`;
  
  await sendEmailNotification(adminEmail, subject, body);
}
