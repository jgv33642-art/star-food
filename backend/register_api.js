fetch('http://localhost:3000/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    companyName: "urbs drinks",
    password: "336421",
    plan: "pro"
  })
})
.then(async res => {
  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Response:', data);
})
.catch(console.error);
