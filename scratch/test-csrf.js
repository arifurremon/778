async function testCsrf() {
  const url = 'http://localhost:9002/api/user/delete-account';
  
  console.log("Test 1: No CSRF token");
  const res1 = await fetch(url, { method: 'DELETE' });
  console.log("Status:", res1.status, "Body:", await res1.text());

  console.log("\nTest 2: Fake CSRF token, no auth");
  const res2 = await fetch(url, { 
    method: 'DELETE',
    headers: { 'x-csrf-token': 'fake-token-123' }
  });
  console.log("Status:", res2.status, "Body:", await res2.text());
}

testCsrf().catch(console.error);
