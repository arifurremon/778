-- Add an index for password-reset token lookups by hashed token and expiry.
CREATE INDEX IF NOT EXISTS "User_resetToken_resetTokenExp_idx" ON "User"("resetToken", "resetTokenExp");
