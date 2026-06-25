async function run() {
  try {
    console.log("Fetching lead details for ID 151...");
    const res1 = await fetch("http://localhost:3002/api/leads/151");
    const json1 = await res1.json();
    console.log("ID 151 response:", JSON.stringify(json1, null, 2));

    console.log("\nFetching lead details for ID 152...");
    const res2 = await fetch("http://localhost:3002/api/leads/152");
    const json2 = await res2.json();
    console.log("ID 152 response:", JSON.stringify(json2, null, 2));
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
