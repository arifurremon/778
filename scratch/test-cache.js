require('dotenv').config();

async function testCache() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!url || !token) {
    console.error("Missing Upstash credentials");
    return;
  }
  
  console.log("Fetching /api/posts to populate cache...");
  try {
    const res = await fetch("http://localhost:9002/api/posts");
    console.log("Posts response:", res.status);
  } catch (e) {
    console.log("Could not fetch posts via API:", e.message);
  }

  console.log("Checking Upstash for cache:tag:posts...");
  const authHeader = { Authorization: `Bearer ${token}` };
  
  const typeRes = await fetch(`${url}/type/cache:tag:posts`, { headers: authHeader });
  const typeData = await typeRes.json();
  console.log("Type of cache:tag:posts:", typeData.result);
  
  const smembersRes = await fetch(`${url}/smembers/cache:tag:posts`, { headers: authHeader });
  const smembersData = await smembersRes.json();
  console.log("Members:", smembersData.result);
}

testCache().catch(console.error);
