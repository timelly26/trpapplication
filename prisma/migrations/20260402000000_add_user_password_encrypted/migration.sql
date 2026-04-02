-- Add encrypted password storage for SUPERADMIN viewing.
-- Existing bcrypt hashes in User.password cannot be reversed; these fields are populated on create/reset going forward.

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordEncrypted" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "passwordEncryptedPrev" TEXT;

