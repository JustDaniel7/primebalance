// =============================================================================
// DUNNING & RECEIVABLES ENFORCEMENT - SEED DATA
// prisma/seed-dunning.ts
// =============================================================================

import {
    DunningStatus,
    DunningLevel,
    DunningEventType,
    CustomerType,
    generateDunningId,
    generateDunningNumber,
    generateEventId,
} from '@/types/dunning';

import 'dotenv/config'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@/generated/prisma/client'
import { Pool } from 'pg'

// Use Pool directly for better connection handling
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
})
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })
// =============================================================================
// SEED FUNCTION
// =============================================================================

export async function seedDunning(organizationId: string, userId: string) {
    console.log('🏦 Seeding Dunning & Receivables Enforcement...');

    // =========================================================================
    // 1. JURISDICTION CONFIGURATIONS (TS Section 10)
    // =========================================================================

    console.log('  📍 Creating jurisdiction configurations...');

    const jurisdictions = [
        {
            jurisdictionId: 'DE',
            jurisdictionName: 'Germany',
            country: 'DE',
            region: 'EU',
            statutoryInterestRateB2B: 0.0912, // 9.12% (Basiszins + 9%)
            statutoryInterestRateB2C: 0.0512, // 5.12% (Basiszins + 5%)
            interestRateReference: 'ECB Base Rate + Margin',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 40.00,
            flatFeeAllowedB2C: false,
            flatFeeAmountB2C: 0,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 3,
            level1AfterDays: 14,
            level2AfterDays: 30,
            level3MinDays: 45,
            requiresWrittenNotice: false,
            requiresRegisteredMail: false,
            formalRequirements: { requiresInvoiceReference: true },
            defaultLanguage: 'de',
            supportedLanguages: ['de', 'en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: { maxCommunicationsPerMonth: 4 },
            isActive: true,
        },
        {
            jurisdictionId: 'AT',
            jurisdictionName: 'Austria',
            country: 'AT',
            region: 'EU',
            statutoryInterestRateB2B: 0.0912,
            statutoryInterestRateB2C: 0.04,
            interestRateReference: 'ECB Base Rate + Margin',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 40.00,
            flatFeeAllowedB2C: false,
            flatFeeAmountB2C: 0,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 7,
            level1AfterDays: 14,
            level2AfterDays: 30,
            level3MinDays: 45,
            requiresWrittenNotice: false,
            requiresRegisteredMail: false,
            formalRequirements: {},
            defaultLanguage: 'de',
            supportedLanguages: ['de', 'en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: {},
            isActive: true,
        },
        {
            jurisdictionId: 'CH',
            jurisdictionName: 'Switzerland',
            country: 'CH',
            region: 'EFTA',
            statutoryInterestRateB2B: 0.05,
            statutoryInterestRateB2C: 0.05,
            interestRateReference: 'SNB Reference Rate',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 50.00,
            flatFeeAllowedB2C: true,
            flatFeeAmountB2C: 20.00,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 10,
            level1AfterDays: 20,
            level2AfterDays: 30,
            level3MinDays: 60,
            requiresWrittenNotice: true,
            requiresRegisteredMail: false,
            formalRequirements: { requiresPaymentSlip: true },
            defaultLanguage: 'de',
            supportedLanguages: ['de', 'fr', 'it', 'en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: {},
            isActive: true,
        },
        {
            jurisdictionId: 'FR',
            jurisdictionName: 'France',
            country: 'FR',
            region: 'EU',
            statutoryInterestRateB2B: 0.1275, // 3x legal rate
            statutoryInterestRateB2C: 0.0425,
            interestRateReference: 'Banque de France Legal Rate',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 40.00,
            flatFeeAllowedB2C: false,
            flatFeeAmountB2C: 0,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 7,
            level1AfterDays: 15,
            level2AfterDays: 30,
            level3MinDays: 45,
            requiresWrittenNotice: true,
            requiresRegisteredMail: true,
            formalRequirements: { requiresMiseEnDemeure: true },
            defaultLanguage: 'fr',
            supportedLanguages: ['fr', 'en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: { requiresMediation: true },
            isActive: true,
        },
        {
            jurisdictionId: 'ES',
            jurisdictionName: 'Spain',
            country: 'ES',
            region: 'EU',
            statutoryInterestRateB2B: 0.08,
            statutoryInterestRateB2C: 0.03,
            interestRateReference: 'ECB + Margin',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 40.00,
            flatFeeAllowedB2C: false,
            flatFeeAmountB2C: 0,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 7,
            level1AfterDays: 15,
            level2AfterDays: 30,
            level3MinDays: 60,
            requiresWrittenNotice: false,
            requiresRegisteredMail: false,
            formalRequirements: {},
            defaultLanguage: 'es',
            supportedLanguages: ['es', 'en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: {},
            isActive: true,
        },
        {
            jurisdictionId: 'GB',
            jurisdictionName: 'United Kingdom',
            country: 'GB',
            region: 'UK',
            statutoryInterestRateB2B: 0.08, // BoE base + 8%
            statutoryInterestRateB2C: 0.08,
            interestRateReference: 'Bank of England Base Rate + 8%',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 100.00, // £100 for debts over £10k
            flatFeeAllowedB2C: true,
            flatFeeAmountB2C: 40.00,
            maxFeePercentage: null,
            defaultGracePeriodDays: 0,
            reminderAfterDays: 7,
            level1AfterDays: 14,
            level2AfterDays: 28,
            level3MinDays: 42,
            requiresWrittenNotice: false,
            requiresRegisteredMail: false,
            formalRequirements: {},
            defaultLanguage: 'en',
            supportedLanguages: ['en'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: { preActionProtocol: true },
            isActive: true,
        },
        {
            jurisdictionId: 'US',
            jurisdictionName: 'United States',
            country: 'US',
            region: 'NA',
            statutoryInterestRateB2B: 0.10, // Varies by state
            statutoryInterestRateB2C: 0.06,
            interestRateReference: 'State-specific',
            flatFeeAllowedB2B: true,
            flatFeeAmountB2B: 0, // Varies
            flatFeeAllowedB2C: false,
            flatFeeAmountB2C: 0,
            maxFeePercentage: 0.25, // 25% cap in some states
            defaultGracePeriodDays: 30,
            reminderAfterDays: 15,
            level1AfterDays: 30,
            level2AfterDays: 60,
            level3MinDays: 90,
            requiresWrittenNotice: true,
            requiresRegisteredMail: false,
            formalRequirements: { fdcpaCompliance: true },
            defaultLanguage: 'en',
            supportedLanguages: ['en', 'es'],
            defaultToneReminder: 'friendly',
            defaultToneLevel1: 'formal',
            defaultToneLevel2: 'firm',
            defaultToneLevel3: 'final',
            consumerProtectionRules: { fdcpaRequired: true, miniMirandaRequired: true },
            isActive: true,
        },
    ];

    for (const jurisdiction of jurisdictions) {
        await (prisma as any).dunningJurisdictionConfig.upsert({
            where: {
                organizationId_jurisdictionId: {
                    organizationId,
                    jurisdictionId: jurisdiction.jurisdictionId,
                },
            },
            update: jurisdiction,
            create: { ...jurisdiction, organizationId },
        });
    }

    console.log(`    ✓ Created ${jurisdictions.length} jurisdiction configurations`);

    // =========================================================================
    // 2. TEMPLATES (TS Section 12.3)
    // =========================================================================

    console.log('  📝 Creating dunning templates...');

    const templates = [
        // REMINDER - German
        {
            code: 'REMINDER_DE',
            name: 'Payment Reminder (German)',
            dunningLevel: DunningLevel.REMINDER,
            templateType: 'email',
            jurisdictionId: 'DE',
            language: 'de',
            subject: 'Freundliche Zahlungserinnerung - Rechnung {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Sehr geehrte(r) {{customer_name}},</p>

<p>wir möchten Sie freundlich daran erinnern, dass die folgende Rechnung noch offen ist:</p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Rechnungsnummer:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Fälligkeitsdatum:</strong></td><td>{{invoice_due_date}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Offener Betrag:</strong></td><td>{{outstanding_amount}}</td></tr>
</table>

<p>Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.</p>

<p>Bei Fragen stehen wir Ihnen gerne zur Verfügung.</p>

<p>Mit freundlichen Grüßen</p>
</body>
</html>`,
            bodyText: `Sehr geehrte(r) {{customer_name}},

wir möchten Sie freundlich daran erinnern, dass die folgende Rechnung noch offen ist:

Rechnungsnummer: {{invoice_number}}
Fälligkeitsdatum: {{invoice_due_date}}
Offener Betrag: {{outstanding_amount}}

Sollte sich Ihre Zahlung mit diesem Schreiben überschnitten haben, betrachten Sie diese Erinnerung bitte als gegenstandslos.

Bei Fragen stehen wir Ihnen gerne zur Verfügung.

Mit freundlichen Grüßen`,
            tone: 'friendly',
            includesInterest: false,
            includesFees: false,
            includesLegalWarning: false,
            availableVariables: ['customer_name', 'invoice_number', 'invoice_due_date', 'outstanding_amount', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount'],
        },
        // REMINDER - English
        {
            code: 'REMINDER_EN',
            name: 'Payment Reminder (English)',
            dunningLevel: DunningLevel.REMINDER,
            templateType: 'email',
            language: 'en',
            subject: 'Friendly Payment Reminder - Invoice {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Dear {{customer_name}},</p>

<p>This is a friendly reminder that the following invoice is still outstanding:</p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Invoice Number:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Due Date:</strong></td><td>{{invoice_due_date}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Outstanding Amount:</strong></td><td>{{outstanding_amount}}</td></tr>
</table>

<p>If you have already made this payment, please disregard this reminder.</p>

<p>Please do not hesitate to contact us if you have any questions.</p>

<p>Kind regards</p>
</body>
</html>`,
            bodyText: `Dear {{customer_name}},

This is a friendly reminder that the following invoice is still outstanding:

Invoice Number: {{invoice_number}}
Due Date: {{invoice_due_date}}
Outstanding Amount: {{outstanding_amount}}

If you have already made this payment, please disregard this reminder.

Please do not hesitate to contact us if you have any questions.

Kind regards`,
            tone: 'friendly',
            includesInterest: false,
            includesFees: false,
            includesLegalWarning: false,
            availableVariables: ['customer_name', 'invoice_number', 'invoice_due_date', 'outstanding_amount', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount'],
        },
        // LEVEL 1 - German
        {
            code: 'LEVEL1_DE',
            name: 'First Dunning Notice (German)',
            dunningLevel: DunningLevel.LEVEL_1,
            templateType: 'email',
            jurisdictionId: 'DE',
            language: 'de',
            subject: '1. Mahnung - Rechnung {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Sehr geehrte(r) {{customer_name}},</p>

<p>trotz unserer Zahlungserinnerung konnten wir leider noch keinen Zahlungseingang für die folgende Rechnung feststellen:</p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Rechnungsnummer:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Fälligkeitsdatum:</strong></td><td>{{invoice_due_date}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Tage überfällig:</strong></td><td>{{days_past_due}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Offener Betrag:</strong></td><td>{{outstanding_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Verzugszinsen:</strong></td><td>{{interest_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0; border-top: 1px solid #000;"><strong>Gesamtbetrag:</strong></td><td style="border-top: 1px solid #000;"><strong>{{total_due}}</strong></td></tr>
</table>

<p>Wir bitten Sie, den ausstehenden Betrag bis zum <strong>{{payment_deadline}}</strong> zu begleichen.</p>

<p>Sollten Sie Fragen haben oder eine Ratenzahlung vereinbaren wollen, kontaktieren Sie uns bitte.</p>

<p>Mit freundlichen Grüßen</p>
</body>
</html>`,
            bodyText: `Sehr geehrte(r) {{customer_name}},

trotz unserer Zahlungserinnerung konnten wir leider noch keinen Zahlungseingang für die folgende Rechnung feststellen:

Rechnungsnummer: {{invoice_number}}
Fälligkeitsdatum: {{invoice_due_date}}
Tage überfällig: {{days_past_due}}
Offener Betrag: {{outstanding_amount}}
Verzugszinsen: {{interest_amount}}
Gesamtbetrag: {{total_due}}

Wir bitten Sie, den ausstehenden Betrag bis zum {{payment_deadline}} zu begleichen.

Sollten Sie Fragen haben oder eine Ratenzahlung vereinbaren wollen, kontaktieren Sie uns bitte.

Mit freundlichen Grüßen`,
            tone: 'formal',
            includesInterest: true,
            includesFees: false,
            includesLegalWarning: false,
            availableVariables: ['customer_name', 'invoice_number', 'invoice_due_date', 'days_past_due', 'outstanding_amount', 'interest_amount', 'total_due', 'payment_deadline', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount', 'total_due', 'payment_deadline'],
        },
        // LEVEL 1 - English
        {
            code: 'LEVEL1_EN',
            name: 'First Dunning Notice (English)',
            dunningLevel: DunningLevel.LEVEL_1,
            templateType: 'email',
            language: 'en',
            subject: 'First Payment Notice - Invoice {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Dear {{customer_name}},</p>

<p>Despite our previous reminder, we have not yet received payment for the following invoice:</p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Invoice Number:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Due Date:</strong></td><td>{{invoice_due_date}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Days Overdue:</strong></td><td>{{days_past_due}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Outstanding Amount:</strong></td><td>{{outstanding_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Interest:</strong></td><td>{{interest_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0; border-top: 1px solid #000;"><strong>Total Due:</strong></td><td style="border-top: 1px solid #000;"><strong>{{total_due}}</strong></td></tr>
</table>

<p>Please arrange payment by <strong>{{payment_deadline}}</strong>.</p>

<p>If you have any questions or would like to discuss payment arrangements, please contact us.</p>

<p>Yours sincerely</p>
</body>
</html>`,
            bodyText: `Dear {{customer_name}},

Despite our previous reminder, we have not yet received payment for the following invoice:

Invoice Number: {{invoice_number}}
Due Date: {{invoice_due_date}}
Days Overdue: {{days_past_due}}
Outstanding Amount: {{outstanding_amount}}
Interest: {{interest_amount}}
Total Due: {{total_due}}

Please arrange payment by {{payment_deadline}}.

If you have any questions or would like to discuss payment arrangements, please contact us.

Yours sincerely`,
            tone: 'formal',
            includesInterest: true,
            includesFees: false,
            includesLegalWarning: false,
            availableVariables: ['customer_name', 'invoice_number', 'invoice_due_date', 'days_past_due', 'outstanding_amount', 'interest_amount', 'total_due', 'payment_deadline', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount', 'total_due', 'payment_deadline'],
        },
        // LEVEL 2 - German
        {
            code: 'LEVEL2_DE',
            name: 'Second Dunning Notice (German)',
            dunningLevel: DunningLevel.LEVEL_2,
            templateType: 'email',
            jurisdictionId: 'DE',
            language: 'de',
            subject: '2. Mahnung - Dringende Zahlungsaufforderung - Rechnung {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Sehr geehrte(r) {{customer_name}},</p>

<p><strong>trotz unserer vorherigen Mahnungen ist die folgende Rechnung weiterhin unbezahlt:</strong></p>

<table style="border-collapse: collapse; margin: 20px 0;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Rechnungsnummer:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Ursprünglicher Betrag:</strong></td><td>{{original_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Tage überfällig:</strong></td><td>{{days_past_due}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Offener Betrag:</strong></td><td>{{outstanding_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Verzugszinsen:</strong></td><td>{{interest_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Mahngebühren:</strong></td><td>{{fees_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0; border-top: 2px solid #000;"><strong>Gesamtbetrag:</strong></td><td style="border-top: 2px solid #000;"><strong>{{total_due}}</strong></td></tr>
</table>

<p>Wir fordern Sie hiermit letztmalig auf, den Gesamtbetrag bis zum <strong>{{payment_deadline}}</strong> zu begleichen.</p>

<p style="color: #c00;"><strong>Sollte die Zahlung nicht fristgerecht eingehen, behalten wir uns vor, rechtliche Schritte einzuleiten und die Forderung an ein Inkassounternehmen zu übergeben.</strong></p>

<p>Mit freundlichen Grüßen</p>
</body>
</html>`,
            bodyText: `Sehr geehrte(r) {{customer_name}},

TROTZ UNSERER VORHERIGEN MAHNUNGEN IST DIE FOLGENDE RECHNUNG WEITERHIN UNBEZAHLT:

Rechnungsnummer: {{invoice_number}}
Ursprünglicher Betrag: {{original_amount}}
Tage überfällig: {{days_past_due}}
Offener Betrag: {{outstanding_amount}}
Verzugszinsen: {{interest_amount}}
Mahngebühren: {{fees_amount}}
Gesamtbetrag: {{total_due}}

Wir fordern Sie hiermit letztmalig auf, den Gesamtbetrag bis zum {{payment_deadline}} zu begleichen.

SOLLTE DIE ZAHLUNG NICHT FRISTGERECHT EINGEHEN, BEHALTEN WIR UNS VOR, RECHTLICHE SCHRITTE EINZULEITEN UND DIE FORDERUNG AN EIN INKASSOUNTERNEHMEN ZU ÜBERGEBEN.

Mit freundlichen Grüßen`,
            tone: 'firm',
            includesInterest: true,
            includesFees: true,
            includesLegalWarning: true,
            legalDisclaimer: 'Gemäß § 286 BGB befinden Sie sich im Zahlungsverzug.',
            availableVariables: ['customer_name', 'invoice_number', 'original_amount', 'days_past_due', 'outstanding_amount', 'interest_amount', 'fees_amount', 'total_due', 'payment_deadline', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount', 'total_due', 'payment_deadline'],
        },
        // LEVEL 3 - German
        {
            code: 'LEVEL3_DE',
            name: 'Final Notice Before Legal Action (German)',
            dunningLevel: DunningLevel.LEVEL_3,
            templateType: 'email',
            jurisdictionId: 'DE',
            language: 'de',
            subject: 'LETZTE MAHNUNG VOR GERICHTLICHEM MAHNVERFAHREN - Rechnung {{invoice_number}}',
            bodyHtml: `
<html>
<body style="font-family: Arial, sans-serif;">
<p>Sehr geehrte(r) {{customer_name}},</p>

<p style="color: #c00; font-weight: bold;">LETZTE MAHNUNG VOR EINLEITUNG DES GERICHTLICHEN MAHNVERFAHRENS</p>

<p>Trotz mehrfacher Mahnungen ist die folgende Forderung weiterhin offen:</p>

<table style="border-collapse: collapse; margin: 20px 0; background: #f9f9f9; padding: 15px;">
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Rechnungsnummer:</strong></td><td>{{invoice_number}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Ursprünglicher Betrag:</strong></td><td>{{original_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Tage überfällig:</strong></td><td>{{days_past_due}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Offener Betrag:</strong></td><td>{{outstanding_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Verzugszinsen:</strong></td><td>{{interest_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0;"><strong>Mahngebühren & Kosten:</strong></td><td>{{fees_amount}}</td></tr>
  <tr><td style="padding: 5px 15px 5px 0; border-top: 2px solid #c00;"><strong style="color: #c00;">GESAMTFORDERUNG:</strong></td><td style="border-top: 2px solid #c00;"><strong style="color: #c00;">{{total_due}}</strong></td></tr>
</table>

<p><strong>Wir setzen Ihnen hiermit eine letzte Frist bis zum {{payment_deadline}}.</strong></p>

<p style="border: 2px solid #c00; padding: 15px; background: #fff0f0;">
<strong>HINWEIS:</strong> Sollte der Gesamtbetrag nicht bis zum genannten Datum auf unserem Konto eingegangen sein, werden wir ohne weitere Ankündigung:
<ul>
<li>Das gerichtliche Mahnverfahren einleiten</li>
<li>Die Forderung an ein Inkassounternehmen übergeben</li>
<li>Alle weiteren entstehenden Kosten (Gerichtskosten, Anwaltskosten, Inkassokosten) in Rechnung stellen</li>
</ul>
</p>

<p>Mit freundlichen Grüßen</p>
</body>
</html>`,
            bodyText: `Sehr geehrte(r) {{customer_name}},

*** LETZTE MAHNUNG VOR EINLEITUNG DES GERICHTLICHEN MAHNVERFAHRENS ***

Trotz mehrfacher Mahnungen ist die folgende Forderung weiterhin offen:

Rechnungsnummer: {{invoice_number}}
Ursprünglicher Betrag: {{original_amount}}
Tage überfällig: {{days_past_due}}
Offener Betrag: {{outstanding_amount}}
Verzugszinsen: {{interest_amount}}
Mahngebühren & Kosten: {{fees_amount}}
GESAMTFORDERUNG: {{total_due}}

Wir setzen Ihnen hiermit eine letzte Frist bis zum {{payment_deadline}}.

HINWEIS: Sollte der Gesamtbetrag nicht bis zum genannten Datum auf unserem Konto eingegangen sein, werden wir ohne weitere Ankündigung:
- Das gerichtliche Mahnverfahren einleiten
- Die Forderung an ein Inkassounternehmen übergeben
- Alle weiteren entstehenden Kosten in Rechnung stellen

Mit freundlichen Grüßen`,
            tone: 'final',
            includesInterest: true,
            includesFees: true,
            includesLegalWarning: true,
            legalDisclaimer: 'Diese Mahnung erfolgt unter Vorbehalt aller Rechte. Gemäß §§ 286, 288 BGB.',
            availableVariables: ['customer_name', 'invoice_number', 'original_amount', 'days_past_due', 'outstanding_amount', 'interest_amount', 'fees_amount', 'total_due', 'payment_deadline', 'currency', 'current_date'],
            requiredVariables: ['customer_name', 'invoice_number', 'outstanding_amount', 'total_due', 'payment_deadline'],
        },
    ];

    for (const template of templates) {
        await (prisma as any).dunningTemplate.upsert({
            where: {
                organizationId_code_language_version: {
                    organizationId,
                    code: template.code,
                    language: template.language,
                    version: 1,
                },
            },
            update: template,
            create: { ...template, version: 1, isActive: true, createdBy: userId, organizationId },
        });
    }

    console.log(`    ✓ Created ${templates.length} templates`);

    // =========================================================================
    // 3. AUTOMATION RULES (TS Section 9)
    // =========================================================================

    console.log('  ⚙️ Creating automation rules...');

    const automationRules = [
        {
            code: 'AUTO_REMINDER',
            name: 'Automatic Payment Reminder',
            description: 'Automatically propose payment reminders for invoices 3+ days overdue',
            triggerType: 'scheduled',
            schedule: '0 8 * * 1-5', // 8 AM Mon-Fri
            dunningLevels: [DunningLevel.REMINDER],
            customerTypes: [CustomerType.B2B, CustomerType.CONSUMER],
            jurisdictions: [],
            invoiceAmountMin: 50,
            invoiceAmountMax: null,
            reminderDaysAfterDue: 3,
            level1DaysAfterDue: 14,
            level2DaysAfterDue: 30,
            minimumIntervalDays: 7,
            actionType: 'propose',
            actionConfig: { includeInterest: false, includeFees: false },
            confidenceThreshold: 0.95,
            proposalThreshold: 0.70,
            requiresApproval: true,
            approverRoles: ['finance', 'admin'],
            multiSignatureRequired: false,
            multiSignatureCount: 1,
            explanationTemplate: 'Auto-proposed reminder for invoice {{invoice_number}}. Days overdue: {{days_past_due}}.',
            isActive: true,
            priority: 100,
        },
        {
            code: 'AUTO_LEVEL1',
            name: 'Automatic Level 1 Dunning',
            description: 'Automatically propose Level 1 dunning for invoices 14+ days overdue after reminder sent',
            triggerType: 'scheduled',
            schedule: '0 9 * * 1-5', // 9 AM Mon-Fri
            dunningLevels: [DunningLevel.LEVEL_1],
            customerTypes: [CustomerType.B2B, CustomerType.CONSUMER],
            jurisdictions: [],
            invoiceAmountMin: 100,
            invoiceAmountMax: null,
            reminderDaysAfterDue: 3,
            level1DaysAfterDue: 14,
            level2DaysAfterDue: 30,
            minimumIntervalDays: 7,
            actionType: 'propose',
            actionConfig: { includeInterest: true, includeFees: false },
            confidenceThreshold: 0.95,
            proposalThreshold: 0.70,
            requiresApproval: true,
            approverRoles: ['finance', 'admin'],
            multiSignatureRequired: false,
            multiSignatureCount: 1,
            explanationTemplate: 'Auto-proposed Level 1 dunning for invoice {{invoice_number}}. Interest calculated at statutory rate.',
            isActive: true,
            priority: 200,
        },
        {
            code: 'AUTO_LEVEL2',
            name: 'Automatic Level 2 Dunning',
            description: 'Automatically propose Level 2 dunning for invoices 30+ days overdue after Level 1 sent',
            triggerType: 'scheduled',
            schedule: '0 10 * * 1-5', // 10 AM Mon-Fri
            dunningLevels: [DunningLevel.LEVEL_2],
            customerTypes: [CustomerType.B2B],
            jurisdictions: [],
            invoiceAmountMin: 500,
            invoiceAmountMax: null,
            reminderDaysAfterDue: 3,
            level1DaysAfterDue: 14,
            level2DaysAfterDue: 30,
            minimumIntervalDays: 7,
            actionType: 'propose',
            actionConfig: { includeInterest: true, includeFees: true },
            confidenceThreshold: 0.95,
            proposalThreshold: 0.70,
            requiresApproval: true,
            approverRoles: ['finance', 'admin', 'legal'],
            multiSignatureRequired: false,
            multiSignatureCount: 1,
            explanationTemplate: 'Auto-proposed Level 2 dunning for invoice {{invoice_number}}. Full interest and fees applied.',
            isActive: true,
            priority: 300,
        },
        {
            code: 'LEVEL3_APPROVAL',
            name: 'Level 3 Multi-Signature Approval',
            description: 'Level 3 dunning requires multi-signature approval (NEVER auto-proposed)',
            triggerType: 'manual',
            dunningLevels: [DunningLevel.LEVEL_3],
            customerTypes: [CustomerType.B2B],
            jurisdictions: [],
            invoiceAmountMin: 1000,
            invoiceAmountMax: null,
            reminderDaysAfterDue: 3,
            level1DaysAfterDue: 14,
            level2DaysAfterDue: 30,
            minimumIntervalDays: 14,
            actionType: 'propose',
            actionConfig: { includeInterest: true, includeFees: true, includeCosts: true },
            confidenceThreshold: 1.0,
            proposalThreshold: 1.0,
            requiresApproval: true,
            approverRoles: ['finance_manager', 'legal', 'cfo'],
            multiSignatureRequired: true,
            multiSignatureCount: 2,
            explanationTemplate: 'Level 3 dunning manually initiated. Requires {{signature_count}} approvals before sending.',
            isActive: true,
            priority: 400,
        },
    ];

    for (const rule of automationRules) {
        await (prisma as any).dunningAutomationRule.upsert({
            where: {
                organizationId_code: {
                    organizationId,
                    code: rule.code,
                },
            },
            update: rule,
            create: { ...rule, executionCount: 0, successCount: 0, failureCount: 0, createdBy: userId, organizationId },
        });
    }

    console.log(`    ✓ Created ${automationRules.length} automation rules`);

    // =========================================================================
    // 4. SAMPLE DUNNING RECORDS
    // =========================================================================

    console.log('  💰 Creating sample dunning records...');

    const now = new Date();
    const sampleDunnings = [
        {
            invoiceId: 'INV-2025-0001',
            customerId: 'CUST-001',
            customerName: 'Müller GmbH',
            customerType: CustomerType.B2B,
            customerJurisdiction: 'DE',
            customerLanguage: 'de',
            jurisdictionId: 'DE',
            currency: 'EUR',
            originalAmount: 15000.00,
            outstandingAmount: 15000.00,
            invoiceDueDate: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
            daysPastDue: 45,
            status: DunningStatus.DUNNING_LEVEL2_SENT,
            currentLevel: DunningLevel.LEVEL_2,
        },
        {
            invoiceId: 'INV-2025-0002',
            customerId: 'CUST-002',
            customerName: 'Schmidt & Partner KG',
            customerType: CustomerType.B2B,
            customerJurisdiction: 'DE',
            customerLanguage: 'de',
            jurisdictionId: 'DE',
            currency: 'EUR',
            originalAmount: 8500.00,
            outstandingAmount: 8500.00,
            invoiceDueDate: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
            daysPastDue: 20,
            status: DunningStatus.DUNNING_LEVEL1_SENT,
            currentLevel: DunningLevel.LEVEL_1,
        },
        {
            invoiceId: 'INV-2025-0003',
            customerId: 'CUST-003',
            customerName: 'Weber Consulting AG',
            customerType: CustomerType.B2B,
            customerJurisdiction: 'CH',
            customerLanguage: 'de',
            jurisdictionId: 'CH',
            currency: 'CHF',
            originalAmount: 25000.00,
            outstandingAmount: 25000.00,
            invoiceDueDate: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
            daysPastDue: 10,
            status: DunningStatus.REMINDER_SENT,
            currentLevel: DunningLevel.REMINDER,
        },
        {
            invoiceId: 'INV-2025-0004',
            customerId: 'CUST-004',
            customerName: 'Tech Solutions Ltd',
            customerType: CustomerType.B2B,
            customerJurisdiction: 'GB',
            customerLanguage: 'en',
            jurisdictionId: 'GB',
            currency: 'GBP',
            originalAmount: 12000.00,
            outstandingAmount: 12000.00,
            invoiceDueDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            daysPastDue: 5,
            status: DunningStatus.OVERDUE,
            currentLevel: DunningLevel.NONE,
        },
        {
            invoiceId: 'INV-2025-0005',
            customerId: 'CUST-005',
            customerName: 'Dubois SARL',
            customerType: CustomerType.B2B,
            customerJurisdiction: 'FR',
            customerLanguage: 'fr',
            jurisdictionId: 'FR',
            currency: 'EUR',
            originalAmount: 18000.00,
            outstandingAmount: 5000.00,
            invoiceDueDate: new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
            daysPastDue: 60,
            status: DunningStatus.DISPUTED,
            currentLevel: DunningLevel.LEVEL_2,
            isDisputed: true,
        },
    ];

    let sequence = 1;
    for (const dunningData of sampleDunnings) {
        const dunningId = generateDunningId(organizationId, dunningData.invoiceId, now);
        const dunningNumber = generateDunningNumber(dunningData.jurisdictionId, sequence++, now.getFullYear());

        const dunning = await (prisma as any).dunning.create({
            data: {
                dunningId,
                dunningNumber,
                ...dunningData,
                reportingCurrency: 'EUR',
                interestAccrued: dunningData.daysPastDue > 14 ? dunningData.outstandingAmount * 0.0912 * (dunningData.daysPastDue / 365) : 0,
                feesAccrued: dunningData.currentLevel >= DunningLevel.LEVEL_2 ? 40 : 0,
                totalDue: dunningData.outstandingAmount +
                    (dunningData.daysPastDue > 14 ? dunningData.outstandingAmount * 0.0912 * (dunningData.daysPastDue / 365) : 0) +
                    (dunningData.currentLevel >= DunningLevel.LEVEL_2 ? 40 : 0),
                hasActiveProposal: false,
                gracePeriodDays: 0,
                validationMode: 'hard',
                confidenceScore: 1.0,
                verificationStatus: 'verified',
                dataSourcesChecked: ['invoices', 'payments', 'customers'],
                locale: 'de-DE',
                language: dunningData.customerLanguage,
                version: 1,
                eventCount: 1,
                communicationCount: dunningData.currentLevel,
                tags: [],
                systemTags: ['seed_data'],
                createdBy: userId,
                organizationId,
            },
        });

        // Create initial event
        const eventId = generateEventId(dunningId, DunningEventType.DUNNING_CREATED, now);
        await (prisma as any).dunningEvent.create({
            data: {
                eventId,
                dunningId: dunning.id,
                eventType: DunningEventType.DUNNING_CREATED,
                timestamp: new Date(now.getTime() - dunningData.daysPastDue * 24 * 60 * 60 * 1000),
                actorId: userId,
                actorName: 'System',
                actorType: 'system',
                payload: { invoiceId: dunningData.invoiceId, amount: dunningData.originalAmount },
                explanation: `Dunning record created for invoice ${dunningData.invoiceId}`,
            },
        });

        await (prisma as any).dunning.update({
            where: { id: dunning.id },
            data: { lastEventId: eventId },
        });
    }

    console.log(`    ✓ Created ${sampleDunnings.length} sample dunning records`);

    console.log('✅ Dunning & Receivables Enforcement seeding complete!');
}

// =============================================================================
// STANDALONE EXECUTION
// =============================================================================

async function main() {
    // Get or create organization
    let org = await prisma.organization.findFirst();
    if (!org) {
        org = await prisma.organization.create({
            data: {
                name: 'PrimeBalance Demo',
                slug: 'primebalance-demo',
            },
        });
    }

    // Get or create user
    let user = await prisma.user.findFirst({ where: { organizationId: org.id } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'admin@primebalance.com',
                name: 'System Admin',
                organizationId: org.id,
            },
        });
    }

    await seedDunning(org.id, user.id);
}

main()
    .catch((e) => {
        console.error('Seed error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
