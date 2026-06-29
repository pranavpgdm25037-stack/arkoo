async function run() {
  const start = Date.now();
  try {
    const r = await fetch('https://arkoo-u8sx.onrender.com/api/lms/google-form/submit', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ 
        fullname: 'Test Customer ' + Date.now(), 
        emailaddress: 'shree@example.com', // Replace with a test email if needed to verify receipt
        phonenumber: '9999999999', 
        projecttype: 'Residential Building', 
        projectlocation: 'Mumbai', 
        proposedarea: '4500 sq ft', 
        estimatedbudget: '50 Lakhs - 1 Crore', 
        completiontimeline: '3 - 6 Months', 
        additionalrequirements: 'Test requirement please review the project specifications.',
        landownership: 'Owned',
        govapprovals: 'In Progress',
        hiredarchitect: 'Yes'
      }) 
    });
    const text = await r.text(); 
    console.log('STATUS:', r.status);
    console.log('TIME TAKEN:', Date.now() - start, 'ms');
    console.log('BODY:', text);
  } catch(e) {
    console.error(e);
  }
}
run();
