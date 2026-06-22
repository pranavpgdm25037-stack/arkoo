async function testGoogleFormSubmit() {
  const url = 'https://669ce05b1ac962.lhr.life/api/lms/google-form/submit';
  
  // Simulated Google Form response payload (can be arbitrary question-answer keys!)
  const payload = {
    "What is your full name?": "Pranav Ingale",
    "What is your email address?": "itspranavingale@gmail.com",
    "What is your contact number?": "9423205577",
    "Project Location": "Pune Hadapsar",
    "Project Type": "Warehouse",
    "Proposed Area (Sq Ft)": "1500 sqft",
    "Estimated Budget": "10 - 15 lakhs",
    "Timeline": "3-6 months",
    "Additional Requirements": "Double slope PEB warehouse for agro storage, clear height 9m."
  };

  console.log("🚀 Simulating Google Form submission webhook to:", url);
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
    console.log("\n--- Google Form Ingestion Response ---");
    console.log("Status Code:", response.status);
    console.log("Response Body:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testGoogleFormSubmit();
