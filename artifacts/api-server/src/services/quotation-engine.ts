export interface QuotationData {
  customerName: string;
  customerContact: string;
  projectType: string; // e.g., "Industrial Shed", "Warehouse", "Multi-Story Building", "Pre-Engineered Building"
  areaSqft: number;
  ratePerSqft: number;
  taxRate: number; // e.g. 0.18 for 18% GST
  customRequirements?: string;
  projectId?: number;
}

export async function generateQuotationHtml(data: QuotationData): Promise<string> {
  const subtotal = data.areaSqft * data.ratePerSqft;
  const taxAmount = subtotal * data.taxRate;
  const total = subtotal + taxAmount;

  const date = new Date().toLocaleDateString("en-IN");
  const quotationNumber = `ARK-${Math.floor(Math.random() * 10000).toString().padStart(4, "0")}`;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; margin: 0; padding: 40px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0056b3; padding-bottom: 20px; margin-bottom: 30px; }
        .company-info h1 { color: #0056b3; margin: 0 0 5px 0; font-size: 28px; }
        .company-info p { margin: 2px 0; font-size: 14px; color: #666; }
        .quote-info { text-align: right; }
        .quote-info h2 { color: #555; margin: 0 0 10px 0; }
        .client-section { margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
        th { background-color: #f4f7f6; color: #333; text-align: left; padding: 12px; border: 1px solid #ddd; }
        td { padding: 12px; border: 1px solid #ddd; }
        .totals { width: 40%; margin-left: auto; }
        .totals th, .totals td { text-align: right; border: none; padding: 8px 12px; }
        .totals .grand-total { font-weight: bold; font-size: 18px; border-top: 2px solid #333; }
        .footer { margin-top: 50px; font-size: 12px; color: #777; text-align: center; border-top: 1px solid #eee; padding-top: 20px; }
        .tagline { font-style: italic; color: #0056b3; margin-top: 10px; font-weight: bold;}
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>ARKOO PRE-BUILD PVT. LTD.</h1>
          <p>Survey No. 40(4B), Gatha Mandir New Bypass Road</p>
          <p>Behind Abhanga English Medium School, Tal. Haveli, Pune-412109</p>
          <p>Email: info@arkooprebuild.com | Phone: +91-8600022431, +91-9822102629</p>
          <p class="tagline">"Designing Excellence, Building Trust"</p>
        </div>
        <div class="quote-info">
          <h2>PROFORMA INVOICE / QUOTATION</h2>
          <p><strong>Quote No:</strong> ${quotationNumber}</p>
          <p><strong>Date:</strong> ${date}</p>
          <p><strong>Valid Until:</strong> ${new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN")}</p>
        </div>
      </div>

      <div class="client-section">
        <h3>Prepared For:</h3>
        <p><strong>Name/Company:</strong> ${data.customerName}</p>
        <p><strong>Contact:</strong> ${data.customerContact}</p>
      </div>

      <h3>Project Details</h3>
      <p><strong>Scope of Work:</strong> Design, Supply, and Erection of ${data.projectType}. ${data.customRequirements ? "Special Requirements: " + data.customRequirements : ""}</p>

      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th>Area (Sq. Ft)</th>
            <th>Rate per Sq. Ft (₹)</th>
            <th>Total Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Prefabricated ${data.projectType} (Steel structure, roofing, and standard cladding)</td>
            <td>${data.areaSqft}</td>
            <td>${data.ratePerSqft.toLocaleString("en-IN")}</td>
            <td>${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
          </tr>
        </tbody>
      </table>

      <table class="totals">
        <tr>
          <th>Subtotal:</th>
          <td>₹ ${subtotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr>
          <th>GST (${(data.taxRate * 100).toFixed(0)}%):</th>
          <td>₹ ${taxAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
        <tr class="grand-total">
          <th>Grand Total:</th>
          <td>₹ ${total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
        </tr>
      </table>

      <div class="footer">
        <h4>Terms & Conditions</h4>
        <p style="text-align: left; padding: 0 40px;">
          1. <strong>Payment Terms:</strong> 40% advance along with work order, 40% against dispatch of materials, 20% against completion of erection.<br>
          2. <strong>Delivery:</strong> Material delivery within 3-4 weeks from the date of advance payment and drawing approval.<br>
          3. <strong>Civil Work:</strong> Civil foundations and anchor bolt casting are not included in our scope unless specified.<br>
          4. <strong>Jurisdiction:</strong> Subject to Pune jurisdiction.
        </p>
        <p>Thank you for choosing Arkoo Pre-Build Pvt. Ltd. We look forward to building a strong relationship with you.</p>
      </div>
    </body>
    </html>
  `;
  return html;
}

export async function generateQuotationPdf(data: QuotationData): Promise<string> {
  // const html = await generateQuotationHtml(data);
  // In a real Node environment, we would use Puppeteer or pdfkit here.
  // const browser = await puppeteer.launch();
  // const page = await browser.newPage();
  // await page.setContent(html);
  // const buffer = await page.pdf({ format: 'A4' });
  // await browser.close();
  
  // Return a mock S3 URL for now since we are in dev/mock phase
  const mockS3Url = `https://storage.arkooprebuild.com/quotations/${data.customerName.replace(/\s+/g, '-').toLowerCase()}-quote.pdf`;
  console.log(`[Quotation Engine] Generated Mock PDF at ${mockS3Url}`);
  return mockS3Url;
}
