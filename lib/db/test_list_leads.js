async function run() {
  try {
    console.log("Fetching leads list from /api/leads...");
    const res = await fetch("http://localhost:3002/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    const json = await res.json();
    console.log("Leads list (first 3):", JSON.stringify(json.slice(0, 3), null, 2));
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
