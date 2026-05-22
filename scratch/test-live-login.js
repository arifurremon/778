const testLiveLogin = async () => {
  const testEmail = 'testuser_1779418563035@test.com';
  const testPassword = 'StrongPassword123!';
  const baseUrl = 'https://www.thechattala.com';

  console.log(`--- STARTING LIVE LOGIN TEST ON ${baseUrl} ---`);

  try {
    console.log(`\nTesting Login for ${testEmail}...`);
    
    // a. Get CSRF Token
    const csrfRes = await fetch(`${baseUrl}/api/auth/csrf`);
    if (!csrfRes.ok) {
      console.error(`Failed to reach auth endpoints. Status: ${csrfRes.status}`);
      process.exit(1);
    }
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
      redirect: 'manual',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cookie': cookies.split(',').map(c => c.split(';')[0]).join('; ')
      },
      body: loginParams.toString()
    });

    console.log(`Login Response Status: ${loginRes.status}`);
    console.log(`Redirect Location: ${loginRes.headers.get('location')}`);

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

testLiveLogin();
