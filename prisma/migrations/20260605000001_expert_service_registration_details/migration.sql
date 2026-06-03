-- Store extended expert enrollment data submitted via the registration wizard.
ALTER TABLE "ExpertService" ADD COLUMN IF NOT EXISTS "registrationDetails" JSONB;
