/*
  Warnings:

  - You are about to alter the column `balance` on the `FinancialAccount` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to drop the column `alertThreshold` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `interestAccrued` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `outstandingAmount` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `paidAmount` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `paymentAmount` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `principalAmount` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `startDate` on the `Liability` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Liability` table. All the data in the column will be lost.
  - You are about to alter the column `amount` on the `Receipt` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to alter the column `amount` on the `Transaction` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(19,4)`.
  - You are about to drop the `ArchiveItem` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[liabilityId]` on the table `Liability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[organizationId,liabilityId]` on the table `Liability` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[paymentId]` on the table `LiabilityPayment` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,address,network]` on the table `Wallet` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `inceptionDate` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `liabilityId` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPrincipal` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `outstandingPrincipal` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `primaryClass` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `totalOutstanding` to the `Liability` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paymentId` to the `LiabilityPayment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `LiabilityPayment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ArchiveItem" DROP CONSTRAINT "ArchiveItem_organizationId_fkey";

-- DropIndex
DROP INDEX "Liability_organizationId_type_idx";

-- DropIndex
DROP INDEX "Wallet_userId_address_key";

-- AlterTable
ALTER TABLE "FinancialAccount" ALTER COLUMN "balance" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "Invoice" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "bankDetails" JSONB,
ADD COLUMN     "baseCurrency" TEXT,
ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledBy" TEXT,
ADD COLUMN     "cancelledByName" TEXT,
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedBy" TEXT,
ADD COLUMN     "confirmedByName" TEXT,
ADD COLUMN     "costCenterId" TEXT,
ADD COLUMN     "createdBy" TEXT,
ADD COLUMN     "createdByName" TEXT,
ADD COLUMN     "customerAddress" JSONB,
ADD COLUMN     "customerEmail" TEXT,
ADD COLUMN     "customerId" TEXT,
ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerTaxId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "discountPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
ADD COLUMN     "entityAddress" JSONB,
ADD COLUMN     "entityId" TEXT,
ADD COLUMN     "entityName" TEXT,
ADD COLUMN     "entityTaxId" TEXT,
ADD COLUMN     "fiscalPeriod" TEXT,
ADD COLUMN     "fiscalYear" INTEGER,
ADD COLUMN     "fxRateDate" TIMESTAMP(3),
ADD COLUMN     "fxRateToBase" DECIMAL(15,6),
ADD COLUMN     "isLatest" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "orderNumber" TEXT,
ADD COLUMN     "outstandingAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "parentInvoiceId" TEXT,
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "poNumber" TEXT,
ADD COLUMN     "previousVersionId" TEXT,
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "receivableId" TEXT,
ADD COLUMN     "recurringEndDate" TIMESTAMP(3),
ADD COLUMN     "reference" TEXT,
ADD COLUMN     "taxClassification" TEXT,
ADD COLUMN     "taxJurisdiction" TEXT,
ADD COLUMN     "taxableAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "totalInBase" DECIMAL(15,2),
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "sender" DROP NOT NULL,
ALTER COLUMN "recipient" DROP NOT NULL,
ALTER COLUMN "payment" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Liability" DROP COLUMN "alertThreshold",
DROP COLUMN "interestAccrued",
DROP COLUMN "outstandingAmount",
DROP COLUMN "paidAmount",
DROP COLUMN "paymentAmount",
DROP COLUMN "principalAmount",
DROP COLUMN "startDate",
DROP COLUMN "type",
ADD COLUMN     "accruedInterest" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "activationDate" TIMESTAMP(3),
ADD COLUMN     "amortizationMethod" TEXT,
ADD COLUMN     "amountInReporting" DECIMAL(15,2),
ADD COLUMN     "approvalChain" JSONB,
ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvalThreshold" DECIMAL(15,2),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "archiveReason" TEXT,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "archivedBy" TEXT,
ADD COLUMN     "cashflowProbability" DECIMAL(3,2) NOT NULL DEFAULT 1,
ADD COLUMN     "collateralCurrency" TEXT,
ADD COLUMN     "collateralType" TEXT,
ADD COLUMN     "collateralValuationDate" TIMESTAMP(3),
ADD COLUMN     "commitmentFee" DECIMAL(15,2),
ADD COLUMN     "commitmentFeeRate" DECIMAL(5,4),
ADD COLUMN     "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 1,
ADD COLUMN     "covenantBreaches" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "daysOverdue" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "defaultDate" TIMESTAMP(3),
ADD COLUMN     "defaultProbability" DECIMAL(5,4),
ADD COLUMN     "defaultReason" TEXT,
ADD COLUMN     "disputeAmount" DECIMAL(15,2),
ADD COLUMN     "disputeOpenedAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "disputeResolution" TEXT,
ADD COLUMN     "disputeResolvedAt" TIMESTAMP(3),
ADD COLUMN     "earliestCashImpact" DECIMAL(15,2),
ADD COLUMN     "earlyRepaymentAllowed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "earlyRepaymentConditions" TEXT,
ADD COLUMN     "earlyRepaymentPenalty" DECIMAL(5,2),
ADD COLUMN     "eventCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "expectedCashImpact" DECIMAL(15,2),
ADD COLUMN     "feesPenalties" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "fxRateAtRecognition" DECIMAL(15,6),
ADD COLUMN     "fxRateAtSettlement" DECIMAL(15,6),
ADD COLUMN     "fxRateHistory" JSONB,
ADD COLUMN     "fxSource" TEXT,
ADD COLUMN     "graceEndDate" TIMESTAMP(3),
ADD COLUMN     "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "guarantorId" TEXT,
ADD COLUMN     "guarantorName" TEXT,
ADD COLUMN     "hedgeId" TEXT,
ADD COLUMN     "hedgePercentage" DECIMAL(5,2),
ADD COLUMN     "importBatchId" TEXT,
ADD COLUMN     "inceptionDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "interestAccrualStart" TIMESTAMP(3),
ADD COLUMN     "interestCompounding" TEXT,
ADD COLUMN     "interestDayCount" TEXT,
ADD COLUMN     "interestIndex" TEXT,
ADD COLUMN     "interestSchedule" JSONB,
ADD COLUMN     "interestSpread" DECIMAL(5,4),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "internalReference" TEXT,
ADD COLUMN     "isDisputed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isFixed" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isGuaranteed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHedged" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isInterestBearing" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRestructured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWrittenOff" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "jurisdictionIds" TEXT[],
ADD COLUMN     "language" TEXT NOT NULL DEFAULT 'en',
ADD COLUMN     "lastCovenantCheck" TIMESTAMP(3),
ADD COLUMN     "lastEventId" TEXT,
ADD COLUMN     "lastInterestAccrual" TIMESTAMP(3),
ADD COLUMN     "legalEntityId" TEXT,
ADD COLUMN     "legalFeesAccrued" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "legalReference" TEXT,
ADD COLUMN     "liabilityId" TEXT NOT NULL,
ADD COLUMN     "locale" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "nextCashOutflow" TIMESTAMP(3),
ADD COLUMN     "nextCovenantCheck" TIMESTAMP(3),
ADD COLUMN     "nextInterestAccrual" TIMESTAMP(3),
ADD COLUMN     "originalLiabilityId" TEXT,
ADD COLUMN     "originalPrincipal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "originationFee" DECIMAL(15,2),
ADD COLUMN     "originationFeeRate" DECIMAL(5,4),
ADD COLUMN     "otherFeesAccrued" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "outstandingPrincipal" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "partyId" TEXT,
ADD COLUMN     "paymentsCompleted" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "paymentsMissed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "penaltiesAccrued" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "previousStatus" TEXT,
ADD COLUMN     "primaryClass" TEXT NOT NULL,
ADD COLUMN     "recognitionDate" TIMESTAMP(3),
ADD COLUMN     "regularPaymentAmount" DECIMAL(15,2),
ADD COLUMN     "reportingCurrency" TEXT,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "restructuredDate" TIMESTAMP(3),
ADD COLUMN     "restructuredReason" TEXT,
ADD COLUMN     "restructuredTerms" JSONB,
ADD COLUMN     "riskScore" DECIMAL(5,2),
ADD COLUMN     "settledDate" TIMESTAMP(3),
ADD COLUMN     "sourceId" TEXT,
ADD COLUMN     "sourceModule" TEXT,
ADD COLUMN     "sourceType" TEXT NOT NULL DEFAULT 'manual',
ADD COLUMN     "statusChangedAt" TIMESTAMP(3),
ADD COLUMN     "statusChangedBy" TEXT,
ADD COLUMN     "systemTags" TEXT[],
ADD COLUMN     "totalOutstanding" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "totalPaymentsExpected" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalSettled" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "unrealizedFxGainLoss" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "validationMode" TEXT NOT NULL DEFAULT 'hard',
ADD COLUMN     "version" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "worstCaseCashImpact" DECIMAL(15,2),
ADD COLUMN     "writeOffAmount" DECIMAL(15,2),
ADD COLUMN     "writeOffApprovedBy" TEXT,
ADD COLUMN     "writeOffDate" TIMESTAMP(3),
ADD COLUMN     "writeOffReason" TEXT,
ADD COLUMN     "writeOffReasonCode" TEXT,
ALTER COLUMN "status" SET DEFAULT 'draft',
ALTER COLUMN "interestRate" SET DATA TYPE DECIMAL(8,5);

-- AlterTable
ALTER TABLE "LiabilityPayment" ADD COLUMN     "amountInReporting" DECIMAL(15,2),
ADD COLUMN     "approvalChain" JSONB,
ADD COLUMN     "approvalStatus" TEXT,
ADD COLUMN     "approvalThreshold" DECIMAL(15,2),
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "bankReference" TEXT,
ADD COLUMN     "counterpartyLegalEntityId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "executedAt" TIMESTAMP(3),
ADD COLUMN     "executedBy" TEXT,
ADD COLUMN     "failureCode" TEXT,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "fxRate" DECIMAL(15,6),
ADD COLUMN     "isIntercompany" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isReversed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nettingId" TEXT,
ADD COLUMN     "nextRetryAt" TIMESTAMP(3),
ADD COLUMN     "paymentId" TEXT NOT NULL,
ADD COLUMN     "paymentMethod" TEXT,
ADD COLUMN     "penaltyAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "retryCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reversalReason" TEXT,
ADD COLUMN     "reversedAt" TIMESTAMP(3),
ADD COLUMN     "reversedBy" TEXT,
ADD COLUMN     "scheduledDate" TIMESTAMP(3),
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "paymentDate" DROP NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'scheduled';

-- AlterTable
ALTER TABLE "Receipt" ADD COLUMN     "category" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'pending',
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "SavedReport" ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "cacheExpiry" TIMESTAMP(3),
ADD COLUMN     "cachedData" JSONB,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'active';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(19,4);

-- AlterTable
ALTER TABLE "Wallet" ADD COLUMN     "avatar" TEXT,
ADD COLUMN     "ens" TEXT,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isWatching" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "lastSyncStatus" TEXT,
ADD COLUMN     "nativeBalance" DECIMAL(30,18) NOT NULL DEFAULT 0,
ADD COLUMN     "nativeSymbol" TEXT NOT NULL DEFAULT 'ETH',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "purpose" TEXT NOT NULL DEFAULT 'operations',
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "totalValueUsd" DECIMAL(15,2) NOT NULL DEFAULT 0,
ADD COLUMN     "walletType" TEXT NOT NULL DEFAULT 'hot';

-- DropTable
DROP TABLE "ArchiveItem";

-- CreateTable
CREATE TABLE "WalletToken" (
    "id" TEXT NOT NULL,
    "contractAddress" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL DEFAULT 18,
    "logoUrl" TEXT,
    "balance" DECIMAL(30,18) NOT NULL DEFAULT 0,
    "balanceUsd" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "priceUsd" DECIMAL(20,8) NOT NULL DEFAULT 0,
    "price24hChange" DECIMAL(8,4),
    "tokenType" TEXT NOT NULL DEFAULT 'erc20',
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "isSpam" BOOLEAN NOT NULL DEFAULT false,
    "lastPriceAt" TIMESTAMP(3),
    "walletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WalletToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "blockNumber" INTEGER,
    "network" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "fromAddress" TEXT NOT NULL,
    "toAddress" TEXT,
    "isIncoming" BOOLEAN NOT NULL,
    "value" DECIMAL(30,18) NOT NULL,
    "valueUsd" DECIMAL(15,2),
    "tokenSymbol" TEXT,
    "tokenAddress" TEXT,
    "gasUsed" DECIMAL(30,0),
    "gasPrice" DECIMAL(30,0),
    "gasCostUsd" DECIMAL(15,2),
    "timestamp" TIMESTAMP(3) NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "methodName" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "tags" TEXT[],
    "linkedTransactionId" TEXT,
    "walletId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WalletTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceVersion" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "changeType" TEXT NOT NULL,
    "changeReason" TEXT,
    "changedFields" TEXT[],
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceAccountingEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "debitAccountId" TEXT,
    "debitAccountCode" TEXT NOT NULL,
    "debitAccountName" TEXT NOT NULL,
    "creditAccountId" TEXT,
    "creditAccountCode" TEXT NOT NULL,
    "creditAccountName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "fiscalYear" INTEGER NOT NULL,
    "fiscalPeriod" TEXT NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'posted',
    "reversedAt" TIMESTAMP(3),
    "reversalEventId" TEXT,
    "description" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoiceAccountingEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoicePayment" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "bankAccount" TEXT,
    "transactionRef" TEXT,
    "transactionId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "creditNoteId" TEXT,
    "offsetReceivableId" TEXT,
    "treasuryMovementId" TEXT,
    "appliedBy" TEXT,
    "appliedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvoicePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRecord" (
    "id" TEXT NOT NULL,
    "archiveRecordId" TEXT NOT NULL,
    "originalObjectId" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "objectVersion" INTEGER NOT NULL DEFAULT 1,
    "parentRecordId" TEXT,
    "legalEntityId" TEXT,
    "partyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "accountingPeriod" TEXT,
    "fiscalYear" INTEGER,
    "fiscalPeriod" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "contentHash" TEXT NOT NULL,
    "predecessorHash" TEXT,
    "signature" TEXT,
    "tamperChecksum" TEXT,
    "signatureCount" INTEGER NOT NULL DEFAULT 1,
    "integrityVerified" BOOLEAN NOT NULL DEFAULT true,
    "lastVerifiedAt" TIMESTAMP(3),
    "triggerType" TEXT NOT NULL,
    "triggerReason" TEXT,
    "triggerExplanation" TEXT,
    "initiatingActor" TEXT,
    "initiatingActorName" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "sourceModule" TEXT,
    "linkedEntityIds" TEXT[],
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" JSONB NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'json',
    "contentSize" INTEGER,
    "amount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reportingCurrency" TEXT,
    "fxRateAtArchive" DECIMAL(15,6),
    "amountInReporting" DECIMAL(15,2),
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "jurisdictionIds" TEXT[],
    "tags" TEXT[],
    "systemTags" TEXT[],
    "confidenceScore" DECIMAL(3,2) NOT NULL DEFAULT 1,
    "validationMode" TEXT NOT NULL DEFAULT 'hard',
    "locale" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "displayFormats" JSONB,
    "counterpartyId" TEXT,
    "counterpartyName" TEXT,
    "counterpartyType" TEXT,
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "isCurrentVersion" BOOLEAN NOT NULL DEFAULT true,
    "supersededBy" TEXT,
    "supersedes" TEXT,
    "versionReason" TEXT,
    "retentionPolicyId" TEXT,
    "retentionStartDate" TIMESTAMP(3),
    "retentionEndDate" TIMESTAMP(3),
    "retentionStatus" TEXT NOT NULL DEFAULT 'active',
    "legalHold" BOOLEAN NOT NULL DEFAULT false,
    "legalHoldReason" TEXT,
    "legalHoldBy" TEXT,
    "legalHoldAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'archived',
    "accessCount" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" TIMESTAMP(3),
    "lastAccessedBy" TEXT,
    "exportCount" INTEGER NOT NULL DEFAULT 0,
    "lastExportedAt" TIMESTAMP(3),
    "attachments" JSONB,
    "documentCount" INTEGER NOT NULL DEFAULT 0,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "explanation" TEXT,
    "proposedBy" TEXT,
    "proposedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "importBatchId" TEXT,
    "importSource" TEXT,
    "importedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveLink" (
    "id" TEXT NOT NULL,
    "sourceArchiveId" TEXT NOT NULL,
    "targetArchiveId" TEXT NOT NULL,
    "linkType" TEXT NOT NULL,
    "linkDirection" TEXT NOT NULL,
    "linkDescription" TEXT,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "linkedBy" TEXT,
    "isImmutable" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "ArchiveLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveVersion" (
    "id" TEXT NOT NULL,
    "archiveRecordId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "versionHash" TEXT NOT NULL,
    "previousVersionId" TEXT,
    "contentSnapshot" JSONB NOT NULL,
    "changeDescription" TEXT,
    "changedFields" TEXT[],
    "createdBy" TEXT,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveAccessLog" (
    "id" TEXT NOT NULL,
    "archiveRecordId" TEXT NOT NULL,
    "accessType" TEXT NOT NULL,
    "accessReason" TEXT,
    "accessScope" TEXT,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "actorRole" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "requestId" TEXT,
    "requiredApprovals" INTEGER NOT NULL DEFAULT 0,
    "receivedApprovals" INTEGER NOT NULL DEFAULT 0,
    "approvers" JSONB,
    "accessGrantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "accessExpiresAt" TIMESTAMP(3),
    "accessGranted" BOOLEAN NOT NULL DEFAULT true,
    "denialReason" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveRetentionPolicy" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "objectTypes" TEXT[],
    "jurisdictions" TEXT[],
    "categories" TEXT[],
    "retentionYears" INTEGER NOT NULL,
    "retentionMonths" INTEGER NOT NULL DEFAULT 0,
    "retentionStartTrigger" TEXT NOT NULL DEFAULT 'fiscal_year_end',
    "legalBasis" TEXT,
    "legalReference" TEXT,
    "warningDaysBefore" INTEGER NOT NULL DEFAULT 90,
    "autoExtendOnAccess" BOOLEAN NOT NULL DEFAULT false,
    "autoExtendDays" INTEGER NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveRetentionPolicy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveExport" (
    "id" TEXT NOT NULL,
    "exportNumber" TEXT NOT NULL,
    "exportType" TEXT NOT NULL,
    "exportFormat" TEXT NOT NULL,
    "archiveRecordIds" TEXT[],
    "recordCount" INTEGER NOT NULL DEFAULT 0,
    "filterCriteria" JSONB,
    "fileUrl" TEXT,
    "fileSize" INTEGER,
    "fileHash" TEXT,
    "chainOfCustody" JSONB,
    "integrityProof" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "generatedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "downloadCount" INTEGER NOT NULL DEFAULT 0,
    "lastDownloadedAt" TIMESTAMP(3),
    "requestedBy" TEXT NOT NULL,
    "requestedByName" TEXT,
    "requestPurpose" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArchiveExport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveImportBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceIdentifier" TEXT,
    "sourceHash" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "importMode" TEXT NOT NULL DEFAULT 'live',
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "objectTypeFilter" TEXT,
    "fieldMapping" JSONB,
    "errors" JSONB,
    "warnings" JSONB,
    "createdRecordIds" TEXT[],
    "canRollback" BOOLEAN NOT NULL DEFAULT true,
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackBy" TEXT,
    "importedBy" TEXT NOT NULL,
    "importedByName" TEXT,
    "organizationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ArchiveImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConditions" JSONB NOT NULL,
    "objectTypes" TEXT[],
    "categories" TEXT[],
    "action" TEXT NOT NULL,
    "actionConfig" JSONB,
    "confidenceThreshold" DECIMAL(3,2) NOT NULL DEFAULT 0.95,
    "proposalThreshold" DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverRoles" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "explanationTemplate" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveException" (
    "id" TEXT NOT NULL,
    "sourceObjectId" TEXT NOT NULL,
    "sourceObjectType" TEXT NOT NULL,
    "sourceModule" TEXT,
    "exceptionType" TEXT NOT NULL,
    "exceptionCode" TEXT,
    "exceptionMessage" TEXT NOT NULL,
    "exceptionDetails" JSONB,
    "validationMode" TEXT,
    "validationErrors" JSONB,
    "confidenceScore" DECIMAL(3,2),
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "slaDeadline" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalatedTo" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolutionAction" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "archiveRecordId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveSavedView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "sortBy" TEXT,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "groupBy" TEXT,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" TEXT,
    "scheduleCron" TEXT,
    "deliveryMethod" TEXT,
    "deliveryTarget" TEXT,
    "lastDeliveredAt" TIMESTAMP(3),
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "liabilityId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "actorId" TEXT,
    "actorName" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "payload" JSONB NOT NULL,
    "previousState" JSONB,
    "previousEventId" TEXT,
    "contentHash" TEXT,
    "explanation" TEXT,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "metadata" JSONB,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversalOf" TEXT,

    CONSTRAINT "LiabilityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilitySettlement" (
    "id" TEXT NOT NULL,
    "liabilityId" TEXT NOT NULL,
    "settlementId" TEXT NOT NULL,
    "settlementType" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principalSettled" DECIMAL(15,2) NOT NULL,
    "interestSettled" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feesSettled" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "penaltiesWaived" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "fxRate" DECIMAL(15,6),
    "fxGainLoss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstandingBefore" DECIMAL(15,2) NOT NULL,
    "outstandingAfter" DECIMAL(15,2) NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3),
    "settledBy" TEXT,
    "approvedBy" TEXT,
    "paymentId" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "isOffset" BOOLEAN NOT NULL DEFAULT false,
    "offsetReceivableId" TEXT,
    "nettingBatchId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiabilitySettlement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityAccrual" (
    "id" TEXT NOT NULL,
    "liabilityId" TEXT NOT NULL,
    "accrualId" TEXT NOT NULL,
    "accrualType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "principalBase" DECIMAL(15,2) NOT NULL,
    "rate" DECIMAL(8,5),
    "dayCount" INTEGER,
    "dayCountBasis" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "amountInReporting" DECIMAL(15,2),
    "fxRate" DECIMAL(15,6),
    "status" TEXT NOT NULL DEFAULT 'posted',
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "journalEntryId" TEXT,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "explanation" TEXT,
    "calculationDetails" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiabilityAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityCovenantCheck" (
    "id" TEXT NOT NULL,
    "liabilityId" TEXT NOT NULL,
    "covenantName" TEXT NOT NULL,
    "covenantType" TEXT NOT NULL,
    "checkDate" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3),
    "threshold" DECIMAL(15,4) NOT NULL,
    "thresholdType" TEXT NOT NULL,
    "thresholdMin" DECIMAL(15,4),
    "thresholdMax" DECIMAL(15,4),
    "actualValue" DECIMAL(15,4) NOT NULL,
    "status" TEXT NOT NULL,
    "variance" DECIMAL(15,4),
    "variancePercent" DECIMAL(5,2),
    "isBreached" BOOLEAN NOT NULL DEFAULT false,
    "breachSeverity" TEXT,
    "breachNotified" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "notifiedTo" TEXT[],
    "isWaived" BOOLEAN NOT NULL DEFAULT false,
    "waiverApprovedBy" TEXT,
    "waiverApprovedAt" TIMESTAMP(3),
    "waiverReason" TEXT,
    "calculationDetails" JSONB,
    "supportingDocuments" JSONB,
    "checkedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiabilityCovenantCheck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityImportBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceIdentifier" TEXT,
    "sourceHash" TEXT,
    "totalRecords" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "warningCount" INTEGER NOT NULL DEFAULT 0,
    "skippedCount" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "importMode" TEXT NOT NULL DEFAULT 'live',
    "dateFrom" TIMESTAMP(3),
    "dateTo" TIMESTAMP(3),
    "counterpartyFilter" TEXT,
    "typeFilter" TEXT,
    "fieldMapping" JSONB,
    "mappingTemplate" TEXT,
    "errors" JSONB,
    "warnings" JSONB,
    "createdLiabilityIds" TEXT[],
    "canRollback" BOOLEAN NOT NULL DEFAULT true,
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackBy" TEXT,
    "importedBy" TEXT NOT NULL,
    "importedByName" TEXT,
    "organizationId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "LiabilityImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConditions" JSONB NOT NULL,
    "schedule" TEXT,
    "liabilityTypes" TEXT[],
    "primaryClasses" TEXT[],
    "counterpartyTypes" TEXT[],
    "actionType" TEXT NOT NULL,
    "actionConfig" JSONB,
    "confidenceThreshold" DECIMAL(3,2) NOT NULL DEFAULT 0.95,
    "proposalThreshold" DECIMAL(3,2) NOT NULL DEFAULT 0.70,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approverRoles" TEXT[],
    "amountThreshold" DECIMAL(15,2),
    "riskThreshold" TEXT,
    "maturityDaysThreshold" INTEGER,
    "fallbackRuleId" TEXT,
    "fallbackBehavior" TEXT,
    "explanationTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiabilityAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityException" (
    "id" TEXT NOT NULL,
    "liabilityId" TEXT,
    "sourceObjectId" TEXT,
    "sourceObjectType" TEXT,
    "sourceModule" TEXT,
    "exceptionType" TEXT NOT NULL,
    "exceptionCode" TEXT,
    "exceptionMessage" TEXT NOT NULL,
    "exceptionDetails" JSONB,
    "validationMode" TEXT,
    "validationErrors" JSONB,
    "confidenceScore" DECIMAL(3,2),
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "assignedAt" TIMESTAMP(3),
    "slaDeadline" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "escalatedTo" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "resolutionAction" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "maxRetries" INTEGER NOT NULL DEFAULT 3,
    "lastRetryAt" TIMESTAMP(3),
    "nextRetryAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiabilityException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilitySavedView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB NOT NULL,
    "columns" TEXT[],
    "sortBy" TEXT,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "groupBy" TEXT,
    "includeAggregations" BOOLEAN NOT NULL DEFAULT false,
    "aggregationFields" TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[],
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" TEXT,
    "scheduleCron" TEXT,
    "deliveryMethod" TEXT,
    "deliveryTarget" TEXT,
    "lastDeliveredAt" TIMESTAMP(3),
    "defaultExportFormat" TEXT NOT NULL DEFAULT 'json',
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiabilitySavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parentId" TEXT,
    "level" INTEGER NOT NULL DEFAULT 0,
    "path" TEXT,
    "managerId" TEXT,
    "managerName" TEXT,
    "annualBudget" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetSpent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetRemaining" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetUtilization" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "allocationMethod" TEXT NOT NULL DEFAULT 'direct',
    "allocationBasis" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" TIMESTAMP(3),
    "tags" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'internal',
    "status" TEXT NOT NULL DEFAULT 'planning',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "ownerId" TEXT,
    "ownerName" TEXT,
    "costCenterId" TEXT,
    "costCenterCode" TEXT,
    "departmentId" TEXT,
    "clientId" TEXT,
    "clientName" TEXT,
    "plannedStartDate" TIMESTAMP(3) NOT NULL,
    "plannedEndDate" TIMESTAMP(3) NOT NULL,
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "budgetType" TEXT NOT NULL DEFAULT 'fixed',
    "budgetAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetSpent" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetRemaining" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetVariance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "budgetUtilization" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "contractValue" DECIMAL(15,2),
    "billedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "collectedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unbilledAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossProfit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "netProfit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netMargin" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "allocatedHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "actualHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "remainingHours" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "hourlyRate" DECIMAL(10,2),
    "percentComplete" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "milestoneCount" INTEGER NOT NULL DEFAULT 0,
    "milestonesCompleted" INTEGER NOT NULL DEFAULT 0,
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "billingRate" DECIMAL(10,2),
    "billingMethod" TEXT,
    "tags" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectMilestone" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "plannedDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "percentComplete" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "billingAmount" DECIMAL(15,2),
    "billedAt" TIMESTAMP(3),
    "dependsOn" TEXT[],
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimeEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "projectId" TEXT NOT NULL,
    "projectCode" TEXT,
    "taskId" TEXT,
    "taskName" TEXT,
    "costCenterId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DECIMAL(5,2) NOT NULL,
    "startTime" TEXT,
    "endTime" TEXT,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "isBillable" BOOLEAN NOT NULL DEFAULT false,
    "hourlyRate" DECIMAL(10,2),
    "billableAmount" DECIMAL(15,2),
    "costRate" DECIMAL(10,2),
    "costAmount" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternalChargeback" (
    "id" TEXT NOT NULL,
    "chargebackNumber" TEXT NOT NULL,
    "fromCostCenterId" TEXT NOT NULL,
    "fromCostCenterCode" TEXT,
    "toCostCenterId" TEXT NOT NULL,
    "toCostCenterCode" TEXT,
    "projectId" TEXT,
    "projectCode" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "allocationMethod" TEXT NOT NULL DEFAULT 'direct',
    "allocationBasis" TEXT,
    "quantity" DECIMAL(15,4),
    "unitRate" DECIMAL(15,4),
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "invoiceId" TEXT,
    "journalEntryId" TEXT,
    "notes" TEXT,
    "createdBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternalChargeback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPeriod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'monthly',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalQuarter" INTEGER,
    "fiscalMonth" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'open',
    "closedAt" TIMESTAMP(3),
    "closedBy" TEXT,
    "reopenedAt" TIMESTAMP(3),
    "reopenedBy" TEXT,
    "reopenReason" TEXT,
    "checklistTotal" INTEGER NOT NULL DEFAULT 0,
    "checklistCompleted" INTEGER NOT NULL DEFAULT 0,
    "checklistProgress" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "hasUnreconciledItems" BOOLEAN NOT NULL DEFAULT false,
    "hasPendingTransactions" BOOLEAN NOT NULL DEFAULT false,
    "hasMissingDocuments" BOOLEAN NOT NULL DEFAULT false,
    "hasUnapprovedAdjustments" BOOLEAN NOT NULL DEFAULT false,
    "totalRevenue" DECIMAL(15,2),
    "totalExpenses" DECIMAL(15,2),
    "netIncome" DECIMAL(15,2),
    "totalAssets" DECIMAL(15,2),
    "totalLiabilities" DECIMAL(15,2),
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CloseChecklistItem" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "dependsOn" TEXT[],
    "isAutomated" BOOLEAN NOT NULL DEFAULT false,
    "automationRule" TEXT,
    "lastAutoCheck" TIMESTAMP(3),
    "autoCheckResult" TEXT,
    "attachments" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloseChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodMissingItem" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "assignedTo" TEXT,
    "assignedToName" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "resolution" TEXT,
    "waivedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodMissingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodAdjustment" (
    "id" TEXT NOT NULL,
    "adjustmentNumber" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'accrual',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "description" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "debitAccountId" TEXT,
    "debitAccountName" TEXT,
    "creditAccountId" TEXT,
    "creditAccountName" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "isReversing" BOOLEAN NOT NULL DEFAULT false,
    "reversalDate" TIMESTAMP(3),
    "reversalPeriodId" TEXT,
    "originalAdjustmentId" TEXT,
    "requestedBy" TEXT,
    "requestedByName" TEXT,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "postedAt" TIMESTAMP(3),
    "journalEntryId" TEXT,
    "supportingDocuments" TEXT[],
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PeriodAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PeriodAuditEntry" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PeriodAuditEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "type" TEXT NOT NULL DEFAULT 'business',
    "status" TEXT NOT NULL DEFAULT 'active',
    "industry" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "website" TEXT,
    "address" JSONB,
    "taxId" TEXT,
    "vatNumber" TEXT,
    "registrationNumber" TEXT,
    "classification" TEXT,
    "employeeCount" INTEGER,
    "annualRevenue" DECIMAL(15,2),
    "accountManagerId" TEXT,
    "accountManagerName" TEXT,
    "segment" TEXT,
    "tags" TEXT[],
    "creditLimit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditUsed" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditAvailable" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditStatus" TEXT NOT NULL DEFAULT 'approved',
    "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30',
    "paymentBehavior" TEXT NOT NULL DEFAULT 'good',
    "averageDaysToPayment" INTEGER,
    "onTimePaymentRate" DECIMAL(5,2),
    "latePaymentCount" INTEGER NOT NULL DEFAULT 0,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "riskScore" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overdueAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "customerSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActivityDate" TIMESTAMP(3),
    "lastPurchaseDate" TIMESTAMP(3),
    "lastOrderDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "lastContactDate" TIMESTAMP(3),
    "preferredPaymentMethod" TEXT,
    "preferredLanguage" TEXT NOT NULL DEFAULT 'en',
    "invoiceDelivery" TEXT NOT NULL DEFAULT 'email',
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerContact" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'general',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPayment" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "invoiceId" TEXT,
    "invoiceNumber" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "daysToPayment" INTEGER,
    "daysOverdue" INTEGER,
    "paymentMethod" TEXT,
    "referenceNumber" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerCreditEvent" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "changedBy" TEXT,
    "changedByName" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerCreditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRevenue" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "revenue" DECIMAL(15,2) NOT NULL,
    "cost" DECIMAL(15,2),
    "profit" DECIMAL(15,2),
    "margin" DECIMAL(5,2),
    "productRevenue" DECIMAL(15,2),
    "serviceRevenue" DECIMAL(15,2),
    "otherRevenue" DECIMAL(15,2),
    "orderCount" INTEGER NOT NULL,
    "averageOrderValue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerRevenue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerRiskIndicator" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "indicator" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "score" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'active',
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "recommendedAction" TEXT,
    "actionTaken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerRiskIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" TEXT NOT NULL,
    "supplierNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "category" TEXT NOT NULL DEFAULT 'goods',
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "address" JSONB,
    "taxId" TEXT,
    "registrationNumber" TEXT,
    "founded" INTEGER,
    "employeeCount" INTEGER,
    "accountManagerId" TEXT,
    "accountManagerName" TEXT,
    "tags" TEXT[],
    "supplierSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastOrderDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "contractExpiryDate" TIMESTAMP(3),
    "totalSpend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalOrders" INTEGER NOT NULL DEFAULT 0,
    "averageOrderValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstandingBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentTerms" TEXT NOT NULL DEFAULT 'Net 30',
    "preferredPaymentMethod" TEXT NOT NULL DEFAULT 'wire',
    "earlyPaymentDiscount" DECIMAL(5,2),
    "bankDetails" JSONB,
    "reliabilityRating" TEXT NOT NULL DEFAULT 'good',
    "reliabilityScore" INTEGER NOT NULL DEFAULT 80,
    "onTimeDeliveryRate" DECIMAL(5,2) NOT NULL DEFAULT 90,
    "qualityScore" INTEGER NOT NULL DEFAULT 80,
    "defectRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "avgLeadTime" INTEGER NOT NULL DEFAULT 14,
    "dependencyLevel" TEXT NOT NULL DEFAULT 'low',
    "dependencyScore" INTEGER NOT NULL DEFAULT 0,
    "spendPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "alternativeSuppliers" INTEGER NOT NULL DEFAULT 0,
    "criticalItems" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierContact" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "role" TEXT NOT NULL DEFAULT 'general',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierBalance" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "totalOutstanding" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentDue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overdue30" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overdue60" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "overdue90Plus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "availableCredits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingCredits" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "lastPaymentAmount" DECIMAL(15,2),
    "lastPaymentDate" TIMESTAMP(3),
    "nextPaymentDue" TIMESTAMP(3),
    "nextPaymentAmount" DECIMAL(15,2),
    "ytdPayments" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ytdPurchases" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierPayment" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "paymentNumber" TEXT NOT NULL,
    "invoiceIds" JSONB NOT NULL DEFAULT '[]',
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "paymentMethod" TEXT NOT NULL,
    "referenceNumber" TEXT,
    "bankAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "discountTaken" DECIMAL(15,2),
    "discountType" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierReliability" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3) NOT NULL,
    "actualDeliveryDate" TIMESTAMP(3),
    "daysVariance" INTEGER NOT NULL DEFAULT 0,
    "itemsOrdered" INTEGER NOT NULL,
    "itemsReceived" INTEGER NOT NULL,
    "itemsDefective" INTEGER NOT NULL DEFAULT 0,
    "qualityScore" INTEGER NOT NULL DEFAULT 100,
    "hasIssues" BOOLEAN NOT NULL DEFAULT false,
    "issueType" TEXT,
    "issueDescription" TEXT,
    "issueResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierReliability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierSpend" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "totalSpend" DECIMAL(15,2) NOT NULL,
    "directSpend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "indirectSpend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "goodsSpend" DECIMAL(15,2),
    "servicesSpend" DECIMAL(15,2),
    "orderCount" INTEGER NOT NULL,
    "averageOrderValue" DECIMAL(15,2) NOT NULL,
    "previousPeriodSpend" DECIMAL(15,2),
    "changePercentage" DECIMAL(5,2),
    "budgetAmount" DECIMAL(15,2),
    "budgetVariance" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SupplierSpend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierRisk" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "riskType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "impactScore" INTEGER NOT NULL DEFAULT 5,
    "probabilityScore" INTEGER NOT NULL DEFAULT 5,
    "overallRiskScore" INTEGER NOT NULL DEFAULT 25,
    "mitigationPlan" TEXT,
    "mitigationStatus" TEXT NOT NULL DEFAULT 'not_started',
    "status" TEXT NOT NULL DEFAULT 'identified',
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierRisk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingAgreement" (
    "id" TEXT NOT NULL,
    "agreementNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'counterparty',
    "status" TEXT NOT NULL DEFAULT 'active',
    "nettingFrequency" TEXT NOT NULL DEFAULT 'monthly',
    "settlementDays" INTEGER NOT NULL DEFAULT 5,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "minimumNettingAmount" DECIMAL(15,2),
    "maximumNettingAmount" DECIMAL(15,2),
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "expiryDate" TIMESTAMP(3),
    "lastNettingDate" TIMESTAMP(3),
    "nextNettingDate" TIMESTAMP(3),
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NettingAgreement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingParty" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "partyType" TEXT NOT NULL DEFAULT 'supplier',
    "accountNumber" TEXT,
    "bankName" TEXT,
    "bankDetails" JSONB,
    "isNettingCenter" BOOLEAN NOT NULL DEFAULT false,
    "agreementId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NettingParty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingSession" (
    "id" TEXT NOT NULL,
    "sessionNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'counterparty',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "nettingDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3) NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "totalReceivables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalPayables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "savingsAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "savingsPercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdByName" TEXT,
    "approvedBy" TEXT,
    "approvedByName" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedByName" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedReason" TEXT,
    "notes" TEXT,
    "agreementId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NettingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingPosition" (
    "id" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "partyType" TEXT NOT NULL DEFAULT 'supplier',
    "receivables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossPosition" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netPosition" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "receivableCount" INTEGER NOT NULL DEFAULT 0,
    "payableCount" INTEGER NOT NULL DEFAULT 0,
    "settlementDirection" TEXT NOT NULL DEFAULT 'none',
    "settlementAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "sessionId" TEXT NOT NULL,
    "nettingPartyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NettingPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingTransaction" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "documentDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "counterpartyId" TEXT NOT NULL,
    "counterpartyName" TEXT NOT NULL,
    "originalCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "originalAmount" DECIMAL(15,2) NOT NULL,
    "baseCurrencyAmount" DECIMAL(15,2) NOT NULL,
    "exchangeRate" DECIMAL(12,6) NOT NULL DEFAULT 1,
    "direction" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "excludedReason" TEXT,
    "positionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NettingTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SettlementInstruction" (
    "id" TEXT NOT NULL,
    "instructionNumber" TEXT NOT NULL,
    "payerId" TEXT NOT NULL,
    "payerName" TEXT NOT NULL,
    "receiverId" TEXT NOT NULL,
    "receiverName" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "settlementMethod" TEXT NOT NULL DEFAULT 'wire',
    "payerBankAccount" TEXT,
    "receiverBankAccount" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "valueDate" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "sessionId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SettlementInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OffsetEntry" (
    "id" TEXT NOT NULL,
    "offsetNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'ar_ap',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "partyId" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "partyType" TEXT NOT NULL DEFAULT 'customer',
    "sourceDocumentType" TEXT NOT NULL,
    "sourceDocumentNumber" TEXT NOT NULL,
    "sourceAmount" DECIMAL(15,2) NOT NULL,
    "targetDocumentType" TEXT NOT NULL,
    "targetDocumentNumber" TEXT NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "offsetAmount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "offsetDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approverName" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "reversalReason" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OffsetEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "counterparty" JSONB NOT NULL,
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "offerDate" TIMESTAMP(3) NOT NULL,
    "validityDays" INTEGER NOT NULL DEFAULT 30,
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "convertedAt" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentTerms" TEXT NOT NULL DEFAULT 'net_30',
    "deliveryTerms" TEXT,
    "lineItems" JSONB NOT NULL DEFAULT '[]',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "totalDiscount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxTotal" DECIMAL(15,2) NOT NULL,
    "grandTotal" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2),
    "grossMargin" DECIMAL(15,2),
    "grossMarginPercent" DECIMAL(5,2),
    "internalNotes" TEXT,
    "customerNotes" TEXT,
    "termsAndConditions" TEXT,
    "disclaimer" TEXT,
    "acceptanceMethod" TEXT,
    "rejectionReason" TEXT,
    "convertedOrderId" TEXT,
    "convertedOrderNumber" TEXT,
    "templateId" TEXT,
    "templateName" TEXT,
    "previousVersionId" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "sentBy" TEXT,
    "approvedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferVersion" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "changes" JSONB NOT NULL DEFAULT '[]',
    "revisionNotes" TEXT,
    "snapshotData" JSONB NOT NULL,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferAuditLog" (
    "id" TEXT NOT NULL,
    "offerId" TEXT NOT NULL,
    "offerNumber" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT,
    "ipAddress" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OfferAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfferTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "defaultCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "defaultValidityDays" INTEGER NOT NULL DEFAULT 30,
    "defaultPaymentTerms" TEXT NOT NULL DEFAULT 'net_30',
    "defaultDeliveryTerms" TEXT,
    "defaultTermsAndConditions" TEXT,
    "defaultDisclaimer" TEXT NOT NULL,
    "defaultLineItems" JSONB NOT NULL DEFAULT '[]',
    "headerText" TEXT,
    "footerText" TEXT,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfferTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "type" TEXT NOT NULL DEFAULT 'general',
    "category" TEXT,
    "dueDate" TIMESTAMP(3),
    "dueTime" TEXT,
    "startDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "snoozedUntil" TIMESTAMP(3),
    "reminderDate" TIMESTAMP(3),
    "ownerId" TEXT,
    "ownerName" TEXT,
    "createdById" TEXT,
    "createdByName" TEXT,
    "assignmentReason" TEXT NOT NULL DEFAULT 'direct_assignment',
    "sourceSystem" TEXT NOT NULL DEFAULT 'manual',
    "sourceEntityId" TEXT,
    "sourceEntityType" TEXT,
    "slaDeadline" TIMESTAMP(3),
    "slaBreach" BOOLEAN NOT NULL DEFAULT false,
    "slaWarning" BOOLEAN NOT NULL DEFAULT false,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "estimatedHours" DECIMAL(5,2),
    "actualHours" DECIMAL(5,2),
    "hasUnreadUpdates" BOOLEAN NOT NULL DEFAULT false,
    "hasMentions" BOOLEAN NOT NULL DEFAULT false,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAssignee" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "email" TEXT,
    "avatar" TEXT,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assignedBy" TEXT,

    CONSTRAINT "TaskAssignee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskWatcher" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT,
    "watchingSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskWatcher_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT 'gray',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskTagLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TaskTagLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskDependency" (
    "id" TEXT NOT NULL,
    "dependentTaskId" TEXT NOT NULL,
    "blockingTaskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "parentId" TEXT,
    "mentions" TEXT[],
    "reactions" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskActivity" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "details" JSONB,
    "previousValue" TEXT,
    "newValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskAttachment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "uploadedBy" TEXT NOT NULL,
    "uploadedByName" TEXT,
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Risk" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "likelihood" TEXT NOT NULL DEFAULT 'possible',
    "impactScore" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'identified',
    "identifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "targetMitigationDate" TIMESTAMP(3),
    "resolvedAt" TIMESTAMP(3),
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "escalatedTo" TEXT,
    "escalatedToName" TEXT,
    "impactAreas" TEXT[],
    "affectedSystemId" TEXT,
    "affectedSystemName" TEXT,
    "affectedProjectId" TEXT,
    "affectedProjectName" TEXT,
    "blastRadius" TEXT NOT NULL DEFAULT 'isolated',
    "mitigationPlan" TEXT,
    "mitigationProgress" INTEGER NOT NULL DEFAULT 0,
    "sourceSystem" TEXT,
    "sourceEntityId" TEXT,
    "isNewlyEscalated" BOOLEAN NOT NULL DEFAULT false,
    "isStale" BOOLEAN NOT NULL DEFAULT false,
    "isMitigationOverdue" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Risk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskMitigationStep" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "ownerId" TEXT,
    "ownerName" TEXT,
    "deadline" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskMitigationStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskRiskLink" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskRiskLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskComment" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiskComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RiskActivity" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "details" JSONB,
    "previousValue" TEXT,
    "newValue" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RiskActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskNotification" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "taskId" TEXT,
    "riskId" TEXT,
    "actorId" TEXT,
    "actorName" TEXT,
    "recipientId" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "TaskNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedTaskFilter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "filters" JSONB NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "isShared" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedTaskFilter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueForecast" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'latest',
    "scenarioId" TEXT,
    "timeHorizon" TEXT NOT NULL DEFAULT 'quarter',
    "granularity" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "totalExpected" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalBestCase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalWorstCase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "committedRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "projectedRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "atRiskRevenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "byProduct" JSONB NOT NULL DEFAULT '{}',
    "bySegment" JSONB NOT NULL DEFAULT '{}',
    "byRegion" JSONB NOT NULL DEFAULT '{}',
    "byType" JSONB NOT NULL DEFAULT '{}',
    "dataSource" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "lastUpdatedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueLineItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'product',
    "revenueType" TEXT NOT NULL DEFAULT 'recurring',
    "segment" TEXT,
    "region" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "periods" JSONB NOT NULL DEFAULT '{}',
    "isCommitted" BOOLEAN NOT NULL DEFAULT false,
    "isAtRisk" BOOLEAN NOT NULL DEFAULT false,
    "isRenewal" BOOLEAN NOT NULL DEFAULT false,
    "hasUpsell" BOOLEAN NOT NULL DEFAULT false,
    "hasDownsell" BOOLEAN NOT NULL DEFAULT false,
    "highUncertainty" BOOLEAN NOT NULL DEFAULT false,
    "drivers" TEXT[],
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "revenueForecastId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostForecast" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'latest',
    "scenarioId" TEXT,
    "timeHorizon" TEXT NOT NULL DEFAULT 'quarter',
    "granularity" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "totalExpected" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalBestCase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalWorstCase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "committedCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estimatedCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "byCategory" JSONB NOT NULL DEFAULT '{}',
    "byDepartment" JSONB NOT NULL DEFAULT '{}',
    "byVendor" JSONB NOT NULL DEFAULT '{}',
    "byProject" JSONB NOT NULL DEFAULT '{}',
    "overrunCount" INTEGER NOT NULL DEFAULT 0,
    "unplannedSpendTotal" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dataSource" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "lastUpdatedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostLineItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'fixed',
    "department" TEXT,
    "costCenter" TEXT,
    "vendorId" TEXT,
    "vendorName" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "periods" JSONB NOT NULL DEFAULT '{}',
    "isCommitted" BOOLEAN NOT NULL DEFAULT false,
    "isContractual" BOOLEAN NOT NULL DEFAULT false,
    "hasStepChange" BOOLEAN NOT NULL DEFAULT false,
    "stepChangeDescription" TEXT,
    "isOverrun" BOOLEAN NOT NULL DEFAULT false,
    "isUnplanned" BOOLEAN NOT NULL DEFAULT false,
    "drivers" TEXT[],
    "scenarioImpact" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "costForecastId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CostLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashForecast" (
    "id" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT 'latest',
    "scenarioId" TEXT,
    "timeHorizon" TEXT NOT NULL DEFAULT 'quarter',
    "granularity" TEXT NOT NULL DEFAULT 'monthly',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "currentCashBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minimumCashRunway" INTEGER NOT NULL DEFAULT 0,
    "covenantThreshold" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "projectedMinimumBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "projectedMinimumDate" TIMESTAMP(3),
    "avgCollectionDays" INTEGER NOT NULL DEFAULT 30,
    "avgPaymentTerms" INTEGER NOT NULL DEFAULT 30,
    "delayedReceivables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "hasNegativePeriods" BOOLEAN NOT NULL DEFAULT false,
    "hasCriticalPeriods" BOOLEAN NOT NULL DEFAULT false,
    "covenantAtRisk" BOOLEAN NOT NULL DEFAULT false,
    "stressScenarios" JSONB NOT NULL DEFAULT '[]',
    "dataSource" TEXT,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "lastUpdatedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashForecastPeriod" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "openingBalance" DECIMAL(15,2) NOT NULL,
    "closingBalance" DECIMAL(15,2) NOT NULL,
    "netCashFlow" DECIMAL(15,2) NOT NULL,
    "cashIn" JSONB NOT NULL DEFAULT '{}',
    "cashInBreakdown" JSONB NOT NULL DEFAULT '{}',
    "cashOut" JSONB NOT NULL DEFAULT '{}',
    "cashOutBreakdown" JSONB NOT NULL DEFAULT '{}',
    "isNegative" BOOLEAN NOT NULL DEFAULT false,
    "isCritical" BOOLEAN NOT NULL DEFAULT false,
    "breachesMinimum" BOOLEAN NOT NULL DEFAULT false,
    "breachesCovenant" BOOLEAN NOT NULL DEFAULT false,
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "cashForecastId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CashForecastPeriod_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'base',
    "description" TEXT,
    "revenueForecastId" TEXT,
    "costForecastId" TEXT,
    "cashForecastId" TEXT,
    "revenueVsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costVsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cashVsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netVsBase" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdBy" TEXT,
    "lastUpdatedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastAssumption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "value" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'percentage',
    "description" TEXT,
    "impactedForecasts" TEXT[],
    "isEditable" BOOLEAN NOT NULL DEFAULT true,
    "lastUpdatedBy" TEXT,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastAssumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'medium',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "forecastType" TEXT NOT NULL,
    "periodId" TEXT,
    "lineItemId" TEXT,
    "threshold" DECIMAL(15,2),
    "currentValue" DECIMAL(15,2),
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastAnnotation" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "lineItemId" TEXT,
    "periodId" TEXT,
    "revenueForecastId" TEXT,
    "costForecastId" TEXT,
    "cashForecastId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastAnnotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ForecastVariance" (
    "id" TEXT NOT NULL,
    "periodId" TEXT NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "revenueForecast" DECIMAL(15,2) NOT NULL,
    "revenueActual" DECIMAL(15,2) NOT NULL,
    "revenueVariance" DECIMAL(15,2) NOT NULL,
    "revenueVariancePct" DECIMAL(5,2) NOT NULL,
    "costForecast" DECIMAL(15,2) NOT NULL,
    "costActual" DECIMAL(15,2) NOT NULL,
    "costVariance" DECIMAL(15,2) NOT NULL,
    "costVariancePct" DECIMAL(5,2) NOT NULL,
    "cashForecast" DECIMAL(15,2) NOT NULL,
    "cashActual" DECIMAL(15,2) NOT NULL,
    "cashVariance" DECIMAL(15,2) NOT NULL,
    "cashVariancePct" DECIMAL(5,2) NOT NULL,
    "netForecast" DECIMAL(15,2) NOT NULL,
    "netActual" DECIMAL(15,2) NOT NULL,
    "netVariance" DECIMAL(15,2) NOT NULL,
    "netVariancePct" DECIMAL(5,2) NOT NULL,
    "revenueAttribution" JSONB NOT NULL DEFAULT '[]',
    "costAttribution" JSONB NOT NULL DEFAULT '[]',
    "cashAttribution" JSONB NOT NULL DEFAULT '[]',
    "hasMaterialVariance" BOOLEAN NOT NULL DEFAULT false,
    "varianceThresholdBreached" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ForecastVariance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "caseType" TEXT NOT NULL DEFAULT 'custom',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "visibility" TEXT NOT NULL DEFAULT 'personal',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "confidenceLevel" TEXT NOT NULL DEFAULT 'medium',
    "confidenceScore" INTEGER NOT NULL DEFAULT 50,
    "uncertaintyBandLow" DECIMAL(15,2),
    "uncertaintyBandHigh" DECIMAL(15,2),
    "derivedFromId" TEXT,
    "derivedFromName" TEXT,
    "ownerId" TEXT NOT NULL,
    "ownerName" TEXT NOT NULL,
    "sharedWithTeams" TEXT[],
    "version" INTEGER NOT NULL DEFAULT 1,
    "previousVersionId" TEXT,
    "tags" TEXT[],
    "createdBy" TEXT NOT NULL,
    "lastModifiedBy" TEXT,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioAssumption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'other',
    "baseValue" DECIMAL(15,4) NOT NULL,
    "currentValue" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'percentage',
    "description" TEXT,
    "isProtected" BOOLEAN NOT NULL DEFAULT false,
    "isOverridden" BOOLEAN NOT NULL DEFAULT false,
    "minValue" DECIMAL(15,4),
    "maxValue" DECIMAL(15,4),
    "step" DECIMAL(15,4),
    "impactedMetrics" TEXT[],
    "lastModifiedAt" TIMESTAMP(3),
    "lastModifiedBy" TEXT,
    "scenarioId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioAssumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StressTest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'combined',
    "isTemplate" BOOLEAN NOT NULL DEFAULT false,
    "parameters" JSONB NOT NULL DEFAULT '[]',
    "intensity" TEXT NOT NULL DEFAULT 'moderate',
    "result" TEXT NOT NULL DEFAULT 'pass',
    "resultMetrics" JSONB NOT NULL DEFAULT '{}',
    "thresholds" JSONB NOT NULL DEFAULT '[]',
    "cashShortfallPoint" TIMESTAMP(3),
    "covenantBreachPoint" TIMESTAMP(3),
    "marginCollapsePoint" TIMESTAMP(3),
    "defaultIntensities" JSONB,
    "lastRunAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StressTest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SimulationState" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "drivers" JSONB NOT NULL DEFAULT '[]',
    "resultMetrics" JSONB NOT NULL DEFAULT '{}',
    "comparisonBaselineId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAsScenarioId" TEXT,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SimulationState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioComment" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "parentId" TEXT,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioDecision" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "rationale" TEXT,
    "decidedBy" TEXT NOT NULL,
    "decidedByName" TEXT NOT NULL,
    "decidedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioChangeEvent" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "assumptionId" TEXT,
    "assumptionName" TEXT,
    "previousValue" DECIMAL(15,4),
    "newValue" DECIMAL(15,4),
    "previousStatus" TEXT,
    "newStatus" TEXT,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScenarioChangeEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPI" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "calculationType" TEXT NOT NULL DEFAULT 'formula',
    "formula" TEXT,
    "dataSource" TEXT,
    "dataSources" TEXT[],
    "unit" TEXT NOT NULL DEFAULT 'number',
    "format" TEXT NOT NULL DEFAULT '0.0',
    "higherIsBetter" BOOLEAN NOT NULL DEFAULT true,
    "currentValue" DECIMAL(15,4),
    "previousValue" DECIMAL(15,4),
    "targetValue" DECIMAL(15,4),
    "baselineValue" DECIMAL(15,4),
    "rollingAvg3M" DECIMAL(15,4),
    "rollingAvg6M" DECIMAL(15,4),
    "rollingAvg12M" DECIMAL(15,4),
    "deltaVsPrior" DECIMAL(15,4),
    "deltaVsPriorPercent" DECIMAL(8,4),
    "deltaVsTarget" DECIMAL(15,4),
    "deltaVsTargetPercent" DECIMAL(8,4),
    "status" TEXT NOT NULL DEFAULT 'on_track',
    "trend" TEXT NOT NULL DEFAULT 'stable',
    "trendMomentum" TEXT NOT NULL DEFAULT 'steady',
    "dataFreshness" TEXT NOT NULL DEFAULT 'fresh',
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thresholds" JSONB,
    "seasonalityFactor" DECIMAL(8,4),
    "volatility" DECIMAL(8,4),
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isVisible" BOOLEAN NOT NULL DEFAULT true,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT[],
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIHistory" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "targetValue" DECIMAL(15,4),
    "previousValue" DECIMAL(15,4),
    "vsTarget" DECIMAL(15,4),
    "vsPrevious" DECIMAL(15,4),
    "status" TEXT,
    "trend" TEXT,
    "isAnomaly" BOOLEAN NOT NULL DEFAULT false,
    "annotation" TEXT,
    "kpiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KPIHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIAlert" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'warning',
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "currentValue" DECIMAL(15,4) NOT NULL,
    "threshold" DECIMAL(15,4),
    "deviation" DECIMAL(15,4),
    "suggestedAction" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "isDismissed" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kpiId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "KPIAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPITarget" (
    "id" TEXT NOT NULL,
    "periodType" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "periodLabel" TEXT NOT NULL,
    "targetValue" DECIMAL(15,4) NOT NULL,
    "stretchValue" DECIMAL(15,4),
    "minimumValue" DECIMAL(15,4),
    "status" TEXT NOT NULL DEFAULT 'active',
    "actualValue" DECIMAL(15,4),
    "achievementPercent" DECIMAL(8,4),
    "notes" TEXT,
    "kpiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPITarget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KPIBenchmark" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceName" TEXT NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "percentile" DECIMAL(5,2),
    "rangeMin" DECIMAL(15,4),
    "rangeMax" DECIMAL(15,4),
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "kpiId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KPIBenchmark_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXRate" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "rate" DECIMAL(12,6) NOT NULL,
    "inverseRate" DECIMAL(12,6) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validUntil" TIMESTAMP(3),
    "spread" DECIMAL(8,6),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FXRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXExposure" (
    "id" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "quoteCurrency" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'transactional',
    "direction" TEXT NOT NULL DEFAULT 'inflow',
    "timeHorizon" TEXT NOT NULL DEFAULT 'short_term',
    "status" TEXT NOT NULL DEFAULT 'open',
    "grossExposure" DECIMAL(15,2) NOT NULL,
    "netExposure" DECIMAL(15,2) NOT NULL,
    "hedgedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "unhedgedAmount" DECIMAL(15,2) NOT NULL,
    "hedgePercentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "receivables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "payables" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cashBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "operationalInflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "operationalOutflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "structuralPositions" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "entityId" TEXT,
    "entityName" TEXT,
    "spotRate" DECIMAL(12,6) NOT NULL,
    "bookingRate" DECIMAL(12,6),
    "currentRate" DECIMAL(12,6),
    "targetRate" DECIMAL(12,6),
    "baseCurrencyValue" DECIMAL(15,2) NOT NULL,
    "valuationDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "volatility30d" DECIMAL(8,4),
    "var95" DECIMAL(15,2),
    "unrealizedGainLoss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "realizedGainLoss" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "exposureDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "maturityDate" TIMESTAMP(3),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "counterparty" TEXT,
    "dataQuality" TEXT NOT NULL DEFAULT 'complete',
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXExposure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXConversion" (
    "id" TEXT NOT NULL,
    "conversionNumber" TEXT NOT NULL,
    "sourceCurrency" TEXT NOT NULL,
    "targetCurrency" TEXT NOT NULL,
    "sourceAmount" DECIMAL(15,2) NOT NULL,
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "appliedRate" DECIMAL(12,6) NOT NULL,
    "referenceRate" DECIMAL(12,6),
    "rateDeviation" DECIMAL(8,4),
    "rateSource" TEXT NOT NULL DEFAULT 'bank',
    "spreadCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feeCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "effectiveRate" DECIMAL(12,6) NOT NULL,
    "executionChannel" TEXT,
    "counterparty" TEXT,
    "conversionDate" TIMESTAMP(3) NOT NULL,
    "valueDate" TIMESTAMP(3) NOT NULL,
    "settlementDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "purpose" TEXT,
    "relatedDocuments" TEXT[],
    "initiatedBy" TEXT,
    "approvedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "rateAssumptions" JSONB NOT NULL DEFAULT '[]',
    "totalExposureImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenueImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cashImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "scenarioType" TEXT NOT NULL DEFAULT 'sensitivity',
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "probability" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHypothetical" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXForecast" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "horizonMonths" INTEGER NOT NULL DEFAULT 12,
    "projectedExposures" JSONB NOT NULL DEFAULT '[]',
    "assumptions" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'draft',
    "isHypothetical" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXCost" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "spreadCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "transactionFees" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "bankCharges" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalExplicitCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "rateDeviationImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "timingImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalImplicitCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalFXCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costAsPercentOfVolume" DECIMAL(5,4) NOT NULL DEFAULT 0,
    "revenueImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "cashImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netPnLImpact" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "priorPeriodCosts" DECIMAL(15,2),
    "changeVsPrior" DECIMAL(15,2),
    "changePercentVsPrior" DECIMAL(5,2),
    "calculationMethod" TEXT NOT NULL DEFAULT 'actual',
    "referenceRateUsed" TEXT,
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXCost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXRiskIndicator" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "metric" DECIMAL(15,4) NOT NULL,
    "threshold" DECIMAL(15,4) NOT NULL,
    "breached" BOOLEAN NOT NULL DEFAULT false,
    "currency" TEXT,
    "recommendation" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastAssessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FXRiskIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FXAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "userId" TEXT,
    "userName" TEXT,
    "ipAddress" TEXT,
    "organizationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FXAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorSnapshot" (
    "id" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'monthly',
    "periodLabel" TEXT NOT NULL,
    "revenueMTD" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenueQTD" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenueYTD" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "revenueTTM" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fixedCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "variableCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossMargin" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grossMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "operatingMargin" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "operatingMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "ebitda" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "ebitdaMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "netMargin" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netMarginPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "cashAndEquivalents" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "restrictedCash" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalCash" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "shortTermLiabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "longTermLiabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalLiabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentAssets" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currentLiabilities" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netWorkingCapital" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "employeeCount" INTEGER NOT NULL DEFAULT 0,
    "revenuePerEmployee" DECIMAL(15,2),
    "costPerEmployee" DECIMAL(15,2),
    "unitEconomics" JSONB,
    "currentRatio" DECIMAL(8,4),
    "quickRatio" DECIMAL(8,4),
    "monthlyBurn" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "burnAvg3Month" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "burnAvg6Month" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "burnTrend" TEXT NOT NULL DEFAULT 'flat',
    "burnTrendPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "runwayMonths" DECIMAL(5,2),
    "runwayEndDate" TIMESTAMP(3),
    "overallRiskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "liquidityRisk" TEXT NOT NULL DEFAULT 'low',
    "dataQuality" TEXT NOT NULL DEFAULT 'complete',
    "dataCompleteness" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BoardReport" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "periodCovered" TEXT NOT NULL,
    "asOfDate" TIMESTAMP(3) NOT NULL,
    "financialHealthStatus" TEXT NOT NULL DEFAULT 'stable',
    "liquidityStatus" TEXT,
    "sustainabilityOutlook" TEXT,
    "keyHighlights" JSONB NOT NULL DEFAULT '[]',
    "materialChanges" JSONB NOT NULL DEFAULT '[]',
    "riskFactors" JSONB NOT NULL DEFAULT '[]',
    "dataLimitations" JSONB NOT NULL DEFAULT '[]',
    "concentrationRisks" JSONB NOT NULL DEFAULT '[]',
    "snapshotId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "distributedTo" JSONB,
    "distributedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RunwayProjection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "scenarioType" TEXT NOT NULL DEFAULT 'base',
    "projectionDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currentCash" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "assumptions" JSONB NOT NULL DEFAULT '[]',
    "monthlyBurnRate" DECIMAL(15,2) NOT NULL,
    "runwayMonths" DECIMAL(5,2) NOT NULL,
    "runwayEndDate" TIMESTAMP(3) NOT NULL,
    "confidenceLevel" DECIMAL(5,2) NOT NULL DEFAULT 70,
    "projectionBasis" TEXT NOT NULL DEFAULT 'historical',
    "timeHorizon" TEXT NOT NULL DEFAULT '12_months',
    "warnings" JSONB,
    "dataInputs" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RunwayProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvestorAccessLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "userRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "details" TEXT,
    "ipAddress" TEXT,
    "sessionId" TEXT,
    "userAgent" TEXT,
    "organizationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InvestorAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CashflowItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "expectedDate" TIMESTAMP(3) NOT NULL,
    "confidence" TEXT NOT NULL DEFAULT 'expected',
    "sourceType" TEXT NOT NULL,
    "sourceReference" TEXT,
    "sourceDocument" TEXT,
    "counterparty" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CashflowItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityScenario" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "assumptions" JSONB NOT NULL,
    "horizonDays" INTEGER NOT NULL DEFAULT 90,
    "timeBucket" TEXT NOT NULL DEFAULT 'weekly',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startingCashBalance" DECIMAL(15,2) NOT NULL,
    "minimumBuffer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "timeline" JSONB,
    "totalInflows" DECIMAL(15,2),
    "totalOutflows" DECIMAL(15,2),
    "netChange" DECIMAL(15,2),
    "endingBalance" DECIMAL(15,2),
    "lowestBalance" DECIMAL(15,2),
    "lowestBalanceDate" TIMESTAMP(3),
    "daysWithGap" INTEGER,
    "totalGapAmount" DECIMAL(15,2),
    "confirmedCashflows" DECIMAL(15,2),
    "expectedCashflows" DECIMAL(15,2),
    "estimatedCashflows" DECIMAL(15,2),
    "dataCompleteness" DECIMAL(5,2),
    "varianceEndingBalance" DECIMAL(15,2),
    "varianceLowestBalance" DECIMAL(15,2),
    "additionalGapDays" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isHypothetical" BOOLEAN NOT NULL DEFAULT true,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "LiquidityScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityGap" (
    "id" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "peakDeficit" DECIMAL(15,2) NOT NULL,
    "averageDeficit" DECIMAL(15,2) NOT NULL,
    "totalDeficitDays" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "causes" JSONB NOT NULL,
    "affectedPeriods" JSONB NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'moderate',
    "status" TEXT NOT NULL DEFAULT 'projected',
    "mitigationPlan" TEXT,
    "mitigatedAt" TIMESTAMP(3),
    "mitigatedBy" TEXT,
    "scenarioId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LiquidityGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityRiskSignal" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "riskLevel" TEXT NOT NULL DEFAULT 'moderate',
    "metric" DECIMAL(15,4) NOT NULL,
    "threshold" DECIMAL(15,4) NOT NULL,
    "breached" BOOLEAN NOT NULL DEFAULT false,
    "affectedPeriod" TEXT,
    "relatedItems" JSONB,
    "status" TEXT NOT NULL DEFAULT 'active',
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "dismissedAt" TIMESTAMP(3),
    "dismissedBy" TEXT,
    "organizationId" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityRiskSignal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityAuditLog" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "userId" TEXT,
    "userName" TEXT,
    "userRole" TEXT,
    "scenarioId" TEXT,
    "dataReferenced" JSONB,
    "organizationId" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityAuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiquidityPosition" (
    "id" TEXT NOT NULL,
    "positionDate" TIMESTAMP(3) NOT NULL,
    "periodType" TEXT NOT NULL DEFAULT 'daily',
    "totalCash" DECIMAL(15,2) NOT NULL,
    "operatingCash" DECIMAL(15,2) NOT NULL,
    "reserveCash" DECIMAL(15,2) NOT NULL,
    "restrictedCash" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "availableCredit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "totalLiquidity" DECIMAL(15,2) NOT NULL,
    "minimumBuffer" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expectedInflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expectedOutflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "netCashFlow" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "confirmedInflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expectedInflows2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estimatedInflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "confirmedOutflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expectedOutflows2" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "estimatedOutflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "projectedEndingCash" DECIMAL(15,2),
    "runwayDays" INTEGER,
    "runwayMonths" DECIMAL(5,2),
    "currentRatio" DECIMAL(8,4),
    "quickRatio" DECIMAL(8,4),
    "cashBurnRate" DECIMAL(15,2),
    "bufferDays" INTEGER,
    "concentrationIndex" DECIMAL(5,4),
    "volatilityIndex" DECIMAL(5,4),
    "status" TEXT NOT NULL DEFAULT 'normal',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "riskScore" DECIMAL(5,2),
    "dataCompleteness" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "knownBlindSpots" JSONB,
    "accountBreakdown" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiquidityPosition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WalletToken_walletId_idx" ON "WalletToken"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "WalletToken_walletId_contractAddress_key" ON "WalletToken"("walletId", "contractAddress");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_timestamp_idx" ON "WalletTransaction"("walletId", "timestamp");

-- CreateIndex
CREATE INDEX "WalletTransaction_walletId_type_idx" ON "WalletTransaction"("walletId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_walletId_hash_key" ON "WalletTransaction"("walletId", "hash");

-- CreateIndex
CREATE INDEX "InvoiceVersion_invoiceId_version_idx" ON "InvoiceVersion"("invoiceId", "version");

-- CreateIndex
CREATE INDEX "InvoiceVersion_invoiceId_changeType_idx" ON "InvoiceVersion"("invoiceId", "changeType");

-- CreateIndex
CREATE UNIQUE INDEX "InvoiceAccountingEvent_eventId_key" ON "InvoiceAccountingEvent"("eventId");

-- CreateIndex
CREATE INDEX "InvoiceAccountingEvent_invoiceId_eventType_idx" ON "InvoiceAccountingEvent"("invoiceId", "eventType");

-- CreateIndex
CREATE INDEX "InvoiceAccountingEvent_invoiceId_fiscalYear_idx" ON "InvoiceAccountingEvent"("invoiceId", "fiscalYear");

-- CreateIndex
CREATE INDEX "InvoiceAccountingEvent_eventType_status_idx" ON "InvoiceAccountingEvent"("eventType", "status");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_paymentDate_idx" ON "InvoicePayment"("invoiceId", "paymentDate");

-- CreateIndex
CREATE INDEX "InvoicePayment_invoiceId_status_idx" ON "InvoicePayment"("invoiceId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRecord_archiveRecordId_key" ON "ArchiveRecord"("archiveRecordId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_objectType_idx" ON "ArchiveRecord"("organizationId", "objectType");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_category_idx" ON "ArchiveRecord"("organizationId", "category");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_status_idx" ON "ArchiveRecord"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_archivedAt_idx" ON "ArchiveRecord"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_fiscalYear_idx" ON "ArchiveRecord"("organizationId", "fiscalYear");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_accountingPeriod_idx" ON "ArchiveRecord"("organizationId", "accountingPeriod");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_originalObjectId_idx" ON "ArchiveRecord"("organizationId", "originalObjectId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_partyId_idx" ON "ArchiveRecord"("organizationId", "partyId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_legalEntityId_idx" ON "ArchiveRecord"("organizationId", "legalEntityId");

-- CreateIndex
CREATE INDEX "ArchiveRecord_organizationId_retentionStatus_idx" ON "ArchiveRecord"("organizationId", "retentionStatus");

-- CreateIndex
CREATE INDEX "ArchiveRecord_contentHash_idx" ON "ArchiveRecord"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRecord_organizationId_archiveRecordId_key" ON "ArchiveRecord"("organizationId", "archiveRecordId");

-- CreateIndex
CREATE INDEX "ArchiveLink_sourceArchiveId_idx" ON "ArchiveLink"("sourceArchiveId");

-- CreateIndex
CREATE INDEX "ArchiveLink_targetArchiveId_idx" ON "ArchiveLink"("targetArchiveId");

-- CreateIndex
CREATE INDEX "ArchiveLink_linkType_idx" ON "ArchiveLink"("linkType");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveLink_sourceArchiveId_targetArchiveId_linkType_key" ON "ArchiveLink"("sourceArchiveId", "targetArchiveId", "linkType");

-- CreateIndex
CREATE INDEX "ArchiveVersion_archiveRecordId_versionNumber_idx" ON "ArchiveVersion"("archiveRecordId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveVersion_archiveRecordId_versionNumber_key" ON "ArchiveVersion"("archiveRecordId", "versionNumber");

-- CreateIndex
CREATE INDEX "ArchiveAccessLog_archiveRecordId_timestamp_idx" ON "ArchiveAccessLog"("archiveRecordId", "timestamp");

-- CreateIndex
CREATE INDEX "ArchiveAccessLog_actorId_timestamp_idx" ON "ArchiveAccessLog"("actorId", "timestamp");

-- CreateIndex
CREATE INDEX "ArchiveAccessLog_accessType_timestamp_idx" ON "ArchiveAccessLog"("accessType", "timestamp");

-- CreateIndex
CREATE INDEX "ArchiveRetentionPolicy_organizationId_isActive_idx" ON "ArchiveRetentionPolicy"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveRetentionPolicy_organizationId_code_key" ON "ArchiveRetentionPolicy"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveExport_exportNumber_key" ON "ArchiveExport"("exportNumber");

-- CreateIndex
CREATE INDEX "ArchiveExport_organizationId_status_idx" ON "ArchiveExport"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArchiveExport_organizationId_createdAt_idx" ON "ArchiveExport"("organizationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveImportBatch_batchNumber_key" ON "ArchiveImportBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "ArchiveImportBatch_organizationId_status_idx" ON "ArchiveImportBatch"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArchiveImportBatch_organizationId_startedAt_idx" ON "ArchiveImportBatch"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "ArchiveAutomationRule_organizationId_isActive_idx" ON "ArchiveAutomationRule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ArchiveAutomationRule_organizationId_triggerType_idx" ON "ArchiveAutomationRule"("organizationId", "triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "ArchiveAutomationRule_organizationId_code_key" ON "ArchiveAutomationRule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ArchiveException_organizationId_status_idx" ON "ArchiveException"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArchiveException_organizationId_exceptionType_idx" ON "ArchiveException"("organizationId", "exceptionType");

-- CreateIndex
CREATE INDEX "ArchiveException_organizationId_assignedTo_idx" ON "ArchiveException"("organizationId", "assignedTo");

-- CreateIndex
CREATE INDEX "ArchiveException_organizationId_slaDeadline_idx" ON "ArchiveException"("organizationId", "slaDeadline");

-- CreateIndex
CREATE INDEX "ArchiveSavedView_organizationId_createdBy_idx" ON "ArchiveSavedView"("organizationId", "createdBy");

-- CreateIndex
CREATE INDEX "ArchiveSavedView_organizationId_isPublic_idx" ON "ArchiveSavedView"("organizationId", "isPublic");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityEvent_eventId_key" ON "LiabilityEvent"("eventId");

-- CreateIndex
CREATE INDEX "LiabilityEvent_liabilityId_timestamp_idx" ON "LiabilityEvent"("liabilityId", "timestamp");

-- CreateIndex
CREATE INDEX "LiabilityEvent_liabilityId_eventType_idx" ON "LiabilityEvent"("liabilityId", "eventType");

-- CreateIndex
CREATE INDEX "LiabilityEvent_eventType_timestamp_idx" ON "LiabilityEvent"("eventType", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilitySettlement_settlementId_key" ON "LiabilitySettlement"("settlementId");

-- CreateIndex
CREATE INDEX "LiabilitySettlement_liabilityId_settlementDate_idx" ON "LiabilitySettlement"("liabilityId", "settlementDate");

-- CreateIndex
CREATE INDEX "LiabilitySettlement_liabilityId_settlementType_idx" ON "LiabilitySettlement"("liabilityId", "settlementType");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityAccrual_accrualId_key" ON "LiabilityAccrual"("accrualId");

-- CreateIndex
CREATE INDEX "LiabilityAccrual_liabilityId_accrualType_idx" ON "LiabilityAccrual"("liabilityId", "accrualType");

-- CreateIndex
CREATE INDEX "LiabilityAccrual_liabilityId_periodEnd_idx" ON "LiabilityAccrual"("liabilityId", "periodEnd");

-- CreateIndex
CREATE INDEX "LiabilityAccrual_periodEnd_status_idx" ON "LiabilityAccrual"("periodEnd", "status");

-- CreateIndex
CREATE INDEX "LiabilityCovenantCheck_liabilityId_checkDate_idx" ON "LiabilityCovenantCheck"("liabilityId", "checkDate");

-- CreateIndex
CREATE INDEX "LiabilityCovenantCheck_liabilityId_status_idx" ON "LiabilityCovenantCheck"("liabilityId", "status");

-- CreateIndex
CREATE INDEX "LiabilityCovenantCheck_status_checkDate_idx" ON "LiabilityCovenantCheck"("status", "checkDate");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityImportBatch_batchNumber_key" ON "LiabilityImportBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "LiabilityImportBatch_organizationId_status_idx" ON "LiabilityImportBatch"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LiabilityImportBatch_organizationId_startedAt_idx" ON "LiabilityImportBatch"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "LiabilityAutomationRule_organizationId_isActive_idx" ON "LiabilityAutomationRule"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "LiabilityAutomationRule_organizationId_triggerType_idx" ON "LiabilityAutomationRule"("organizationId", "triggerType");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityAutomationRule_organizationId_code_key" ON "LiabilityAutomationRule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "LiabilityException_organizationId_status_idx" ON "LiabilityException"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LiabilityException_organizationId_exceptionType_idx" ON "LiabilityException"("organizationId", "exceptionType");

-- CreateIndex
CREATE INDEX "LiabilityException_organizationId_assignedTo_idx" ON "LiabilityException"("organizationId", "assignedTo");

-- CreateIndex
CREATE INDEX "LiabilityException_organizationId_slaDeadline_idx" ON "LiabilityException"("organizationId", "slaDeadline");

-- CreateIndex
CREATE INDEX "LiabilityException_liabilityId_status_idx" ON "LiabilityException"("liabilityId", "status");

-- CreateIndex
CREATE INDEX "LiabilitySavedView_organizationId_createdBy_idx" ON "LiabilitySavedView"("organizationId", "createdBy");

-- CreateIndex
CREATE INDEX "LiabilitySavedView_organizationId_isPublic_idx" ON "LiabilitySavedView"("organizationId", "isPublic");

-- CreateIndex
CREATE INDEX "CostCenter_organizationId_isActive_idx" ON "CostCenter"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "CostCenter_organizationId_parentId_idx" ON "CostCenter"("organizationId", "parentId");

-- CreateIndex
CREATE UNIQUE INDEX "CostCenter_organizationId_code_key" ON "CostCenter"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Project_organizationId_status_idx" ON "Project"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Project_organizationId_type_idx" ON "Project"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Project_organizationId_costCenterId_idx" ON "Project"("organizationId", "costCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "Project_organizationId_code_key" ON "Project"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_status_idx" ON "ProjectMilestone"("projectId", "status");

-- CreateIndex
CREATE INDEX "ProjectMilestone_projectId_plannedDate_idx" ON "ProjectMilestone"("projectId", "plannedDate");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_userId_idx" ON "TimeEntry"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_projectId_idx" ON "TimeEntry"("organizationId", "projectId");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_date_idx" ON "TimeEntry"("organizationId", "date");

-- CreateIndex
CREATE INDEX "TimeEntry_organizationId_status_idx" ON "TimeEntry"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InternalChargeback_organizationId_status_idx" ON "InternalChargeback"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InternalChargeback_organizationId_fromCostCenterId_idx" ON "InternalChargeback"("organizationId", "fromCostCenterId");

-- CreateIndex
CREATE INDEX "InternalChargeback_organizationId_toCostCenterId_idx" ON "InternalChargeback"("organizationId", "toCostCenterId");

-- CreateIndex
CREATE INDEX "InternalChargeback_organizationId_date_idx" ON "InternalChargeback"("organizationId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "InternalChargeback_organizationId_chargebackNumber_key" ON "InternalChargeback"("organizationId", "chargebackNumber");

-- CreateIndex
CREATE INDEX "AccountingPeriod_organizationId_status_idx" ON "AccountingPeriod"("organizationId", "status");

-- CreateIndex
CREATE INDEX "AccountingPeriod_organizationId_fiscalYear_idx" ON "AccountingPeriod"("organizationId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPeriod_organizationId_code_key" ON "AccountingPeriod"("organizationId", "code");

-- CreateIndex
CREATE INDEX "CloseChecklistItem_periodId_status_idx" ON "CloseChecklistItem"("periodId", "status");

-- CreateIndex
CREATE INDEX "CloseChecklistItem_periodId_category_idx" ON "CloseChecklistItem"("periodId", "category");

-- CreateIndex
CREATE INDEX "PeriodMissingItem_periodId_status_idx" ON "PeriodMissingItem"("periodId", "status");

-- CreateIndex
CREATE INDEX "PeriodMissingItem_periodId_severity_idx" ON "PeriodMissingItem"("periodId", "severity");

-- CreateIndex
CREATE INDEX "PeriodAdjustment_periodId_status_idx" ON "PeriodAdjustment"("periodId", "status");

-- CreateIndex
CREATE INDEX "PeriodAdjustment_periodId_type_idx" ON "PeriodAdjustment"("periodId", "type");

-- CreateIndex
CREATE INDEX "PeriodAdjustment_organizationId_status_idx" ON "PeriodAdjustment"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "PeriodAdjustment_organizationId_adjustmentNumber_key" ON "PeriodAdjustment"("organizationId", "adjustmentNumber");

-- CreateIndex
CREATE INDEX "PeriodAuditEntry_periodId_createdAt_idx" ON "PeriodAuditEntry"("periodId", "createdAt");

-- CreateIndex
CREATE INDEX "PeriodAuditEntry_periodId_action_idx" ON "PeriodAuditEntry"("periodId", "action");

-- CreateIndex
CREATE INDEX "Customer_organizationId_status_idx" ON "Customer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Customer_organizationId_type_idx" ON "Customer"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Customer_organizationId_riskLevel_idx" ON "Customer"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "Customer_organizationId_creditStatus_idx" ON "Customer"("organizationId", "creditStatus");

-- CreateIndex
CREATE INDEX "Customer_organizationId_paymentBehavior_idx" ON "Customer"("organizationId", "paymentBehavior");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_customerNumber_key" ON "Customer"("organizationId", "customerNumber");

-- CreateIndex
CREATE INDEX "CustomerContact_customerId_idx" ON "CustomerContact"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_status_idx" ON "CustomerPayment"("customerId", "status");

-- CreateIndex
CREATE INDEX "CustomerPayment_customerId_paymentDate_idx" ON "CustomerPayment"("customerId", "paymentDate");

-- CreateIndex
CREATE INDEX "CustomerPayment_organizationId_status_idx" ON "CustomerPayment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CustomerCreditEvent_customerId_createdAt_idx" ON "CustomerCreditEvent"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerRevenue_customerId_periodType_idx" ON "CustomerRevenue"("customerId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerRevenue_customerId_period_periodType_key" ON "CustomerRevenue"("customerId", "period", "periodType");

-- CreateIndex
CREATE INDEX "CustomerRiskIndicator_customerId_status_idx" ON "CustomerRiskIndicator"("customerId", "status");

-- CreateIndex
CREATE INDEX "CustomerRiskIndicator_customerId_severity_idx" ON "CustomerRiskIndicator"("customerId", "severity");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_status_idx" ON "Supplier"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_category_idx" ON "Supplier"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_reliabilityRating_idx" ON "Supplier"("organizationId", "reliabilityRating");

-- CreateIndex
CREATE INDEX "Supplier_organizationId_dependencyLevel_idx" ON "Supplier"("organizationId", "dependencyLevel");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_organizationId_supplierNumber_key" ON "Supplier"("organizationId", "supplierNumber");

-- CreateIndex
CREATE INDEX "SupplierContact_supplierId_idx" ON "SupplierContact"("supplierId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierBalance_supplierId_key" ON "SupplierBalance"("supplierId");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_paymentDate_idx" ON "SupplierPayment"("supplierId", "paymentDate");

-- CreateIndex
CREATE INDEX "SupplierPayment_supplierId_status_idx" ON "SupplierPayment"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierReliability_supplierId_orderDate_idx" ON "SupplierReliability"("supplierId", "orderDate");

-- CreateIndex
CREATE INDEX "SupplierReliability_supplierId_hasIssues_idx" ON "SupplierReliability"("supplierId", "hasIssues");

-- CreateIndex
CREATE INDEX "SupplierSpend_supplierId_periodType_idx" ON "SupplierSpend"("supplierId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierSpend_supplierId_period_periodType_key" ON "SupplierSpend"("supplierId", "period", "periodType");

-- CreateIndex
CREATE INDEX "SupplierRisk_supplierId_status_idx" ON "SupplierRisk"("supplierId", "status");

-- CreateIndex
CREATE INDEX "SupplierRisk_supplierId_severity_idx" ON "SupplierRisk"("supplierId", "severity");

-- CreateIndex
CREATE INDEX "NettingAgreement_organizationId_status_idx" ON "NettingAgreement"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NettingAgreement_organizationId_type_idx" ON "NettingAgreement"("organizationId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "NettingAgreement_organizationId_agreementNumber_key" ON "NettingAgreement"("organizationId", "agreementNumber");

-- CreateIndex
CREATE INDEX "NettingParty_agreementId_idx" ON "NettingParty"("agreementId");

-- CreateIndex
CREATE INDEX "NettingParty_partyId_idx" ON "NettingParty"("partyId");

-- CreateIndex
CREATE INDEX "NettingSession_organizationId_status_idx" ON "NettingSession"("organizationId", "status");

-- CreateIndex
CREATE INDEX "NettingSession_organizationId_nettingDate_idx" ON "NettingSession"("organizationId", "nettingDate");

-- CreateIndex
CREATE INDEX "NettingSession_agreementId_idx" ON "NettingSession"("agreementId");

-- CreateIndex
CREATE UNIQUE INDEX "NettingSession_organizationId_sessionNumber_key" ON "NettingSession"("organizationId", "sessionNumber");

-- CreateIndex
CREATE INDEX "NettingPosition_sessionId_idx" ON "NettingPosition"("sessionId");

-- CreateIndex
CREATE INDEX "NettingPosition_partyId_idx" ON "NettingPosition"("partyId");

-- CreateIndex
CREATE INDEX "NettingTransaction_positionId_idx" ON "NettingTransaction"("positionId");

-- CreateIndex
CREATE INDEX "NettingTransaction_documentNumber_idx" ON "NettingTransaction"("documentNumber");

-- CreateIndex
CREATE INDEX "SettlementInstruction_sessionId_idx" ON "SettlementInstruction"("sessionId");

-- CreateIndex
CREATE INDEX "SettlementInstruction_organizationId_status_idx" ON "SettlementInstruction"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "SettlementInstruction_organizationId_instructionNumber_key" ON "SettlementInstruction"("organizationId", "instructionNumber");

-- CreateIndex
CREATE INDEX "OffsetEntry_organizationId_status_idx" ON "OffsetEntry"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OffsetEntry_organizationId_partyId_idx" ON "OffsetEntry"("organizationId", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "OffsetEntry_organizationId_offsetNumber_key" ON "OffsetEntry"("organizationId", "offsetNumber");

-- CreateIndex
CREATE INDEX "Offer_organizationId_status_idx" ON "Offer"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Offer_organizationId_customerId_idx" ON "Offer"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Offer_organizationId_expiryDate_idx" ON "Offer"("organizationId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "Offer_organizationId_offerNumber_key" ON "Offer"("organizationId", "offerNumber");

-- CreateIndex
CREATE INDEX "OfferVersion_offerId_idx" ON "OfferVersion"("offerId");

-- CreateIndex
CREATE UNIQUE INDEX "OfferVersion_offerId_version_key" ON "OfferVersion"("offerId", "version");

-- CreateIndex
CREATE INDEX "OfferAuditLog_offerId_timestamp_idx" ON "OfferAuditLog"("offerId", "timestamp");

-- CreateIndex
CREATE INDEX "OfferAuditLog_offerId_action_idx" ON "OfferAuditLog"("offerId", "action");

-- CreateIndex
CREATE INDEX "OfferTemplate_organizationId_isActive_idx" ON "OfferTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "OfferTemplate_organizationId_category_idx" ON "OfferTemplate"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_idx" ON "Task"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Task_organizationId_priority_idx" ON "Task"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "Task_organizationId_ownerId_idx" ON "Task"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Task_organizationId_dueDate_idx" ON "Task"("organizationId", "dueDate");

-- CreateIndex
CREATE INDEX "Task_organizationId_sourceSystem_idx" ON "Task"("organizationId", "sourceSystem");

-- CreateIndex
CREATE INDEX "Task_organizationId_slaBreach_idx" ON "Task"("organizationId", "slaBreach");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_dueDate_idx" ON "Task"("organizationId", "status", "dueDate");

-- CreateIndex
CREATE INDEX "Task_organizationId_status_priority_idx" ON "Task"("organizationId", "status", "priority");

-- CreateIndex
CREATE INDEX "TaskAssignee_taskId_idx" ON "TaskAssignee"("taskId");

-- CreateIndex
CREATE INDEX "TaskAssignee_userId_idx" ON "TaskAssignee"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskAssignee_taskId_userId_key" ON "TaskAssignee"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskWatcher_taskId_idx" ON "TaskWatcher"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskWatcher_taskId_userId_key" ON "TaskWatcher"("taskId", "userId");

-- CreateIndex
CREATE INDEX "TaskTag_organizationId_idx" ON "TaskTag"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_organizationId_name_key" ON "TaskTag"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTagLink_taskId_tagId_key" ON "TaskTagLink"("taskId", "tagId");

-- CreateIndex
CREATE INDEX "TaskDependency_dependentTaskId_idx" ON "TaskDependency"("dependentTaskId");

-- CreateIndex
CREATE INDEX "TaskDependency_blockingTaskId_idx" ON "TaskDependency"("blockingTaskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskDependency_dependentTaskId_blockingTaskId_key" ON "TaskDependency"("dependentTaskId", "blockingTaskId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- CreateIndex
CREATE INDEX "TaskComment_parentId_idx" ON "TaskComment"("parentId");

-- CreateIndex
CREATE INDEX "TaskActivity_taskId_timestamp_idx" ON "TaskActivity"("taskId", "timestamp");

-- CreateIndex
CREATE INDEX "TaskAttachment_taskId_idx" ON "TaskAttachment"("taskId");

-- CreateIndex
CREATE INDEX "Risk_organizationId_status_idx" ON "Risk"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Risk_organizationId_severity_idx" ON "Risk"("organizationId", "severity");

-- CreateIndex
CREATE INDEX "Risk_organizationId_ownerId_idx" ON "Risk"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "RiskMitigationStep_riskId_idx" ON "RiskMitigationStep"("riskId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskRiskLink_taskId_riskId_key" ON "TaskRiskLink"("taskId", "riskId");

-- CreateIndex
CREATE INDEX "RiskComment_riskId_idx" ON "RiskComment"("riskId");

-- CreateIndex
CREATE INDEX "RiskActivity_riskId_timestamp_idx" ON "RiskActivity"("riskId", "timestamp");

-- CreateIndex
CREATE INDEX "TaskNotification_recipientId_isRead_idx" ON "TaskNotification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "TaskNotification_organizationId_recipientId_idx" ON "TaskNotification"("organizationId", "recipientId");

-- CreateIndex
CREATE INDEX "SavedTaskFilter_organizationId_createdBy_idx" ON "SavedTaskFilter"("organizationId", "createdBy");

-- CreateIndex
CREATE INDEX "RevenueForecast_organizationId_version_idx" ON "RevenueForecast"("organizationId", "version");

-- CreateIndex
CREATE INDEX "RevenueForecast_organizationId_scenarioId_idx" ON "RevenueForecast"("organizationId", "scenarioId");

-- CreateIndex
CREATE INDEX "RevenueLineItem_revenueForecastId_idx" ON "RevenueLineItem"("revenueForecastId");

-- CreateIndex
CREATE INDEX "RevenueLineItem_revenueForecastId_category_idx" ON "RevenueLineItem"("revenueForecastId", "category");

-- CreateIndex
CREATE INDEX "CostForecast_organizationId_version_idx" ON "CostForecast"("organizationId", "version");

-- CreateIndex
CREATE INDEX "CostForecast_organizationId_scenarioId_idx" ON "CostForecast"("organizationId", "scenarioId");

-- CreateIndex
CREATE INDEX "CostLineItem_costForecastId_idx" ON "CostLineItem"("costForecastId");

-- CreateIndex
CREATE INDEX "CostLineItem_costForecastId_category_idx" ON "CostLineItem"("costForecastId", "category");

-- CreateIndex
CREATE INDEX "CashForecast_organizationId_version_idx" ON "CashForecast"("organizationId", "version");

-- CreateIndex
CREATE INDEX "CashForecast_organizationId_scenarioId_idx" ON "CashForecast"("organizationId", "scenarioId");

-- CreateIndex
CREATE INDEX "CashForecastPeriod_cashForecastId_idx" ON "CashForecastPeriod"("cashForecastId");

-- CreateIndex
CREATE UNIQUE INDEX "CashForecastPeriod_cashForecastId_periodId_key" ON "CashForecastPeriod"("cashForecastId", "periodId");

-- CreateIndex
CREATE INDEX "ForecastScenario_organizationId_type_idx" ON "ForecastScenario"("organizationId", "type");

-- CreateIndex
CREATE INDEX "ForecastScenario_organizationId_isActive_idx" ON "ForecastScenario"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "ForecastAssumption_scenarioId_idx" ON "ForecastAssumption"("scenarioId");

-- CreateIndex
CREATE INDEX "ForecastAssumption_scenarioId_category_idx" ON "ForecastAssumption"("scenarioId", "category");

-- CreateIndex
CREATE INDEX "ForecastAlert_organizationId_isRead_idx" ON "ForecastAlert"("organizationId", "isRead");

-- CreateIndex
CREATE INDEX "ForecastAlert_organizationId_severity_idx" ON "ForecastAlert"("organizationId", "severity");

-- CreateIndex
CREATE INDEX "ForecastAlert_organizationId_forecastType_idx" ON "ForecastAlert"("organizationId", "forecastType");

-- CreateIndex
CREATE INDEX "ForecastAnnotation_revenueForecastId_idx" ON "ForecastAnnotation"("revenueForecastId");

-- CreateIndex
CREATE INDEX "ForecastAnnotation_costForecastId_idx" ON "ForecastAnnotation"("costForecastId");

-- CreateIndex
CREATE INDEX "ForecastAnnotation_cashForecastId_idx" ON "ForecastAnnotation"("cashForecastId");

-- CreateIndex
CREATE INDEX "ForecastVariance_organizationId_idx" ON "ForecastVariance"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ForecastVariance_organizationId_periodId_key" ON "ForecastVariance"("organizationId", "periodId");

-- CreateIndex
CREATE INDEX "Scenario_organizationId_status_idx" ON "Scenario"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Scenario_organizationId_caseType_idx" ON "Scenario"("organizationId", "caseType");

-- CreateIndex
CREATE INDEX "Scenario_organizationId_ownerId_idx" ON "Scenario"("organizationId", "ownerId");

-- CreateIndex
CREATE INDEX "Scenario_organizationId_visibility_idx" ON "Scenario"("organizationId", "visibility");

-- CreateIndex
CREATE INDEX "ScenarioAssumption_scenarioId_idx" ON "ScenarioAssumption"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioAssumption_scenarioId_category_idx" ON "ScenarioAssumption"("scenarioId", "category");

-- CreateIndex
CREATE INDEX "StressTest_organizationId_type_idx" ON "StressTest"("organizationId", "type");

-- CreateIndex
CREATE INDEX "StressTest_organizationId_isTemplate_idx" ON "StressTest"("organizationId", "isTemplate");

-- CreateIndex
CREATE INDEX "StressTest_organizationId_result_idx" ON "StressTest"("organizationId", "result");

-- CreateIndex
CREATE INDEX "SimulationState_organizationId_userId_idx" ON "SimulationState"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "SimulationState_organizationId_isPinned_idx" ON "SimulationState"("organizationId", "isPinned");

-- CreateIndex
CREATE INDEX "ScenarioComment_scenarioId_idx" ON "ScenarioComment"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioComment_scenarioId_isResolved_idx" ON "ScenarioComment"("scenarioId", "isResolved");

-- CreateIndex
CREATE INDEX "ScenarioDecision_scenarioId_idx" ON "ScenarioDecision"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioDecision_scenarioId_type_idx" ON "ScenarioDecision"("scenarioId", "type");

-- CreateIndex
CREATE INDEX "ScenarioChangeEvent_scenarioId_timestamp_idx" ON "ScenarioChangeEvent"("scenarioId", "timestamp");

-- CreateIndex
CREATE INDEX "ScenarioChangeEvent_scenarioId_changeType_idx" ON "ScenarioChangeEvent"("scenarioId", "changeType");

-- CreateIndex
CREATE INDEX "KPI_organizationId_category_idx" ON "KPI"("organizationId", "category");

-- CreateIndex
CREATE INDEX "KPI_organizationId_status_idx" ON "KPI"("organizationId", "status");

-- CreateIndex
CREATE INDEX "KPI_organizationId_isPinned_idx" ON "KPI"("organizationId", "isPinned");

-- CreateIndex
CREATE UNIQUE INDEX "KPI_organizationId_code_key" ON "KPI"("organizationId", "code");

-- CreateIndex
CREATE INDEX "KPIHistory_kpiId_periodStart_idx" ON "KPIHistory"("kpiId", "periodStart");

-- CreateIndex
CREATE INDEX "KPIHistory_kpiId_periodType_idx" ON "KPIHistory"("kpiId", "periodType");

-- CreateIndex
CREATE INDEX "KPIAlert_organizationId_isDismissed_idx" ON "KPIAlert"("organizationId", "isDismissed");

-- CreateIndex
CREATE INDEX "KPIAlert_organizationId_severity_idx" ON "KPIAlert"("organizationId", "severity");

-- CreateIndex
CREATE INDEX "KPIAlert_kpiId_triggeredAt_idx" ON "KPIAlert"("kpiId", "triggeredAt");

-- CreateIndex
CREATE INDEX "KPITarget_kpiId_periodStart_idx" ON "KPITarget"("kpiId", "periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "KPITarget_kpiId_periodLabel_key" ON "KPITarget"("kpiId", "periodLabel");

-- CreateIndex
CREATE INDEX "KPIBenchmark_kpiId_isActive_idx" ON "KPIBenchmark"("kpiId", "isActive");

-- CreateIndex
CREATE INDEX "FXRate_organizationId_baseCurrency_quoteCurrency_idx" ON "FXRate"("organizationId", "baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "FXRate_organizationId_timestamp_idx" ON "FXRate"("organizationId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "FXRate_organizationId_baseCurrency_quoteCurrency_timestamp_key" ON "FXRate"("organizationId", "baseCurrency", "quoteCurrency", "timestamp");

-- CreateIndex
CREATE INDEX "FXExposure_organizationId_baseCurrency_quoteCurrency_idx" ON "FXExposure"("organizationId", "baseCurrency", "quoteCurrency");

-- CreateIndex
CREATE INDEX "FXExposure_organizationId_status_idx" ON "FXExposure"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FXExposure_organizationId_type_idx" ON "FXExposure"("organizationId", "type");

-- CreateIndex
CREATE INDEX "FXExposure_organizationId_maturityDate_idx" ON "FXExposure"("organizationId", "maturityDate");

-- CreateIndex
CREATE INDEX "FXExposure_organizationId_riskLevel_idx" ON "FXExposure"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "FXConversion_organizationId_status_idx" ON "FXConversion"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FXConversion_organizationId_conversionDate_idx" ON "FXConversion"("organizationId", "conversionDate");

-- CreateIndex
CREATE INDEX "FXConversion_organizationId_sourceCurrency_targetCurrency_idx" ON "FXConversion"("organizationId", "sourceCurrency", "targetCurrency");

-- CreateIndex
CREATE UNIQUE INDEX "FXConversion_organizationId_conversionNumber_key" ON "FXConversion"("organizationId", "conversionNumber");

-- CreateIndex
CREATE INDEX "FXScenario_organizationId_isActive_idx" ON "FXScenario"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "FXScenario_organizationId_scenarioType_idx" ON "FXScenario"("organizationId", "scenarioType");

-- CreateIndex
CREATE INDEX "FXForecast_organizationId_status_idx" ON "FXForecast"("organizationId", "status");

-- CreateIndex
CREATE INDEX "FXCost_organizationId_idx" ON "FXCost"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "FXCost_organizationId_period_key" ON "FXCost"("organizationId", "period");

-- CreateIndex
CREATE INDEX "FXRiskIndicator_organizationId_isActive_idx" ON "FXRiskIndicator"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "FXRiskIndicator_organizationId_riskLevel_idx" ON "FXRiskIndicator"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "FXRiskIndicator_organizationId_type_idx" ON "FXRiskIndicator"("organizationId", "type");

-- CreateIndex
CREATE INDEX "FXAuditLog_organizationId_timestamp_idx" ON "FXAuditLog"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "FXAuditLog_organizationId_category_idx" ON "FXAuditLog"("organizationId", "category");

-- CreateIndex
CREATE INDEX "FXAuditLog_organizationId_action_idx" ON "FXAuditLog"("organizationId", "action");

-- CreateIndex
CREATE INDEX "InvestorSnapshot_organizationId_snapshotDate_idx" ON "InvestorSnapshot"("organizationId", "snapshotDate");

-- CreateIndex
CREATE INDEX "InvestorSnapshot_organizationId_periodType_idx" ON "InvestorSnapshot"("organizationId", "periodType");

-- CreateIndex
CREATE UNIQUE INDEX "InvestorSnapshot_organizationId_snapshotDate_periodType_key" ON "InvestorSnapshot"("organizationId", "snapshotDate", "periodType");

-- CreateIndex
CREATE INDEX "BoardReport_organizationId_asOfDate_idx" ON "BoardReport"("organizationId", "asOfDate");

-- CreateIndex
CREATE INDEX "BoardReport_organizationId_status_idx" ON "BoardReport"("organizationId", "status");

-- CreateIndex
CREATE INDEX "RunwayProjection_organizationId_isActive_idx" ON "RunwayProjection"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "RunwayProjection_organizationId_scenarioType_idx" ON "RunwayProjection"("organizationId", "scenarioType");

-- CreateIndex
CREATE INDEX "InvestorAccessLog_organizationId_timestamp_idx" ON "InvestorAccessLog"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "InvestorAccessLog_organizationId_userId_idx" ON "InvestorAccessLog"("organizationId", "userId");

-- CreateIndex
CREATE INDEX "InvestorAccessLog_organizationId_action_idx" ON "InvestorAccessLog"("organizationId", "action");

-- CreateIndex
CREATE INDEX "CashflowItem_organizationId_expectedDate_idx" ON "CashflowItem"("organizationId", "expectedDate");

-- CreateIndex
CREATE INDEX "CashflowItem_organizationId_type_idx" ON "CashflowItem"("organizationId", "type");

-- CreateIndex
CREATE INDEX "CashflowItem_organizationId_confidence_idx" ON "CashflowItem"("organizationId", "confidence");

-- CreateIndex
CREATE INDEX "CashflowItem_organizationId_category_idx" ON "CashflowItem"("organizationId", "category");

-- CreateIndex
CREATE INDEX "LiquidityScenario_organizationId_type_idx" ON "LiquidityScenario"("organizationId", "type");

-- CreateIndex
CREATE INDEX "LiquidityScenario_organizationId_isActive_idx" ON "LiquidityScenario"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "LiquidityGap_organizationId_status_idx" ON "LiquidityGap"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LiquidityGap_organizationId_startDate_idx" ON "LiquidityGap"("organizationId", "startDate");

-- CreateIndex
CREATE INDEX "LiquidityGap_organizationId_severity_idx" ON "LiquidityGap"("organizationId", "severity");

-- CreateIndex
CREATE INDEX "LiquidityRiskSignal_organizationId_status_idx" ON "LiquidityRiskSignal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LiquidityRiskSignal_organizationId_riskLevel_idx" ON "LiquidityRiskSignal"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "LiquidityRiskSignal_organizationId_type_idx" ON "LiquidityRiskSignal"("organizationId", "type");

-- CreateIndex
CREATE INDEX "LiquidityAuditLog_organizationId_timestamp_idx" ON "LiquidityAuditLog"("organizationId", "timestamp");

-- CreateIndex
CREATE INDEX "LiquidityAuditLog_organizationId_action_idx" ON "LiquidityAuditLog"("organizationId", "action");

-- CreateIndex
CREATE INDEX "LiquidityPosition_organizationId_positionDate_idx" ON "LiquidityPosition"("organizationId", "positionDate");

-- CreateIndex
CREATE INDEX "LiquidityPosition_organizationId_status_idx" ON "LiquidityPosition"("organizationId", "status");

-- CreateIndex
CREATE INDEX "LiquidityPosition_organizationId_riskLevel_idx" ON "LiquidityPosition"("organizationId", "riskLevel");

-- CreateIndex
CREATE UNIQUE INDEX "LiquidityPosition_organizationId_positionDate_periodType_key" ON "LiquidityPosition"("organizationId", "positionDate", "periodType");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_customerId_idx" ON "Invoice"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_isLatest_idx" ON "Invoice"("organizationId", "isLatest");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_fiscalYear_idx" ON "Invoice"("organizationId", "fiscalYear");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_status_dueDate_idx" ON "Invoice"("organizationId", "status", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Liability_liabilityId_key" ON "Liability"("liabilityId");

-- CreateIndex
CREATE INDEX "Liability_organizationId_primaryClass_idx" ON "Liability"("organizationId", "primaryClass");

-- CreateIndex
CREATE INDEX "Liability_organizationId_partyId_idx" ON "Liability"("organizationId", "partyId");

-- CreateIndex
CREATE INDEX "Liability_organizationId_legalEntityId_idx" ON "Liability"("organizationId", "legalEntityId");

-- CreateIndex
CREATE INDEX "Liability_organizationId_riskLevel_idx" ON "Liability"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "Liability_organizationId_nextPaymentDate_idx" ON "Liability"("organizationId", "nextPaymentDate");

-- CreateIndex
CREATE INDEX "Liability_organizationId_isInDefault_idx" ON "Liability"("organizationId", "isInDefault");

-- CreateIndex
CREATE INDEX "Liability_organizationId_currency_idx" ON "Liability"("organizationId", "currency");

-- CreateIndex
CREATE UNIQUE INDEX "Liability_organizationId_liabilityId_key" ON "Liability"("organizationId", "liabilityId");

-- CreateIndex
CREATE UNIQUE INDEX "LiabilityPayment_paymentId_key" ON "LiabilityPayment"("paymentId");

-- CreateIndex
CREATE INDEX "LiabilityPayment_liabilityId_status_idx" ON "LiabilityPayment"("liabilityId", "status");

-- CreateIndex
CREATE INDEX "LiabilityPayment_liabilityId_scheduledDate_idx" ON "LiabilityPayment"("liabilityId", "scheduledDate");

-- CreateIndex
CREATE INDEX "LiabilityPayment_status_scheduledDate_idx" ON "LiabilityPayment"("status", "scheduledDate");

-- CreateIndex
CREATE INDEX "Receipt_organizationId_status_idx" ON "Receipt"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Receipt_deletedAt_idx" ON "Receipt"("deletedAt");

-- CreateIndex
CREATE INDEX "SavedReport_userId_status_idx" ON "SavedReport"("userId", "status");

-- CreateIndex
CREATE INDEX "Transaction_deletedAt_idx" ON "Transaction"("deletedAt");

-- CreateIndex
CREATE INDEX "Wallet_userId_idx" ON "Wallet"("userId");

-- CreateIndex
CREATE INDEX "Wallet_organizationId_idx" ON "Wallet"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_address_network_key" ON "Wallet"("userId", "address", "network");

-- AddForeignKey
ALTER TABLE "WalletToken" ADD CONSTRAINT "WalletToken_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WalletTransaction" ADD CONSTRAINT "WalletTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceVersion" ADD CONSTRAINT "InvoiceVersion_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceAccountingEvent" ADD CONSTRAINT "InvoiceAccountingEvent_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoicePayment" ADD CONSTRAINT "InvoicePayment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveRecord" ADD CONSTRAINT "ArchiveRecord_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveLink" ADD CONSTRAINT "ArchiveLink_sourceArchiveId_fkey" FOREIGN KEY ("sourceArchiveId") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveLink" ADD CONSTRAINT "ArchiveLink_targetArchiveId_fkey" FOREIGN KEY ("targetArchiveId") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveVersion" ADD CONSTRAINT "ArchiveVersion_archiveRecordId_fkey" FOREIGN KEY ("archiveRecordId") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveAccessLog" ADD CONSTRAINT "ArchiveAccessLog_archiveRecordId_fkey" FOREIGN KEY ("archiveRecordId") REFERENCES "ArchiveRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiabilityEvent" ADD CONSTRAINT "LiabilityEvent_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiabilitySettlement" ADD CONSTRAINT "LiabilitySettlement_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiabilityAccrual" ADD CONSTRAINT "LiabilityAccrual_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiabilityCovenantCheck" ADD CONSTRAINT "LiabilityCovenantCheck_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostCenter" ADD CONSTRAINT "CostCenter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMilestone" ADD CONSTRAINT "ProjectMilestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_costCenterId_fkey" FOREIGN KEY ("costCenterId") REFERENCES "CostCenter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalChargeback" ADD CONSTRAINT "InternalChargeback_fromCostCenterId_fkey" FOREIGN KEY ("fromCostCenterId") REFERENCES "CostCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalChargeback" ADD CONSTRAINT "InternalChargeback_toCostCenterId_fkey" FOREIGN KEY ("toCostCenterId") REFERENCES "CostCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalChargeback" ADD CONSTRAINT "InternalChargeback_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternalChargeback" ADD CONSTRAINT "InternalChargeback_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountingPeriod" ADD CONSTRAINT "AccountingPeriod_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CloseChecklistItem" ADD CONSTRAINT "CloseChecklistItem_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodMissingItem" ADD CONSTRAINT "PeriodMissingItem_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodAdjustment" ADD CONSTRAINT "PeriodAdjustment_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodAdjustment" ADD CONSTRAINT "PeriodAdjustment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PeriodAuditEntry" ADD CONSTRAINT "PeriodAuditEntry_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "AccountingPeriod"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerContact" ADD CONSTRAINT "CustomerContact_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPayment" ADD CONSTRAINT "CustomerPayment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditEvent" ADD CONSTRAINT "CustomerCreditEvent_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerCreditEvent" ADD CONSTRAINT "CustomerCreditEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRevenue" ADD CONSTRAINT "CustomerRevenue_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerRiskIndicator" ADD CONSTRAINT "CustomerRiskIndicator_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Supplier" ADD CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierContact" ADD CONSTRAINT "SupplierContact_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierBalance" ADD CONSTRAINT "SupplierBalance_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierPayment" ADD CONSTRAINT "SupplierPayment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierReliability" ADD CONSTRAINT "SupplierReliability_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierSpend" ADD CONSTRAINT "SupplierSpend_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierRisk" ADD CONSTRAINT "SupplierRisk_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingAgreement" ADD CONSTRAINT "NettingAgreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingParty" ADD CONSTRAINT "NettingParty_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "NettingAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingSession" ADD CONSTRAINT "NettingSession_agreementId_fkey" FOREIGN KEY ("agreementId") REFERENCES "NettingAgreement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingSession" ADD CONSTRAINT "NettingSession_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingPosition" ADD CONSTRAINT "NettingPosition_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NettingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingPosition" ADD CONSTRAINT "NettingPosition_nettingPartyId_fkey" FOREIGN KEY ("nettingPartyId") REFERENCES "NettingParty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingTransaction" ADD CONSTRAINT "NettingTransaction_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "NettingPosition"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementInstruction" ADD CONSTRAINT "SettlementInstruction_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "NettingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SettlementInstruction" ADD CONSTRAINT "SettlementInstruction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OffsetEntry" ADD CONSTRAINT "OffsetEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferVersion" ADD CONSTRAINT "OfferVersion_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferAuditLog" ADD CONSTRAINT "OfferAuditLog_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "Offer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfferTemplate" ADD CONSTRAINT "OfferTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAssignee" ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskWatcher" ADD CONSTRAINT "TaskWatcher_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTagLink" ADD CONSTRAINT "TaskTagLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTagLink" ADD CONSTRAINT "TaskTagLink_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "TaskTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_dependentTaskId_fkey" FOREIGN KEY ("dependentTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskDependency" ADD CONSTRAINT "TaskDependency_blockingTaskId_fkey" FOREIGN KEY ("blockingTaskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "TaskComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskActivity" ADD CONSTRAINT "TaskActivity_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskAttachment" ADD CONSTRAINT "TaskAttachment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Risk" ADD CONSTRAINT "Risk_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskMitigationStep" ADD CONSTRAINT "RiskMitigationStep_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRiskLink" ADD CONSTRAINT "TaskRiskLink_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskRiskLink" ADD CONSTRAINT "TaskRiskLink_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskComment" ADD CONSTRAINT "RiskComment_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiskActivity" ADD CONSTRAINT "RiskActivity_riskId_fkey" FOREIGN KEY ("riskId") REFERENCES "Risk"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNotification" ADD CONSTRAINT "TaskNotification_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskNotification" ADD CONSTRAINT "TaskNotification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTaskFilter" ADD CONSTRAINT "SavedTaskFilter_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueForecast" ADD CONSTRAINT "RevenueForecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueLineItem" ADD CONSTRAINT "RevenueLineItem_revenueForecastId_fkey" FOREIGN KEY ("revenueForecastId") REFERENCES "RevenueForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostForecast" ADD CONSTRAINT "CostForecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CostLineItem" ADD CONSTRAINT "CostLineItem_costForecastId_fkey" FOREIGN KEY ("costForecastId") REFERENCES "CostForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashForecast" ADD CONSTRAINT "CashForecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashForecastPeriod" ADD CONSTRAINT "CashForecastPeriod_cashForecastId_fkey" FOREIGN KEY ("cashForecastId") REFERENCES "CashForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastScenario" ADD CONSTRAINT "ForecastScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAssumption" ADD CONSTRAINT "ForecastAssumption_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "ForecastScenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAlert" ADD CONSTRAINT "ForecastAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAnnotation" ADD CONSTRAINT "ForecastAnnotation_revenueForecastId_fkey" FOREIGN KEY ("revenueForecastId") REFERENCES "RevenueForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAnnotation" ADD CONSTRAINT "ForecastAnnotation_costForecastId_fkey" FOREIGN KEY ("costForecastId") REFERENCES "CostForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastAnnotation" ADD CONSTRAINT "ForecastAnnotation_cashForecastId_fkey" FOREIGN KEY ("cashForecastId") REFERENCES "CashForecast"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ForecastVariance" ADD CONSTRAINT "ForecastVariance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scenario" ADD CONSTRAINT "Scenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioAssumption" ADD CONSTRAINT "ScenarioAssumption_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StressTest" ADD CONSTRAINT "StressTest_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SimulationState" ADD CONSTRAINT "SimulationState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioComment" ADD CONSTRAINT "ScenarioComment_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioDecision" ADD CONSTRAINT "ScenarioDecision_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioChangeEvent" ADD CONSTRAINT "ScenarioChangeEvent_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPI" ADD CONSTRAINT "KPI_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIHistory" ADD CONSTRAINT "KPIHistory_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIAlert" ADD CONSTRAINT "KPIAlert_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIAlert" ADD CONSTRAINT "KPIAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPITarget" ADD CONSTRAINT "KPITarget_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KPIBenchmark" ADD CONSTRAINT "KPIBenchmark_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "KPI"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXRate" ADD CONSTRAINT "FXRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXExposure" ADD CONSTRAINT "FXExposure_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXConversion" ADD CONSTRAINT "FXConversion_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXScenario" ADD CONSTRAINT "FXScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXForecast" ADD CONSTRAINT "FXForecast_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXCost" ADD CONSTRAINT "FXCost_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXRiskIndicator" ADD CONSTRAINT "FXRiskIndicator_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FXAuditLog" ADD CONSTRAINT "FXAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorSnapshot" ADD CONSTRAINT "InvestorSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardReport" ADD CONSTRAINT "BoardReport_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RunwayProjection" ADD CONSTRAINT "RunwayProjection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvestorAccessLog" ADD CONSTRAINT "InvestorAccessLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CashflowItem" ADD CONSTRAINT "CashflowItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityScenario" ADD CONSTRAINT "LiquidityScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityGap" ADD CONSTRAINT "LiquidityGap_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityRiskSignal" ADD CONSTRAINT "LiquidityRiskSignal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityAuditLog" ADD CONSTRAINT "LiquidityAuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiquidityPosition" ADD CONSTRAINT "LiquidityPosition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
