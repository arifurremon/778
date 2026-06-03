-- Store extended merchant enrollment data submitted via the registration wizard.
ALTER TABLE "Shop" ADD COLUMN IF NOT EXISTS "registrationDetails" JSONB;
