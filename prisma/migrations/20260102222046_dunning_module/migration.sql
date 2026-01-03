-- CreateTable
CREATE TABLE "Dunning" (
    "id" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "dunningNumber" TEXT NOT NULL,
    "invoiceId" TEXT,
    "customerId" TEXT,
    "customerName" TEXT,
    "partyId" TEXT,
    "legalEntityId" TEXT,
    "jurisdictionId" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "reportingCurrency" TEXT NOT NULL DEFAULT 'EUR',
    "status" TEXT NOT NULL DEFAULT 'issued',
    "previousStatus" TEXT,
    "statusChangedAt" TIMESTAMP(3),
    "statusChangedBy" TEXT,
    "currentLevel" INTEGER NOT NULL DEFAULT 0,
    "originalAmount" DECIMAL(19,4) NOT NULL,
    "outstandingAmount" DECIMAL(19,4) NOT NULL,
    "interestAccrued" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "feesAccrued" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(19,4) NOT NULL,
    "fxRateAtCreation" DECIMAL(19,8),
    "amountInReporting" DECIMAL(19,4),
    "interestRateApplied" DECIMAL(8,5),
    "interestRateSource" TEXT,
    "interestStartDate" TIMESTAMP(3),
    "interestLastCalculated" TIMESTAMP(3),
    "interestDayCount" TEXT,
    "flatFeeApplied" DECIMAL(19,4),
    "flatFeeSource" TEXT,
    "customFeesApplied" DECIMAL(19,4),
    "invoiceDueDate" TIMESTAMP(3) NOT NULL,
    "invoiceIssuedDate" TIMESTAMP(3),
    "daysPastDue" INTEGER NOT NULL DEFAULT 0,
    "gracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "effectiveDueDate" TIMESTAMP(3),
    "reminderProposedAt" TIMESTAMP(3),
    "reminderApprovedAt" TIMESTAMP(3),
    "reminderApprovedBy" TEXT,
    "reminderSentAt" TIMESTAMP(3),
    "dunningLevel1ProposedAt" TIMESTAMP(3),
    "dunningLevel1ApprovedAt" TIMESTAMP(3),
    "dunningLevel1ApprovedBy" TEXT,
    "dunningLevel1SentAt" TIMESTAMP(3),
    "dunningLevel2ProposedAt" TIMESTAMP(3),
    "dunningLevel2ApprovedAt" TIMESTAMP(3),
    "dunningLevel2ApprovedBy" TEXT,
    "dunningLevel2SentAt" TIMESTAMP(3),
    "dunningLevel3InitiatedAt" TIMESTAMP(3),
    "dunningLevel3InitiatedBy" TEXT,
    "dunningLevel3ApprovedAt" TIMESTAMP(3),
    "dunningLevel3ApprovedBy" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "dunningLevel3SentAt" TIMESTAMP(3),
    "escalationPreparedAt" TIMESTAMP(3),
    "escalationPreparedBy" TEXT,
    "settledAt" TIMESTAMP(3),
    "settledBy" TEXT,
    "settledAmount" DECIMAL(19,4),
    "settlementReference" TEXT,
    "writtenOffAt" TIMESTAMP(3),
    "writtenOffBy" TEXT,
    "writtenOffAmount" DECIMAL(19,4),
    "writeOffReason" TEXT,
    "writeOffReasonCode" TEXT,
    "isDisputed" BOOLEAN NOT NULL DEFAULT false,
    "disputedAt" TIMESTAMP(3),
    "disputedBy" TEXT,
    "disputeReason" TEXT,
    "disputeAmount" DECIMAL(19,4),
    "disputeResolvedAt" TIMESTAMP(3),
    "disputeResolvedBy" TEXT,
    "disputeResolution" TEXT,
    "customerType" TEXT,
    "customerJurisdiction" TEXT,
    "customerLanguage" TEXT NOT NULL DEFAULT 'en',
    "customerDunningBlocked" BOOLEAN NOT NULL DEFAULT false,
    "customerPaymentHistory" TEXT,
    "customerRiskScore" DECIMAL(5,2),
    "contractId" TEXT,
    "contractPaymentTerms" TEXT,
    "contractCustomDunningRules" JSONB,
    "lastCommunicationAt" TIMESTAMP(3),
    "lastCommunicationType" TEXT,
    "communicationCount" INTEGER NOT NULL DEFAULT 0,
    "hasActiveProposal" BOOLEAN NOT NULL DEFAULT false,
    "activeProposalId" TEXT,
    "activeProposalLevel" TEXT,
    "lastVerificationAt" TIMESTAMP(3),
    "verificationStatus" TEXT,
    "verificationErrors" JSONB,
    "dataSourcesChecked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "systemTags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "confidenceScore" DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    "validationMode" TEXT NOT NULL DEFAULT 'hard',
    "locale" TEXT NOT NULL DEFAULT 'de-DE',
    "language" TEXT NOT NULL DEFAULT 'de',
    "lastDecisionExplanation" TEXT,
    "lastRuleApplied" TEXT,
    "lastRuleVersion" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "eventCount" INTEGER NOT NULL DEFAULT 0,
    "lastEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "archivedAt" TIMESTAMP(3),
    "archivedBy" TEXT,
    "archiveReason" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "Dunning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveDate" TIMESTAMP(3),
    "actorId" TEXT NOT NULL,
    "actorName" TEXT,
    "actorType" TEXT NOT NULL DEFAULT 'user',
    "payload" JSONB NOT NULL,
    "previousState" JSONB,
    "previousEventId" TEXT,
    "contentHash" TEXT,
    "explanation" TEXT,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "dataSourcesChecked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inputSnapshot" JSONB,
    "decision" TEXT,
    "metadata" JSONB,
    "isReversed" BOOLEAN NOT NULL DEFAULT false,
    "reversedBy" TEXT,
    "reversalOf" TEXT,

    CONSTRAINT "DunningEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningProposal" (
    "id" TEXT NOT NULL,
    "proposalId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "proposalType" TEXT NOT NULL,
    "proposalLevel" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "outstandingAmount" DECIMAL(19,4) NOT NULL,
    "interestProposed" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "feesProposed" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalProposed" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "verificationChecks" JSONB NOT NULL,
    "verificationErrors" JSONB,
    "invoiceVerified" BOOLEAN NOT NULL DEFAULT false,
    "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
    "disputeVerified" BOOLEAN NOT NULL DEFAULT false,
    "customerVerified" BOOLEAN NOT NULL DEFAULT false,
    "contractVerified" BOOLEAN NOT NULL DEFAULT false,
    "priorDunningVerified" BOOLEAN NOT NULL DEFAULT false,
    "confidenceScore" DECIMAL(4,3) NOT NULL DEFAULT 1.0,
    "confidenceFactors" JSONB,
    "ruleId" TEXT,
    "ruleVersion" TEXT,
    "dataSourcesChecked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "inputSnapshot" JSONB,
    "explanation" TEXT NOT NULL,
    "templateId" TEXT,
    "templateVersion" TEXT,
    "generatedContent" JSONB,
    "deadline" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedBy" TEXT,
    "rejectionReason" TEXT,
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "proposedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proposedBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningProposal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningCommunication" (
    "id" TEXT NOT NULL,
    "communicationId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "proposalId" TEXT,
    "communicationType" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "recipientName" TEXT NOT NULL,
    "recipientEmail" TEXT,
    "recipientAddress" JSONB,
    "recipientLanguage" TEXT NOT NULL DEFAULT 'en',
    "templateId" TEXT NOT NULL,
    "templateVersion" TEXT,
    "subject" TEXT,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "attachments" JSONB,
    "outstandingAmount" DECIMAL(19,4) NOT NULL,
    "interestAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "feesAmount" DECIMAL(19,4) NOT NULL DEFAULT 0,
    "totalDue" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "paymentDeadline" TIMESTAMP(3),
    "paymentInstructions" JSONB,
    "scheduledAt" TIMESTAMP(3),
    "sentAt" TIMESTAMP(3),
    "sentBy" TEXT,
    "deliveredAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "lastRetryAt" TIMESTAMP(3),
    "externalMessageId" TEXT,
    "postalTrackingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningInterestAccrual" (
    "id" TEXT NOT NULL,
    "accrualId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "daysInPeriod" INTEGER NOT NULL,
    "principalBase" DECIMAL(19,4) NOT NULL,
    "interestRate" DECIMAL(8,5) NOT NULL,
    "rateSource" TEXT NOT NULL,
    "dayCountBasis" TEXT NOT NULL DEFAULT 'actual_365',
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "amountInReporting" DECIMAL(19,4),
    "fxRate" DECIMAL(19,8),
    "jurisdictionId" TEXT,
    "statutoryRate" DECIMAL(8,5),
    "status" TEXT NOT NULL DEFAULT 'calculated',
    "appliedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "calculationDetails" JSONB,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "DunningInterestAccrual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningFee" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "feeType" TEXT NOT NULL,
    "feeSource" TEXT NOT NULL,
    "description" TEXT,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL,
    "amountInReporting" DECIMAL(19,4),
    "fxRate" DECIMAL(19,8),
    "baseAmount" DECIMAL(19,4),
    "percentage" DECIMAL(8,5),
    "jurisdictionId" TEXT,
    "jurisdictionLimit" DECIMAL(19,4),
    "dunningLevel" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'calculated',
    "appliedAt" TIMESTAMP(3),
    "appliedBy" TEXT,
    "waivedAt" TIMESTAMP(3),
    "waivedBy" TEXT,
    "waiverReason" TEXT,
    "reversedAt" TIMESTAMP(3),
    "reversedBy" TEXT,
    "explanation" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,

    CONSTRAINT "DunningFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningDisputeRecord" (
    "id" TEXT NOT NULL,
    "disputeId" TEXT NOT NULL,
    "dunningId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "disputeType" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "disputedAmount" DECIMAL(19,4),
    "currency" TEXT,
    "resolution" TEXT,
    "resolutionType" TEXT,
    "adjustedAmount" DECIMAL(19,4),
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "attachments" JSONB,
    "comments" JSONB,
    "escalationNotes" TEXT,
    "escalatedAt" TIMESTAMP(3),
    "escalatedTo" TEXT,
    "escalationLevel" INTEGER NOT NULL DEFAULT 0,
    "slaDeadline" TIMESTAMP(3),
    "isOverdue" BOOLEAN NOT NULL DEFAULT false,
    "openedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningDisputeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningImportBatch" (
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
    "customerFilter" TEXT,
    "fieldMapping" JSONB,
    "mappingTemplate" TEXT,
    "errors" JSONB,
    "warnings" JSONB,
    "createdDunningIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "canRollback" BOOLEAN NOT NULL DEFAULT false,
    "rolledBackAt" TIMESTAMP(3),
    "rolledBackBy" TEXT,
    "importedBy" TEXT NOT NULL,
    "importedByName" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningAutomationRule" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" TEXT NOT NULL,
    "triggerConditions" JSONB,
    "schedule" TEXT,
    "dunningLevels" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "customerTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "jurisdictions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "invoiceAmountMin" DECIMAL(19,4),
    "invoiceAmountMax" DECIMAL(19,4),
    "reminderDaysAfterDue" INTEGER NOT NULL DEFAULT 3,
    "level1DaysAfterDue" INTEGER NOT NULL DEFAULT 14,
    "level2DaysAfterDue" INTEGER NOT NULL DEFAULT 30,
    "minimumIntervalDays" INTEGER NOT NULL DEFAULT 7,
    "actionType" TEXT NOT NULL,
    "actionConfig" JSONB,
    "confidenceThreshold" DECIMAL(4,3) NOT NULL DEFAULT 0.95,
    "proposalThreshold" DECIMAL(4,3) NOT NULL DEFAULT 0.70,
    "requiresApproval" BOOLEAN NOT NULL DEFAULT true,
    "approverRoles" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "multiSignatureRequired" BOOLEAN NOT NULL DEFAULT false,
    "multiSignatureCount" INTEGER NOT NULL DEFAULT 2,
    "fallbackRuleId" TEXT,
    "fallbackBehavior" TEXT,
    "explanationTemplate" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 50,
    "lastExecutedAt" TIMESTAMP(3),
    "executionCount" INTEGER NOT NULL DEFAULT 0,
    "successCount" INTEGER NOT NULL DEFAULT 0,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningAutomationRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningException" (
    "id" TEXT NOT NULL,
    "dunningId" TEXT,
    "proposalId" TEXT,
    "sourceObjectId" TEXT,
    "sourceObjectType" TEXT,
    "sourceModule" TEXT,
    "exceptionType" TEXT NOT NULL,
    "exceptionCode" TEXT,
    "exceptionMessage" TEXT NOT NULL,
    "exceptionDetails" JSONB,
    "validationMode" TEXT,
    "validationErrors" JSONB,
    "confidenceScore" DECIMAL(4,3),
    "dataSourcesChecked" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "assignedTo" TEXT,
    "assignedName" TEXT,
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
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningException_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningTemplate" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "dunningLevel" INTEGER NOT NULL,
    "templateType" TEXT NOT NULL DEFAULT 'email',
    "jurisdictionId" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "customerType" TEXT,
    "subject" TEXT,
    "bodyHtml" TEXT,
    "bodyText" TEXT,
    "headerHtml" TEXT,
    "footerHtml" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'formal',
    "availableVariables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "requiredVariables" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "legalDisclaimer" TEXT,
    "includesInterest" BOOLEAN NOT NULL DEFAULT false,
    "includesFees" BOOLEAN NOT NULL DEFAULT false,
    "includesLegalWarning" BOOLEAN NOT NULL DEFAULT false,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "previousVersionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningSavedView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "filters" JSONB,
    "columns" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sortBy" TEXT,
    "sortOrder" TEXT NOT NULL DEFAULT 'desc',
    "groupBy" TEXT,
    "includeAggregations" BOOLEAN NOT NULL DEFAULT false,
    "aggregationFields" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "sharedWith" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isScheduled" BOOLEAN NOT NULL DEFAULT false,
    "scheduleFrequency" TEXT,
    "scheduleCron" TEXT,
    "deliveryMethod" TEXT,
    "deliveryTarget" TEXT,
    "lastDeliveredAt" TIMESTAMP(3),
    "defaultExportFormat" TEXT NOT NULL DEFAULT 'csv',
    "createdBy" TEXT NOT NULL,
    "createdByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningSavedView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DunningJurisdictionConfig" (
    "id" TEXT NOT NULL,
    "jurisdictionId" TEXT NOT NULL,
    "jurisdictionName" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "region" TEXT,
    "statutoryInterestRateB2B" DECIMAL(8,5),
    "statutoryInterestRateB2C" DECIMAL(8,5),
    "interestRateReference" TEXT,
    "flatFeeAllowedB2B" BOOLEAN NOT NULL DEFAULT true,
    "flatFeeAmountB2B" DECIMAL(19,4),
    "flatFeeAllowedB2C" BOOLEAN NOT NULL DEFAULT false,
    "flatFeeAmountB2C" DECIMAL(19,4),
    "maxFeePercentage" DECIMAL(8,5),
    "defaultGracePeriodDays" INTEGER NOT NULL DEFAULT 0,
    "reminderAfterDays" INTEGER NOT NULL DEFAULT 3,
    "level1AfterDays" INTEGER NOT NULL DEFAULT 14,
    "level2AfterDays" INTEGER NOT NULL DEFAULT 30,
    "level3MinDays" INTEGER NOT NULL DEFAULT 45,
    "requiresWrittenNotice" BOOLEAN NOT NULL DEFAULT false,
    "requiresRegisteredMail" BOOLEAN NOT NULL DEFAULT false,
    "formalRequirements" JSONB,
    "defaultLanguage" TEXT NOT NULL DEFAULT 'en',
    "supportedLanguages" TEXT[] DEFAULT ARRAY['en']::TEXT[],
    "defaultToneReminder" TEXT NOT NULL DEFAULT 'friendly',
    "defaultToneLevel1" TEXT NOT NULL DEFAULT 'formal',
    "defaultToneLevel2" TEXT NOT NULL DEFAULT 'firm',
    "defaultToneLevel3" TEXT NOT NULL DEFAULT 'final',
    "consumerProtectionRules" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT NOT NULL,

    CONSTRAINT "DunningJurisdictionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Dunning_dunningId_key" ON "Dunning"("dunningId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_status_idx" ON "Dunning"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_currentLevel_idx" ON "Dunning"("organizationId", "currentLevel");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_daysPastDue_idx" ON "Dunning"("organizationId", "daysPastDue");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_invoiceId_idx" ON "Dunning"("organizationId", "invoiceId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_customerId_idx" ON "Dunning"("organizationId", "customerId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_partyId_idx" ON "Dunning"("organizationId", "partyId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_legalEntityId_idx" ON "Dunning"("organizationId", "legalEntityId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_jurisdictionId_idx" ON "Dunning"("organizationId", "jurisdictionId");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_isDisputed_idx" ON "Dunning"("organizationId", "isDisputed");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_hasActiveProposal_idx" ON "Dunning"("organizationId", "hasActiveProposal");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_invoiceDueDate_idx" ON "Dunning"("organizationId", "invoiceDueDate");

-- CreateIndex
CREATE INDEX "Dunning_organizationId_currency_idx" ON "Dunning"("organizationId", "currency");

-- CreateIndex
CREATE INDEX "Dunning_dunningNumber_idx" ON "Dunning"("dunningNumber");

-- CreateIndex
CREATE UNIQUE INDEX "DunningEvent_eventId_key" ON "DunningEvent"("eventId");

-- CreateIndex
CREATE INDEX "DunningEvent_dunningId_timestamp_idx" ON "DunningEvent"("dunningId", "timestamp");

-- CreateIndex
CREATE INDEX "DunningEvent_dunningId_eventType_idx" ON "DunningEvent"("dunningId", "eventType");

-- CreateIndex
CREATE INDEX "DunningEvent_eventType_timestamp_idx" ON "DunningEvent"("eventType", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "DunningProposal_proposalId_key" ON "DunningProposal"("proposalId");

-- CreateIndex
CREATE INDEX "DunningProposal_organizationId_status_idx" ON "DunningProposal"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DunningProposal_organizationId_proposalType_idx" ON "DunningProposal"("organizationId", "proposalType");

-- CreateIndex
CREATE INDEX "DunningProposal_organizationId_proposalLevel_idx" ON "DunningProposal"("organizationId", "proposalLevel");

-- CreateIndex
CREATE INDEX "DunningProposal_organizationId_confidenceScore_idx" ON "DunningProposal"("organizationId", "confidenceScore");

-- CreateIndex
CREATE INDEX "DunningProposal_dunningId_status_idx" ON "DunningProposal"("dunningId", "status");

-- CreateIndex
CREATE INDEX "DunningProposal_proposedAt_idx" ON "DunningProposal"("proposedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DunningCommunication_communicationId_key" ON "DunningCommunication"("communicationId");

-- CreateIndex
CREATE INDEX "DunningCommunication_organizationId_status_idx" ON "DunningCommunication"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DunningCommunication_organizationId_communicationType_idx" ON "DunningCommunication"("organizationId", "communicationType");

-- CreateIndex
CREATE INDEX "DunningCommunication_dunningId_level_idx" ON "DunningCommunication"("dunningId", "level");

-- CreateIndex
CREATE INDEX "DunningCommunication_sentAt_idx" ON "DunningCommunication"("sentAt");

-- CreateIndex
CREATE UNIQUE INDEX "DunningInterestAccrual_accrualId_key" ON "DunningInterestAccrual"("accrualId");

-- CreateIndex
CREATE INDEX "DunningInterestAccrual_dunningId_periodEnd_idx" ON "DunningInterestAccrual"("dunningId", "periodEnd");

-- CreateIndex
CREATE INDEX "DunningInterestAccrual_status_idx" ON "DunningInterestAccrual"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DunningFee_feeId_key" ON "DunningFee"("feeId");

-- CreateIndex
CREATE INDEX "DunningFee_dunningId_feeType_idx" ON "DunningFee"("dunningId", "feeType");

-- CreateIndex
CREATE INDEX "DunningFee_status_idx" ON "DunningFee"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DunningDisputeRecord_disputeId_key" ON "DunningDisputeRecord"("disputeId");

-- CreateIndex
CREATE INDEX "DunningDisputeRecord_organizationId_status_idx" ON "DunningDisputeRecord"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DunningDisputeRecord_dunningId_status_idx" ON "DunningDisputeRecord"("dunningId", "status");

-- CreateIndex
CREATE INDEX "DunningDisputeRecord_slaDeadline_idx" ON "DunningDisputeRecord"("slaDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "DunningImportBatch_batchNumber_key" ON "DunningImportBatch"("batchNumber");

-- CreateIndex
CREATE INDEX "DunningImportBatch_organizationId_status_idx" ON "DunningImportBatch"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DunningImportBatch_organizationId_startedAt_idx" ON "DunningImportBatch"("organizationId", "startedAt");

-- CreateIndex
CREATE INDEX "DunningAutomationRule_organizationId_isActive_triggerType_idx" ON "DunningAutomationRule"("organizationId", "isActive", "triggerType");

-- CreateIndex
CREATE INDEX "DunningAutomationRule_organizationId_priority_idx" ON "DunningAutomationRule"("organizationId", "priority");

-- CreateIndex
CREATE UNIQUE INDEX "DunningAutomationRule_organizationId_code_key" ON "DunningAutomationRule"("organizationId", "code");

-- CreateIndex
CREATE INDEX "DunningException_organizationId_status_idx" ON "DunningException"("organizationId", "status");

-- CreateIndex
CREATE INDEX "DunningException_organizationId_exceptionType_idx" ON "DunningException"("organizationId", "exceptionType");

-- CreateIndex
CREATE INDEX "DunningException_organizationId_assignedTo_idx" ON "DunningException"("organizationId", "assignedTo");

-- CreateIndex
CREATE INDEX "DunningException_organizationId_slaDeadline_idx" ON "DunningException"("organizationId", "slaDeadline");

-- CreateIndex
CREATE INDEX "DunningException_dunningId_status_idx" ON "DunningException"("dunningId", "status");

-- CreateIndex
CREATE INDEX "DunningTemplate_organizationId_dunningLevel_language_idx" ON "DunningTemplate"("organizationId", "dunningLevel", "language");

-- CreateIndex
CREATE INDEX "DunningTemplate_organizationId_jurisdictionId_language_idx" ON "DunningTemplate"("organizationId", "jurisdictionId", "language");

-- CreateIndex
CREATE INDEX "DunningTemplate_organizationId_isActive_idx" ON "DunningTemplate"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DunningTemplate_organizationId_code_version_key" ON "DunningTemplate"("organizationId", "code", "version");

-- CreateIndex
CREATE INDEX "DunningSavedView_organizationId_createdBy_idx" ON "DunningSavedView"("organizationId", "createdBy");

-- CreateIndex
CREATE INDEX "DunningSavedView_organizationId_isPublic_idx" ON "DunningSavedView"("organizationId", "isPublic");

-- CreateIndex
CREATE INDEX "DunningJurisdictionConfig_organizationId_isActive_idx" ON "DunningJurisdictionConfig"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "DunningJurisdictionConfig_organizationId_jurisdictionId_key" ON "DunningJurisdictionConfig"("organizationId", "jurisdictionId");

-- AddForeignKey
ALTER TABLE "DunningEvent" ADD CONSTRAINT "DunningEvent_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningProposal" ADD CONSTRAINT "DunningProposal_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningCommunication" ADD CONSTRAINT "DunningCommunication_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningInterestAccrual" ADD CONSTRAINT "DunningInterestAccrual_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningFee" ADD CONSTRAINT "DunningFee_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningDisputeRecord" ADD CONSTRAINT "DunningDisputeRecord_dunningId_fkey" FOREIGN KEY ("dunningId") REFERENCES "Dunning"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningImportBatch" ADD CONSTRAINT "DunningImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningAutomationRule" ADD CONSTRAINT "DunningAutomationRule_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningException" ADD CONSTRAINT "DunningException_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningTemplate" ADD CONSTRAINT "DunningTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningSavedView" ADD CONSTRAINT "DunningSavedView_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DunningJurisdictionConfig" ADD CONSTRAINT "DunningJurisdictionConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
