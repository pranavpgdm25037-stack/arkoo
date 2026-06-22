async function createLeads() {
  const url = 'http://localhost:3000/api/webhooks/arkoo-lead';
  
  const leadsToCreate = [
    {
      fullName: "M/S Brisson (Test Lead)",
      phoneNumber: "+91 86000 22431",
      emailAddress: "info@brisson.com",
      requirements: "Looking to build a 8,137 sqft Pre-engineered building factory shed (industrial warehouse) in Pune. Hand-drawn design coordinates are available.",
      leadSource: "Handmade drawing Test"
    },
    {
      fullName: "Delfrost Cold Storage (Test Lead)",
      phoneNumber: "+91 98234 56789",
      emailAddress: "sales@delfrost.co.in",
      requirements: "Looking to build a 25,704 sqft high-capacity PEB cold storage shed in Mumbai. GA drawing centerline blueprints are ready for submission.",
      leadSource: "GA drawing Test"
    },
    {
      fullName: "Rishi Vashi Developments (Test Lead)",
      phoneNumber: "+91 90000 88888",
      emailAddress: "rishi.vashi@example.com",
      requirements: "Requesting a Custom Pre-Build Solution for a large warehouse footprint of 51,667 sqft in Chakan. Detailed Project Information Sheet (PIF) spreadsheet is ready.",
      leadSource: "PIF Quotation Test"
    }
  ];

  console.log("Creating test leads on the local server...\n");

  for (const lead of leadsToCreate) {
    console.log(`Sending webhook request for: ${lead.fullName}`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "Customer Name": lead.fullName,
          "Phone Number": lead.phoneNumber,
          "Email Address": lead.emailAddress,
          "Customer Requirements": lead.requirements,
          "source": lead.leadSource
        })
      });

      const data = await response.json();
      console.log("Response status:", response.status);
      console.log("Response body:", JSON.stringify(data, null, 2));
      console.log("--------------------------------------------------\n");
    } catch (error) {
      console.error(`Failed to create lead "${lead.fullName}":`, error.message);
    }
  }
}

createLeads();
