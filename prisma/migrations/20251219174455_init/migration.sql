-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "emailVerified" TIMESTAMP(3),
    "image" TEXT,
    "role" TEXT NOT NULL DEFAULT 'member',
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'CH',
    "industry" TEXT,
    "fiscalYearEnd" TEXT NOT NULL DEFAULT '12-31',
    "defaultCurrency" TEXT NOT NULL DEFAULT 'USD',
    "taxId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FinancialAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "parentId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FinancialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "type" TEXT NOT NULL,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "tags" TEXT[],
    "tokenized" BOOLEAN NOT NULL DEFAULT false,
    "txHash" TEXT,
    "accountId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receipt" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "vendor" TEXT,
    "amount" DOUBLE PRECISION,
    "date" TIMESTAMP(3),
    "extractedText" TEXT,
    "confidence" DOUBLE PRECISION,
    "transactionId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatChannel" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'public',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Zurich',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "dateFormat" TEXT NOT NULL DEFAULT 'DD.MM.YYYY',
    "theme" TEXT NOT NULL DEFAULT 'dark',
    "emailNotifications" BOOLEAN NOT NULL DEFAULT true,
    "pushNotifications" BOOLEAN NOT NULL DEFAULT true,
    "transactionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "reportNotifications" BOOLEAN NOT NULL DEFAULT true,
    "aiSuggestionNotifications" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Wallet" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "provider" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AISuggestion" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "impact" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'pending',
    "metadata" JSONB,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AISuggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedReport" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "parameters" JSONB,
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFreq" TEXT,
    "lastGenerated" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CorporateEntity" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "taxId" TEXT,
    "incorporationDate" TIMESTAMP(3),
    "ownershipPercent" DECIMAL(5,2),
    "revenue" DECIMAL(15,2),
    "expenses" DECIMAL(15,2),
    "taxLiability" DECIMAL(15,2),
    "effectiveTaxRate" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "parentId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CorporateEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "sender" JSONB NOT NULL,
    "recipient" JSONB NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "serviceDate" TIMESTAMP(3),
    "servicePeriodStart" TIMESTAMP(3),
    "servicePeriodEnd" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "total" DECIMAL(15,2) NOT NULL,
    "applyTax" BOOLEAN NOT NULL DEFAULT true,
    "taxRate" DECIMAL(5,2) NOT NULL,
    "taxExemptReason" TEXT,
    "taxExemptNote" TEXT,
    "payment" JSONB NOT NULL,
    "notes" TEXT,
    "internalNotes" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "sentAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "nextRecurringDate" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,
    "orderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "customerId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT,
    "customerAddress" JSONB,
    "orderDate" TIMESTAMP(3) NOT NULL,
    "expectedDeliveryDate" TIMESTAMP(3),
    "completedDate" TIMESTAMP(3),
    "items" JSONB NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "subtotal" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "discountAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(15,2) NOT NULL,
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "fulfilledQuantity" INTEGER NOT NULL DEFAULT 0,
    "totalQuantity" INTEGER NOT NULL DEFAULT 0,
    "fulfillmentPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "invoicedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "internalNotes" TEXT,
    "tags" TEXT[],
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringInterval" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArchiveItem" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'archived',
    "originalId" TEXT NOT NULL,
    "originalType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "counterparty" TEXT,
    "itemDate" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "restoredAt" TIMESTAMP(3),
    "fiscalYear" INTEGER,
    "fiscalPeriod" TEXT,
    "tags" TEXT[],
    "attachments" JSONB,
    "metadata" JSONB,
    "archivedBy" TEXT,
    "restoredBy" TEXT,
    "archiveReason" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ArchiveItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Liability" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "counterpartyId" TEXT,
    "counterpartyName" TEXT NOT NULL,
    "counterpartyType" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "outstandingAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(15,2),
    "availableCredit" DECIMAL(15,2),
    "utilizationRate" DECIMAL(5,2),
    "interestRate" DECIMAL(5,4),
    "interestType" TEXT,
    "interestAccrued" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3),
    "nextPaymentDate" TIMESTAMP(3),
    "lastPaymentDate" TIMESTAMP(3),
    "paymentFrequency" TEXT,
    "paymentAmount" DECIMAL(15,2),
    "paymentSchedule" JSONB,
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "collateralDescription" TEXT,
    "collateralValue" DECIMAL(15,2),
    "covenants" JSONB,
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "alertThreshold" DECIMAL(5,2),
    "tags" TEXT[],
    "notes" TEXT,
    "attachments" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Liability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiabilityPayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "principalAmount" DECIMAL(15,2) NOT NULL,
    "interestAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "feesAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reference" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "liabilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LiabilityPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "barcode" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "quantityOnHand" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "quantityReserved" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "quantityAvailable" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "quantityOnOrder" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'pcs',
    "minimumStock" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "maximumStock" DECIMAL(15,4),
    "reorderPoint" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "reorderQuantity" DECIMAL(15,4),
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "unitCost" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "averageCost" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "lastPurchaseCost" DECIMAL(15,4),
    "sellingPrice" DECIMAL(15,4),
    "totalValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "costingMethod" TEXT NOT NULL DEFAULT 'average',
    "warehouseId" TEXT,
    "warehouseName" TEXT,
    "location" TEXT,
    "zone" TEXT,
    "ownershipType" TEXT NOT NULL DEFAULT 'owned',
    "supplierId" TEXT,
    "supplierName" TEXT,
    "isSerialTracked" BOOLEAN NOT NULL DEFAULT false,
    "isBatchTracked" BOOLEAN NOT NULL DEFAULT false,
    "isExpiryTracked" BOOLEAN NOT NULL DEFAULT false,
    "leadTimeDays" INTEGER,
    "weight" DECIMAL(10,4),
    "weightUnit" TEXT,
    "length" DECIMAL(10,4),
    "width" DECIMAL(10,4),
    "height" DECIMAL(10,4),
    "dimensionUnit" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "imageUrl" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "quantity" DECIMAL(15,4) NOT NULL,
    "previousQuantity" DECIMAL(15,4) NOT NULL,
    "newQuantity" DECIMAL(15,4) NOT NULL,
    "unitCost" DECIMAL(15,4),
    "totalCost" DECIMAL(15,2),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "referenceNumber" TEXT,
    "fromWarehouseId" TEXT,
    "fromLocation" TEXT,
    "toWarehouseId" TEXT,
    "toLocation" TEXT,
    "batchId" TEXT,
    "serialNumber" TEXT,
    "reason" TEXT,
    "notes" TEXT,
    "performedBy" TEXT,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "inventoryItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryBatch" (
    "id" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "lotNumber" TEXT,
    "initialQuantity" DECIMAL(15,4) NOT NULL,
    "currentQuantity" DECIMAL(15,4) NOT NULL,
    "reservedQuantity" DECIMAL(15,4) NOT NULL DEFAULT 0,
    "unitCost" DECIMAL(15,4) NOT NULL,
    "manufacturingDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "receivedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'available',
    "supplierId" TEXT,
    "supplierBatchRef" TEXT,
    "qualityStatus" TEXT,
    "qualityNotes" TEXT,
    "warehouseId" TEXT,
    "location" TEXT,
    "inventoryItemId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InventoryBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receivable" (
    "id" TEXT NOT NULL,
    "originType" TEXT NOT NULL,
    "originReferenceId" TEXT,
    "creditorEntityId" TEXT,
    "debtorId" TEXT,
    "debtorName" TEXT NOT NULL,
    "debtorEmail" TEXT,
    "debtorPhone" TEXT,
    "debtorAddress" JSONB,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "originalAmount" DECIMAL(15,2) NOT NULL,
    "outstandingAmount" DECIMAL(15,2) NOT NULL,
    "paidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "disputedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "writtenOffAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "issueDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "expectedPaymentDate" TIMESTAMP(3),
    "lastActivityDate" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'open',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "daysOutstanding" INTEGER NOT NULL DEFAULT 0,
    "agingBucket" TEXT NOT NULL DEFAULT 'current',
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputeReason" TEXT,
    "disputeOpenedAt" TIMESTAMP(3),
    "disputeResolvedAt" TIMESTAMP(3),
    "collectionStage" TEXT,
    "collectionStartedAt" TIMESTAMP(3),
    "collectionAgency" TEXT,
    "autoRemindersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nextReminderDate" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "reference" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "internalNotes" TEXT,
    "tags" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Receivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivablePayment" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "type" TEXT NOT NULL,
    "reference" TEXT,
    "transactionId" TEXT,
    "notes" TEXT,
    "appliedBy" TEXT,
    "receivableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceivablePayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReceivableEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "previousValue" TEXT,
    "newValue" TEXT,
    "amount" DECIMAL(15,2),
    "performedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "receivableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReceivableEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "type" TEXT NOT NULL,
    "bankName" TEXT,
    "bankCode" TEXT,
    "iban" TEXT,
    "cashClassification" TEXT NOT NULL DEFAULT 'unrestricted',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "currentBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "availableBalance" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingInflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "pendingOutflows" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minimumBalance" DECIMAL(15,2),
    "targetBalance" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'active',
    "isMainAccount" BOOLEAN NOT NULL DEFAULT false,
    "participatesInPooling" BOOLEAN NOT NULL DEFAULT false,
    "poolingRole" TEXT,
    "masterAccountId" TEXT,
    "entityId" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapitalBucket" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "targetAmount" DECIMAL(15,2) NOT NULL,
    "currentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "minimumAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "fundingStatus" TEXT NOT NULL DEFAULT 'underfunded',
    "fundingPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "priority" INTEGER NOT NULL DEFAULT 5,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "autoFund" BOOLEAN NOT NULL DEFAULT false,
    "fundingSourceAccountId" TEXT,
    "timeHorizon" TEXT,
    "targetDate" TIMESTAMP(3),
    "notes" TEXT,
    "tags" TEXT[],
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapitalBucket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CreditFacility" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "lenderName" TEXT NOT NULL,
    "lenderId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "facilityLimit" DECIMAL(15,2) NOT NULL,
    "drawnAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "availableAmount" DECIMAL(15,2) NOT NULL,
    "pendingDrawdowns" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "utilizationRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "utilizationAlert" DECIMAL(5,2),
    "interestRate" DECIMAL(5,4),
    "interestType" TEXT,
    "spreadBps" INTEGER,
    "commitmentFeeBps" INTEGER,
    "arrangementFee" DECIMAL(15,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "maturityDate" TIMESTAMP(3) NOT NULL,
    "nextReviewDate" TIMESTAMP(3),
    "covenants" JSONB,
    "covenantStatus" TEXT NOT NULL DEFAULT 'compliant',
    "isSecured" BOOLEAN NOT NULL DEFAULT false,
    "securityDescription" TEXT,
    "reference" TEXT,
    "notes" TEXT,
    "documents" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CreditFacility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacilityDrawdown" (
    "id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "drawdownDate" TIMESTAMP(3) NOT NULL,
    "repaidAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "outstandingAmount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "interestRate" DECIMAL(5,4),
    "accruedInterest" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "maturityDate" TIMESTAMP(3),
    "reference" TEXT,
    "purpose" TEXT,
    "notes" TEXT,
    "facilityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FacilityDrawdown_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryDecision" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "amount" DECIMAL(15,2) NOT NULL,
    "riskDelta" JSONB,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approvalThreshold" DECIMAL(15,2),
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "executionMode" TEXT NOT NULL DEFAULT 'manual',
    "scheduledDate" TIMESTAMP(3),
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "executionNotes" TEXT,
    "expiresAt" TIMESTAMP(3),
    "sourceAccountId" TEXT,
    "targetAccountId" TEXT,
    "facilityId" TEXT,
    "bucketId" TEXT,
    "alternatives" JSONB,
    "notes" TEXT,
    "metadata" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryDecision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryScenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "assumptions" JSONB NOT NULL,
    "horizonDays" INTEGER NOT NULL DEFAULT 90,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3) NOT NULL,
    "results" JSONB,
    "cashFlowProjection" JSONB,
    "minimumCashDate" TIMESTAMP(3),
    "minimumCashAmount" DECIMAL(15,2),
    "endingCashAmount" DECIMAL(15,2),
    "probabilityWeight" DECIMAL(5,2),
    "riskScore" DECIMAL(5,2),
    "createdBy" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TreasuryScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TreasuryCashMovement" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "balanceBefore" DECIMAL(15,2) NOT NULL,
    "balanceAfter" DECIMAL(15,2) NOT NULL,
    "movementDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "valueDate" TIMESTAMP(3),
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "counterparty" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "transactionId" TEXT,
    "decisionId" TEXT,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TreasuryCashMovement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NettingOpportunity" (
    "id" TEXT NOT NULL,
    "entityAId" TEXT NOT NULL,
    "entityAName" TEXT NOT NULL,
    "entityBId" TEXT NOT NULL,
    "entityBName" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "amountAToB" DECIMAL(15,2) NOT NULL,
    "amountBToA" DECIMAL(15,2) NOT NULL,
    "netAmount" DECIMAL(15,2) NOT NULL,
    "netDirection" TEXT NOT NULL,
    "grossAmount" DECIMAL(15,2) NOT NULL,
    "savingsAmount" DECIMAL(15,2) NOT NULL,
    "savingsPercent" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'identified',
    "executedAt" TIMESTAMP(3),
    "executedBy" TEXT,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NettingOpportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "assetNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "assetClass" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "acquisitionDate" TIMESTAMP(3) NOT NULL,
    "acquisitionType" TEXT NOT NULL DEFAULT 'purchase',
    "acquisitionCost" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "vendorId" TEXT,
    "vendorName" TEXT,
    "purchaseOrderRef" TEXT,
    "invoiceRef" TEXT,
    "currentBookValue" DECIMAL(15,2) NOT NULL,
    "fairValue" DECIMAL(15,2),
    "residualValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isDepreciable" BOOLEAN NOT NULL DEFAULT true,
    "depreciationMethod" TEXT NOT NULL DEFAULT 'straight_line',
    "usefulLifeMonths" INTEGER,
    "usefulLifeUnits" INTEGER,
    "depreciationRate" DECIMAL(5,2),
    "accumulatedDepreciation" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "accumulatedImpairment" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "depreciationStartDate" TIMESTAMP(3),
    "lastDepreciationDate" TIMESTAMP(3),
    "nextDepreciationDate" TIMESTAMP(3),
    "monthlyDepreciation" DECIMAL(15,2),
    "locationId" TEXT,
    "locationName" TEXT,
    "locationAddress" TEXT,
    "costCenterId" TEXT,
    "costCenterName" TEXT,
    "responsibleParty" TEXT,
    "responsiblePartyId" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "serialNumber" TEXT,
    "modelNumber" TEXT,
    "manufacturer" TEXT,
    "barcode" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitOfMeasure" TEXT NOT NULL DEFAULT 'pcs',
    "isInsured" BOOLEAN NOT NULL DEFAULT false,
    "insurancePolicy" TEXT,
    "insuredValue" DECIMAL(15,2),
    "insuranceExpiry" TIMESTAMP(3),
    "warrantyExpiry" TIMESTAMP(3),
    "warrantyTerms" TEXT,
    "requiresMaintenance" BOOLEAN NOT NULL DEFAULT false,
    "maintenanceSchedule" TEXT,
    "lastMaintenanceDate" TIMESTAMP(3),
    "nextMaintenanceDate" TIMESTAMP(3),
    "plannedDisposalDate" TIMESTAMP(3),
    "disposalMethod" TEXT,
    "lastRevaluationDate" TIMESTAMP(3),
    "revaluationSurplus" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "isComponent" BOOLEAN NOT NULL DEFAULT false,
    "parentAssetId" TEXT,
    "tags" TEXT[],
    "notes" TEXT,
    "attachments" JSONB,
    "customFields" JSONB,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDepreciation" (
    "id" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "fiscalPeriod" TEXT,
    "depreciationAmount" DECIMAL(15,2) NOT NULL,
    "accumulatedDepreciation" DECIMAL(15,2) NOT NULL,
    "openingBookValue" DECIMAL(15,2) NOT NULL,
    "closingBookValue" DECIMAL(15,2) NOT NULL,
    "method" TEXT NOT NULL,
    "rate" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'calculated',
    "journalEntryId" TEXT,
    "postedAt" TIMESTAMP(3),
    "postedBy" TEXT,
    "bookType" TEXT NOT NULL DEFAULT 'statutory',
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetDepreciation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetEvent" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DECIMAL(15,2),
    "previousValue" DECIMAL(15,2),
    "newValue" DECIMAL(15,2),
    "eventDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "referenceType" TEXT,
    "referenceId" TEXT,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "performedBy" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetTransfer" (
    "id" TEXT NOT NULL,
    "transferDate" TIMESTAMP(3) NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "transferType" TEXT NOT NULL,
    "fromEntityId" TEXT,
    "fromEntityName" TEXT,
    "fromCostCenterId" TEXT,
    "fromCostCenterName" TEXT,
    "fromLocationId" TEXT,
    "fromLocationName" TEXT,
    "fromResponsibleParty" TEXT,
    "toEntityId" TEXT,
    "toEntityName" TEXT,
    "toCostCenterId" TEXT,
    "toCostCenterName" TEXT,
    "toLocationId" TEXT,
    "toLocationName" TEXT,
    "toResponsibleParty" TEXT,
    "bookValueAtTransfer" DECIMAL(15,2) NOT NULL,
    "accumulatedDepAtTransfer" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "requestedBy" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "reason" TEXT,
    "notes" TEXT,
    "assetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssetTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetDisposal" (
    "id" TEXT NOT NULL,
    "disposalDate" TIMESTAMP(3) NOT NULL,
    "disposalType" TEXT NOT NULL,
    "carryingAmount" DECIMAL(15,2) NOT NULL,
    "accumulatedDepreciation" DECIMAL(15,2) NOT NULL,
    "salePrice" DECIMAL(15,2),
    "saleCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "buyerName" TEXT,
    "buyerReference" TEXT,
    "invoiceId" TEXT,
    "gainOrLoss" DECIMAL(15,2) NOT NULL,
    "isGain" BOOLEAN NOT NULL DEFAULT false,
    "disposalCosts" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(15,2),
    "taxTreatment" TEXT,
    "status" TEXT NOT NULL DEFAULT 'completed',
    "reason" TEXT NOT NULL,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "journalEntryId" TEXT,
    "notes" TEXT,
    "attachments" JSONB,
    "assetId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssetDisposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapExBudget" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscalYear" TEXT NOT NULL,
    "description" TEXT,
    "entityId" TEXT,
    "entityName" TEXT,
    "projectId" TEXT,
    "projectName" TEXT,
    "costCenterId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "budgetAmount" DECIMAL(15,2) NOT NULL,
    "committedAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "spentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remainingAmount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "utilizationPercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapExBudget_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapExItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "estimatedAmount" DECIMAL(15,2) NOT NULL,
    "actualAmount" DECIMAL(15,2),
    "variance" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'planned',
    "classification" TEXT NOT NULL DEFAULT 'capex',
    "classificationReason" TEXT,
    "assetId" TEXT,
    "approvedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "plannedDate" TIMESTAMP(3),
    "actualDate" TIMESTAMP(3),
    "notes" TEXT,
    "budgetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CapExItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialAccount_organizationId_accountNumber_key" ON "FinancialAccount"("organizationId", "accountNumber");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_date_idx" ON "Transaction"("organizationId", "date");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_type_idx" ON "Transaction"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Transaction_organizationId_status_idx" ON "Transaction"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Receipt_organizationId_idx" ON "Receipt"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "ChatChannel_organizationId_name_key" ON "ChatChannel"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ChatMessage_channelId_createdAt_idx" ON "ChatMessage"("channelId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Wallet_userId_address_key" ON "Wallet"("userId", "address");

-- CreateIndex
CREATE INDEX "AISuggestion_userId_status_idx" ON "AISuggestion"("userId", "status");

-- CreateIndex
CREATE INDEX "SavedReport_userId_idx" ON "SavedReport"("userId");

-- CreateIndex
CREATE INDEX "CorporateEntity_userId_idx" ON "CorporateEntity"("userId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_status_idx" ON "Invoice"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_dueDate_idx" ON "Invoice"("organizationId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");

-- CreateIndex
CREATE INDEX "Order_organizationId_status_idx" ON "Order"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Order_organizationId_orderDate_idx" ON "Order"("organizationId", "orderDate");

-- CreateIndex
CREATE INDEX "Order_organizationId_customerId_idx" ON "Order"("organizationId", "customerId");

-- CreateIndex
CREATE UNIQUE INDEX "Order_organizationId_orderNumber_key" ON "Order"("organizationId", "orderNumber");

-- CreateIndex
CREATE INDEX "ArchiveItem_organizationId_category_idx" ON "ArchiveItem"("organizationId", "category");

-- CreateIndex
CREATE INDEX "ArchiveItem_organizationId_fiscalYear_idx" ON "ArchiveItem"("organizationId", "fiscalYear");

-- CreateIndex
CREATE INDEX "ArchiveItem_organizationId_status_idx" ON "ArchiveItem"("organizationId", "status");

-- CreateIndex
CREATE INDEX "ArchiveItem_organizationId_archivedAt_idx" ON "ArchiveItem"("organizationId", "archivedAt");

-- CreateIndex
CREATE INDEX "Liability_organizationId_type_idx" ON "Liability"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Liability_organizationId_status_idx" ON "Liability"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Liability_organizationId_maturityDate_idx" ON "Liability"("organizationId", "maturityDate");

-- CreateIndex
CREATE INDEX "Liability_organizationId_counterpartyId_idx" ON "Liability"("organizationId", "counterpartyId");

-- CreateIndex
CREATE INDEX "LiabilityPayment_liabilityId_paymentDate_idx" ON "LiabilityPayment"("liabilityId", "paymentDate");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_type_idx" ON "InventoryItem"("organizationId", "type");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_status_idx" ON "InventoryItem"("organizationId", "status");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_category_idx" ON "InventoryItem"("organizationId", "category");

-- CreateIndex
CREATE INDEX "InventoryItem_organizationId_warehouseId_idx" ON "InventoryItem"("organizationId", "warehouseId");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryItem_organizationId_sku_key" ON "InventoryItem"("organizationId", "sku");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryItemId_movementDate_idx" ON "InventoryMovement"("inventoryItemId", "movementDate");

-- CreateIndex
CREATE INDEX "InventoryMovement_inventoryItemId_type_idx" ON "InventoryMovement"("inventoryItemId", "type");

-- CreateIndex
CREATE INDEX "InventoryBatch_inventoryItemId_status_idx" ON "InventoryBatch"("inventoryItemId", "status");

-- CreateIndex
CREATE INDEX "InventoryBatch_inventoryItemId_expiryDate_idx" ON "InventoryBatch"("inventoryItemId", "expiryDate");

-- CreateIndex
CREATE UNIQUE INDEX "InventoryBatch_inventoryItemId_batchNumber_key" ON "InventoryBatch"("inventoryItemId", "batchNumber");

-- CreateIndex
CREATE INDEX "Receivable_organizationId_status_idx" ON "Receivable"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Receivable_organizationId_dueDate_idx" ON "Receivable"("organizationId", "dueDate");

-- CreateIndex
CREATE INDEX "Receivable_organizationId_debtorId_idx" ON "Receivable"("organizationId", "debtorId");

-- CreateIndex
CREATE INDEX "Receivable_organizationId_agingBucket_idx" ON "Receivable"("organizationId", "agingBucket");

-- CreateIndex
CREATE INDEX "Receivable_organizationId_riskLevel_idx" ON "Receivable"("organizationId", "riskLevel");

-- CreateIndex
CREATE INDEX "ReceivablePayment_receivableId_appliedAt_idx" ON "ReceivablePayment"("receivableId", "appliedAt");

-- CreateIndex
CREATE INDEX "ReceivableEvent_receivableId_createdAt_idx" ON "ReceivableEvent"("receivableId", "createdAt");

-- CreateIndex
CREATE INDEX "TreasuryAccount_organizationId_type_idx" ON "TreasuryAccount"("organizationId", "type");

-- CreateIndex
CREATE INDEX "TreasuryAccount_organizationId_status_idx" ON "TreasuryAccount"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TreasuryAccount_organizationId_cashClassification_idx" ON "TreasuryAccount"("organizationId", "cashClassification");

-- CreateIndex
CREATE INDEX "CapitalBucket_organizationId_type_idx" ON "CapitalBucket"("organizationId", "type");

-- CreateIndex
CREATE INDEX "CapitalBucket_organizationId_fundingStatus_idx" ON "CapitalBucket"("organizationId", "fundingStatus");

-- CreateIndex
CREATE INDEX "CreditFacility_organizationId_type_idx" ON "CreditFacility"("organizationId", "type");

-- CreateIndex
CREATE INDEX "CreditFacility_organizationId_status_idx" ON "CreditFacility"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CreditFacility_organizationId_maturityDate_idx" ON "CreditFacility"("organizationId", "maturityDate");

-- CreateIndex
CREATE INDEX "FacilityDrawdown_facilityId_status_idx" ON "FacilityDrawdown"("facilityId", "status");

-- CreateIndex
CREATE INDEX "TreasuryDecision_organizationId_status_idx" ON "TreasuryDecision"("organizationId", "status");

-- CreateIndex
CREATE INDEX "TreasuryDecision_organizationId_type_idx" ON "TreasuryDecision"("organizationId", "type");

-- CreateIndex
CREATE INDEX "TreasuryDecision_organizationId_priority_idx" ON "TreasuryDecision"("organizationId", "priority");

-- CreateIndex
CREATE INDEX "TreasuryScenario_organizationId_type_idx" ON "TreasuryScenario"("organizationId", "type");

-- CreateIndex
CREATE INDEX "TreasuryScenario_organizationId_isActive_idx" ON "TreasuryScenario"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "TreasuryCashMovement_accountId_movementDate_idx" ON "TreasuryCashMovement"("accountId", "movementDate");

-- CreateIndex
CREATE INDEX "TreasuryCashMovement_accountId_type_idx" ON "TreasuryCashMovement"("accountId", "type");

-- CreateIndex
CREATE INDEX "NettingOpportunity_organizationId_status_idx" ON "NettingOpportunity"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Asset_organizationId_status_idx" ON "Asset"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Asset_organizationId_category_idx" ON "Asset"("organizationId", "category");

-- CreateIndex
CREATE INDEX "Asset_organizationId_entityId_idx" ON "Asset"("organizationId", "entityId");

-- CreateIndex
CREATE INDEX "Asset_organizationId_costCenterId_idx" ON "Asset"("organizationId", "costCenterId");

-- CreateIndex
CREATE INDEX "Asset_organizationId_locationId_idx" ON "Asset"("organizationId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_assetNumber_key" ON "Asset"("organizationId", "assetNumber");

-- CreateIndex
CREATE INDEX "AssetDepreciation_assetId_periodStart_idx" ON "AssetDepreciation"("assetId", "periodStart");

-- CreateIndex
CREATE INDEX "AssetDepreciation_assetId_bookType_idx" ON "AssetDepreciation"("assetId", "bookType");

-- CreateIndex
CREATE INDEX "AssetDepreciation_assetId_status_idx" ON "AssetDepreciation"("assetId", "status");

-- CreateIndex
CREATE INDEX "AssetEvent_assetId_eventDate_idx" ON "AssetEvent"("assetId", "eventDate");

-- CreateIndex
CREATE INDEX "AssetEvent_assetId_type_idx" ON "AssetEvent"("assetId", "type");

-- CreateIndex
CREATE INDEX "AssetTransfer_assetId_transferDate_idx" ON "AssetTransfer"("assetId", "transferDate");

-- CreateIndex
CREATE UNIQUE INDEX "AssetDisposal_assetId_key" ON "AssetDisposal"("assetId");

-- CreateIndex
CREATE INDEX "AssetDisposal_organizationId_disposalDate_idx" ON "AssetDisposal"("organizationId", "disposalDate");

-- CreateIndex
CREATE INDEX "AssetDisposal_organizationId_disposalType_idx" ON "AssetDisposal"("organizationId", "disposalType");

-- CreateIndex
CREATE INDEX "CapExBudget_organizationId_fiscalYear_idx" ON "CapExBudget"("organizationId", "fiscalYear");

-- CreateIndex
CREATE INDEX "CapExBudget_organizationId_status_idx" ON "CapExBudget"("organizationId", "status");

-- CreateIndex
CREATE INDEX "CapExItem_budgetId_status_idx" ON "CapExItem"("budgetId", "status");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "FinancialAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FinancialAccount" ADD CONSTRAINT "FinancialAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "FinancialAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receipt" ADD CONSTRAINT "Receipt_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatChannel" ADD CONSTRAINT "ChatChannel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES "ChatChannel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AISuggestion" ADD CONSTRAINT "AISuggestion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReport" ADD CONSTRAINT "SavedReport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEntity" ADD CONSTRAINT "CorporateEntity_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "CorporateEntity"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CorporateEntity" ADD CONSTRAINT "CorporateEntity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArchiveItem" ADD CONSTRAINT "ArchiveItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Liability" ADD CONSTRAINT "Liability_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiabilityPayment" ADD CONSTRAINT "LiabilityPayment_liabilityId_fkey" FOREIGN KEY ("liabilityId") REFERENCES "Liability"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "InventoryBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryMovement" ADD CONSTRAINT "InventoryMovement_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryBatch" ADD CONSTRAINT "InventoryBatch_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receivable" ADD CONSTRAINT "Receivable_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivablePayment" ADD CONSTRAINT "ReceivablePayment_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceivableEvent" ADD CONSTRAINT "ReceivableEvent_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "Receivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryAccount" ADD CONSTRAINT "TreasuryAccount_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapitalBucket" ADD CONSTRAINT "CapitalBucket_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditFacility" ADD CONSTRAINT "CreditFacility_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacilityDrawdown" ADD CONSTRAINT "FacilityDrawdown_facilityId_fkey" FOREIGN KEY ("facilityId") REFERENCES "CreditFacility"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryDecision" ADD CONSTRAINT "TreasuryDecision_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryScenario" ADD CONSTRAINT "TreasuryScenario_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TreasuryCashMovement" ADD CONSTRAINT "TreasuryCashMovement_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "TreasuryAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NettingOpportunity" ADD CONSTRAINT "NettingOpportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDepreciation" ADD CONSTRAINT "AssetDepreciation_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetEvent" ADD CONSTRAINT "AssetEvent_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetTransfer" ADD CONSTRAINT "AssetTransfer_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetDisposal" ADD CONSTRAINT "AssetDisposal_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapExBudget" ADD CONSTRAINT "CapExBudget_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CapExItem" ADD CONSTRAINT "CapExItem_budgetId_fkey" FOREIGN KEY ("budgetId") REFERENCES "CapExBudget"("id") ON DELETE CASCADE ON UPDATE CASCADE;
