/*
  Warnings:

  - Made the column `organizationId` on table `Wallet` required. This step will fail if there are existing NULL values in that column.

*/

-- First, update any wallets with NULL organizationId to use their user's organization
UPDATE "Wallet" w
SET "organizationId" = u."organizationId"
FROM "User" u
WHERE w."userId" = u.id
  AND w."organizationId" IS NULL
  AND u."organizationId" IS NOT NULL;

-- For any remaining wallets where user also has no org, assign to first org (or delete if none)
UPDATE "Wallet" w
SET "organizationId" = (SELECT id FROM "Organization" LIMIT 1)
WHERE w."organizationId" IS NULL
  AND EXISTS (SELECT 1 FROM "Organization" LIMIT 1);

-- Delete orphaned wallets that still have no org (shouldn't happen normally)
DELETE FROM "Wallet" WHERE "organizationId" IS NULL;

-- AlterTable
ALTER TABLE "Wallet" ALTER COLUMN "organizationId" SET NOT NULL;

-- CreateTable
CREATE TABLE "OrganizationInvitation" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "inviteCode" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "usedByUserId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationInvitation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationInvitation_inviteCode_key" ON "OrganizationInvitation"("inviteCode");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_organizationId_idx" ON "OrganizationInvitation"("organizationId");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_email_idx" ON "OrganizationInvitation"("email");

-- CreateIndex
CREATE INDEX "OrganizationInvitation_inviteCode_idx" ON "OrganizationInvitation"("inviteCode");

-- AddForeignKey
ALTER TABLE "OrganizationInvitation" ADD CONSTRAINT "OrganizationInvitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
