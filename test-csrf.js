const crypto = require('crypto');

function createHash(message) {
  return crypto.createHash("sha256").update(message).digest("hex");
}

function createCSRFToken(secret) {
  const token = crypto.randomBytes(32).toString('hex');
  const salt = crypto.randomBytes(32).toString('hex');
  const hash = createHash(`${token}${secret}${salt}`);
  return { token, cookieValue: `${hash}|${salt}` };
}

function validateCSRFToken(token, cookieValue, secret) {
  if (!cookieValue) return false;
  const [hash, salt] = cookieValue.split('|');
  const expectedHash = createHash(`${token}${secret}${salt}`);
  return hash === expectedHash;
}

const secret = "my-secret-key";
const { token, cookieValue } = createCSRFToken(secret);
console.log({ token, cookieValue });
console.log("Valid:", validateCSRFToken(token, cookieValue, secret));
console.log("Invalid:", validateCSRFToken("wrong", cookieValue, secret));
