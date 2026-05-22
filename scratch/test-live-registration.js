const testLiveFlow = async () => {
  const timestamp = Date.now();
  const testEmail = `live_tester_${timestamp}@test.com`;
  const testPassword = 'StrongPassword123!';
  const testUsername = `livetst_${Math.floor(timestamp / 1000)}`;
  const baseUrl = 'https://www.thechattala.com';

  console.log(`--- STARTING LIVE REGISTRATION & LOGIN TEST ON ${baseUrl} ---`);

  try {
    // 1. Get CSRF Token
    console.log(`\n1. Fetching CSRF Token...`);
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    if (!csrfRes.ok) {
      console.error(`❌ Failed to reach auth endpoints. Status: ${csrfRes.status}`);
      process.exit(1);
    }
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookiesArray = csrfRes.headers.get('set-cookie');
    const cookies = cookiesArray ? cookiesArray.split(',').map(c => c.split(';')[0]).join('; ') : '';
    
    if (!csrfToken) {
      console.error('❌ Failed to get CSRF token.');
      process.exit(1);
    }
    console.log(`✅ CSRF Token Acquired.`);

    // 2. Test Registration
    console.log(`\n2. Testing Registration for ${testEmail}...`);
    const regPayload = {
      email: testEmail,
      pass: testPassword,
      name: 'Live Tester',
      username: testUsername,
      mobile: '01711000000',
      location: 'Chittagong',
      dob: '1995-01-01',
      profession: 'Tester'
    };

    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        'Cookie': cookies
      },
      body: JSON.stringify(regPayload)
    });

    const regStatus = regRes.status;
    let regText = await regRes.text();
    let regData;
    try {
      regData = JSON.parse(regText);
    } catch(e) {
      require('fs').writeFileSync('scratch/live-error.html', regText);
      console.error(`❌ Registration failed to parse JSON. Status: ${regStatus}, Body saved to scratch/live-error.html`);
      process.exit(1);
    }

    console.log(`Registration Response (${regStatus}):`, regData);

    if (regStatus === 201) {
      console.log('✅ Registration successful on LIVE Server!');
    } else {
      console.error('❌ Registration failed on LIVE Server! Aborting test.');
      process.exit(1);
    }

    // 3. Test Login
    console.log(`\n3. Testing Login for ${testEmail}...`);
    const loginParams = new URLSearchParams();
    loginParams.append('email', testEmail);
    loginParams.append('password', testPassword);
    loginParams.append('redirect', 'false');
    loginParams.append('csrfToken', csrfToken);
    loginParams.append('callbackUrl', `${baseUrl}/dashboard`);
    loginParams.append('json', 'true');

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies
      },
      body: loginParams.toString()
    });

    console.log(`Login Response Status: ${loginRes.status}`);
    const locHeader = loginRes.headers.get('location');
    console.log(`Redirect Location: ${locHeader}`);

    if (loginRes.status === 302 || loginRes.status === 303 || loginRes.status === 307) {
      console.log('✅ Live Login successful! We received a valid session redirect to the dashboard.');
    } else {
      const text = await loginRes.text();
      console.error('❌ Login failed! Credentials may be incorrect or server rejected it. Response:', text.substring(0, 200));
    }

  } catch (error) {
    console.error('Test script encountered an error:', error);
  }
};

testLiveFlow();
