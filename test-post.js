async function run() {
  try {
    const r = await fetch('https://arkoo-u8sx.onrender.com/api/lms/leads/ingest', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        fullName: 'Manish', 
        phone: '8851597099', 
        email: 'manish@gmail.com', 
        projectType: 'PEB Structure', 
        projectLocation: 'Pune', 
        projectAreaSqft: 2000, 
        estimatedBudget: '15 - 30 Lakhs', 
        completionTimeline: '1 - 3 Months', 
        requirements: 'hi', 
        project: { 
          type: 'PEB Structure', 
          location: 'Pune', 
          area: 2000, 
          budget: '15 - 30 Lakhs', 
          completionTime: '1 - 3 Months' 
        } 
      }) 
    });
    const text = await r.text(); 
    console.log('STATUS:', r.status); 
    console.log('BODY:', text);
  } catch (err) {
    console.error('ERROR:', err);
  }
}
run();
