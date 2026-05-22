const { spawn } = require('child_process');

async function testRace() {
  const timestamp = Date.now();
  const url = 'http://localhost:9002/api/auth/register';
  const usernameSuffix = Date.now().toString().slice(-8);
  const body = JSON.stringify({
    email: `racetest_${usernameSuffix}@test.com`,
    password: 'password123',
    username: `race_${usernameSuffix}`,
    name: 'Race Test User',
    mobile: '01712345678',
    location: 'Panchlaish',
    dob: '1990-01-01',
    profession: 'Tester'
  });

  const headers = {
    'Content-Type': 'application/json'
  };

  console.log("Sending two simultaneous registration requests...");

  const req1 = fetch(url, { method: 'POST', body, headers });
  const req2 = fetch(url, { method: 'POST', body, headers });

  const [res1, res2] = await Promise.all([req1, req2]);
  
  console.log("Response 1:", res1.status, await res1.text());
  console.log("Response 2:", res2.status, await res2.text());
}

testRace().catch(console.error);
