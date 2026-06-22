async function sendTestLandingLead() {
  const url = 'http://localhost:3002/api/lms/leads/ingest';
  const rand = Math.floor(Math.random() * 90000 + 10000);
  
  const randomSuffix = Math.floor(Math.random() * 10000);
  const payload = {
    contact: {
      name: "Pranav Ingale",
      phone: `942320${randomSuffix.toString().padStart(4, '0')}`,
      email: "itspranavingale@gmail.com"
    },
    project: {
      location: "Pune Hadapsar",
      type: "Warehouse/Logistics Park",
      area: 1500,
      budget: "10 Lakhs - 15 Lakhs",
      completionTime: "3-6 Months"
    }
  };

  console.log("🚀 Simulating landing page form submission to:", url);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();
    console.log("\n--- Ingestion gateway response ---");
    console.log("Status Code:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Connection failed. Make sure api-server is running on port 3002.", error.message);
  }
}

sendTestLandingLead();
