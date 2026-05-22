const testAuth = async () => {
  const timestamp = Date.now();
  const testEmail = `testuser_${timestamp}@test.com`;
  const testPassword = 'StrongPassword123!';
  const testUsername = `test_${Math.floor(timestamp / 1000)}`;
  const baseUrl = 'http://localhost:9002';

  console.log('--- STARTING AUTH FLOW TEST ---');

  try {
    // 1. Test Registration
    console.log(`\n1. Testing Registration for ${testEmail}...`);
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
        name: 'Test User',
        username: testUsername,
        mobile: '01712345678',
        location: 'Khulshi',
        dob: '1990-01-01',
        profession: 'Tester'
      })
    });
    
    const regData = await regRes.json();
    console.log(`Registration Response (${regRes.status}):`, regData);
    
    if (regRes.status !== 201) {
      console.error('Registration failed! Aborting test.');
      process.exit(1);
    }
    
    if (regData.emailSent === false) {
      console.warn('⚠️ User created, but email failed to send (SMTP issue).');
    } else {
      console.log('✅ User created and verification email sent successfully!');
    }

    // 2. Test Login (NextAuth Credentials)
    console.log(`\n2. Testing Login for ${testEmail}...`);
    
    // a. Get CSRF Token
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    const csrfData = await csrfRes.json();
    const csrfToken = csrfData.csrfToken;
    const cookies = csrfRes.headers.get('set-cookie');
    
    if (!csrfToken || !cookies) {
      console.error('Failed to get CSRF token or cookies for login.');
      process.exit(1);
    }

    // b. Post Credentials
    const loginParams = new URLSearchParams();
    loginParams.append('email', testEmail);
    loginParams.append('password', testPassword);
    loginParams.append('redirect', 'false');
    loginParams.append('csrfToken', csrfToken);
    loginParams.append('callbackUrl', `${baseUrl}/dashboard`);
    loginParams.append('json', 'true');

    const loginRes = await fetch(`${baseUrl}/api/auth/callback/credentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.split(',').map(c => c.split(';')[0]).join('; ')
      },
      body: loginParams.toString()
    });

    const loginData = await loginRes.json();
    console.log(`Login Response (${loginRes.status}):`, loginData);

    if (loginRes.status === 200 && loginData.url && !loginData.url.includes('error=')) {
      console.log('✅ Login successful!');
    } else {
      console.error('❌ Login failed!');
    }

  } catch (error) {
    console.error('Test script encountered an error:', error);
  }
};

testAuth();
