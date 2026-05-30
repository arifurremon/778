-- Add an expiry timestamp for first-party email verification tokens.
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailTokenExp" TIMESTAMP(3);

-- Token lookup is on the token plus expiry window during verification.
CREATE INDEX IF NOT EXISTS "User_emailToken_emailTokenExp_idx" ON "User"("emailToken", "emailTokenExp");
