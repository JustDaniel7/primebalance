import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// =============================================================================
// TYPES
// =============================================================================

export type ThemeMode = 'light' | 'dark' | 'system';
export type AccentColor = 'emerald' | 'blue' | 'violet' | 'rose' | 'amber' | 'cyan' | 'orange';
export type SidebarMode = 'expanded' | 'collapsed' | 'autohide';
export type Language = 'en' | 'de' | 'es' | 'fr';

export interface AccentColorConfig {
  name: string;
  value: AccentColor;
  primary: string;
  primaryHover: string;
  primaryLight: string;
  gradient: string;
}

export interface LanguageConfig {
  code: Language;
  name: string;
  nativeName: string;
  flag: string;
}

// =============================================================================
// LANGUAGE CONFIGURATIONS
// =============================================================================

export const languages: LanguageConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
];

// =============================================================================
// TRANSLATIONS
// =============================================================================

export const translations: Record<Language, Record<string, string>> = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.transactions': 'Transactions',
    'nav.accounts': 'Accounts',
    'nav.wallet': 'Wallet',
    'nav.receipts': 'Receipts',
    'nav.reports': 'Reports',
    'nav.taxCenter': 'Tax Center',
    'nav.aiAssistant': 'AI Assistant',
    'nav.teamChat': 'Team Chat',
    'nav.settings': 'Settings',
    'nav.main': 'Main',
    'nav.tools': 'Tools',
    
    // Common
    'common.user': 'User',
    'common.organization': 'Organization',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.add': 'Add',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    'common.import': 'Import',
    'common.all': 'All',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.amount': 'Amount',
    'common.type': 'Type',
    'common.category': 'Category',
    'common.description': 'Description',
    'common.actions': 'Actions',
    'common.view': 'View',
    'common.download': 'Download',
    'common.upload': 'Upload',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.error': 'An error occurred',
    'common.success': 'Success',
    'common.warning': 'Warning',
    'common.info': 'Information',
    'common.confirm': 'Confirm',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.today': 'Today',
    'common.yesterday': 'Yesterday',
    'common.thisWeek': 'This Week',
    'common.thisMonth': 'This Month',
    'common.thisYear': 'This Year',
    'common.custom': 'Custom',
    'common.from': 'From',
    'common.to': 'To',
    'common.total': 'Total',
    'common.balance': 'Balance',
    'common.income': 'Income',
    'common.expense': 'Expense',
    'common.profit': 'Profit',
    'common.loss': 'Loss',
    'common.viewAll': 'View All',
    
    // Settings
    'settings.title': 'Settings',
    'settings.subtitle': 'Manage your account and preferences',
    'settings.save': 'Save Changes',
    'settings.saved': 'Saved!',
    
    // Settings Tabs
    'settings.tabs.profile': 'Profile',
    'settings.tabs.organization': 'Organization',
    'settings.tabs.notifications': 'Notifications',
    'settings.tabs.security': 'Security',
    'settings.tabs.billing': 'Billing',
    'settings.tabs.integrations': 'Integrations',
    'settings.tabs.appearance': 'Appearance',
    
    // Appearance
    'appearance.theme': 'Theme',
    'appearance.themeDesc': 'Choose how PrimeBalance looks to you',
    'appearance.light': 'Light',
    'appearance.lightDesc': 'Light background with dark text',
    'appearance.dark': 'Dark',
    'appearance.darkDesc': 'Dark background with light text',
    'appearance.system': 'System',
    'appearance.systemDesc': 'Match your system settings',
    'appearance.accentColor': 'Accent Color',
    'appearance.accentColorDesc': 'Select your preferred accent color',
    'appearance.sidebar': 'Sidebar',
    'appearance.sidebarDesc': 'Choose how the sidebar behaves',
    'appearance.expanded': 'Expanded',
    'appearance.expandedDesc': 'Full sidebar with labels',
    'appearance.collapsed': 'Collapsed',
    'appearance.collapsedDesc': 'Compact icons only',
    'appearance.autohide': 'Auto-hide',
    'appearance.autohideDesc': 'Show on hover',
    'appearance.language': 'Language',
    'appearance.languageDesc': 'Select your preferred language',
    'appearance.preview': 'Preview',
    'appearance.currentSettings': 'Current Settings',
    'appearance.primaryButton': 'Primary Button',
    'appearance.secondary': 'Secondary',
    
    // Profile
    'profile.personalInfo': 'Personal Information',
    'profile.firstName': 'First Name',
    'profile.lastName': 'Last Name',
    'profile.email': 'Email',
    'profile.phone': 'Phone Number',
    'profile.timezone': 'Timezone',
    
    // Organization
    'org.details': 'Organization Details',
    'org.companyName': 'Company Name',
    'org.industry': 'Industry',
    'org.companySize': 'Company Size',
    
    // Notifications
    'notifications.preferences': 'Notification Preferences',
    'notifications.transactionAlerts': 'Transaction alerts',
    'notifications.transactionAlertsDesc': 'Get notified for all transactions',
    'notifications.weeklyReports': 'Weekly reports',
    'notifications.weeklyReportsDesc': 'Receive weekly financial summary',
    'notifications.taxReminders': 'Tax reminders',
    'notifications.taxRemindersDesc': 'Upcoming tax deadlines',
    'notifications.teamUpdates': 'Team updates',
    'notifications.teamUpdatesDesc': 'When team members make changes',
    
    // Security
    'security.password': 'Password',
    'security.currentPassword': 'Current Password',
    'security.newPassword': 'New Password',
    'security.confirmPassword': 'Confirm Password',
    'security.twoFactor': 'Two-Factor Authentication',
    'security.authenticatorApp': 'Authenticator App',
    'security.authenticatorAppDesc': 'Use an app to generate codes',
    'security.enable': 'Enable',
    
    // Billing
    'billing.currentPlan': 'Current Plan',
    'billing.professionalPlan': 'Professional Plan',
    'billing.upgrade': 'Upgrade',
    'billing.paymentMethod': 'Payment Method',
    'billing.update': 'Update',
    
    // Integrations
    'integrations.connectedServices': 'Connected Services',
    'integrations.connected': 'Connected',
    'integrations.connect': 'Connect',
    
    // Header
    'header.search': 'Search transactions, accounts, reports...',
    'header.newTransaction': 'New Transaction',
    'header.new': 'New',
    'header.notifications': 'Notifications',
    'header.markAllRead': 'Mark all read',
    'header.viewAll': 'View all notifications',
    'header.profileSettings': 'Profile Settings',
    'header.accountSettings': 'Account Settings',
    'header.billingReports': 'Billing & Reports',
    'header.signOut': 'Sign out',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Welcome back! Here\'s your financial overview.',
    'dashboard.totalBalance': 'Total Balance',
    'dashboard.monthlyIncome': 'Monthly Income',
    'dashboard.monthlyExpenses': 'Monthly Expenses',
    'dashboard.pendingInvoices': 'Pending Invoices',
    'dashboard.vsLastMonth': 'vs last month',
    'dashboard.recentTransactions': 'Recent Transactions',
    'dashboard.viewAll': 'View All',
    'dashboard.aiInsights': 'AI Insights',
    'dashboard.cashFlow': 'Cash Flow',
    'dashboard.expenseBreakdown': 'Expense Breakdown',
    'dashboard.last30Days': 'Last 30 days',
    'dashboard.askAI': 'Ask AI about your finances...',
    
    // Transactions
    'transactions.title': 'Transactions',
    'transactions.subtitle': 'View and manage all your financial transactions',
    'transactions.addTransaction': 'Add Transaction',
    'transactions.filterBy': 'Filter by',
    'transactions.sortBy': 'Sort by',
    'transactions.dateRange': 'Date Range',
    'transactions.allCategories': 'All Categories',
    'transactions.allAccounts': 'All Accounts',
    'transactions.income': 'Income',
    'transactions.expense': 'Expense',
    'transactions.transfer': 'Transfer',
    'transactions.pending': 'Pending',
    'transactions.completed': 'Completed',
    'transactions.failed': 'Failed',
    'transactions.noTransactions': 'No transactions found',
    'transactions.searchTransactions': 'Search transactions...',
    
    // Accounts
    'accounts.title': 'Accounts',
    'accounts.subtitle': 'Manage your financial accounts and connections',
    'accounts.addAccount': 'Add Account',
    'accounts.totalBalance': 'Total Balance',
    'accounts.bankAccounts': 'Bank Accounts',
    'accounts.creditCards': 'Credit Cards',
    'accounts.investments': 'Investments',
    'accounts.crypto': 'Crypto Wallets',
    'accounts.lastSync': 'Last synced',
    'accounts.sync': 'Sync',
    'accounts.connected': 'Connected',
    'accounts.disconnected': 'Disconnected',
    'accounts.connectBank': 'Connect Bank',
    'accounts.manualAccount': 'Manual Account',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.subtitle': 'Manage your crypto assets and DeFi portfolio',
    'wallet.connectWallet': 'Connect Wallet',
    'wallet.totalValue': 'Total Portfolio Value',
    'wallet.assets': 'Assets',
    'wallet.nfts': 'NFTs',
    'wallet.defi': 'DeFi Positions',
    'wallet.history': 'Transaction History',
    'wallet.send': 'Send',
    'wallet.receive': 'Receive',
    'wallet.swap': 'Swap',
    'wallet.stake': 'Stake',
    'wallet.noWallet': 'No wallet connected',
    'wallet.connectPrompt': 'Connect your wallet to view your crypto portfolio',
    
    // Receipts
    'receipts.title': 'Receipts',
    'receipts.subtitle': 'Scan, organize, and manage your receipts',
    'receipts.uploadReceipt': 'Upload Receipt',
    'receipts.scanReceipt': 'Scan Receipt',
    'receipts.allReceipts': 'All Receipts',
    'receipts.unmatched': 'Unmatched',
    'receipts.matched': 'Matched',
    'receipts.archived': 'Archived',
    'receipts.dragDrop': 'Drag & drop receipts here or click to upload',
    'receipts.supportedFormats': 'Supported formats: JPG, PNG, PDF',
    'receipts.processing': 'Processing...',
    'receipts.merchant': 'Merchant',
    'receipts.extractedData': 'Extracted Data',
    'receipts.matchTransaction': 'Match to Transaction',
    
    // Reports
    'reports.title': 'Reports',
    'reports.subtitle': 'Generate and analyze financial reports',
    'reports.generateReport': 'Generate Report',
    'reports.profitLoss': 'Profit & Loss',
    'reports.balanceSheet': 'Balance Sheet',
    'reports.cashFlow': 'Cash Flow',
    'reports.taxSummary': 'Tax Summary',
    'reports.expenseReport': 'Expense Report',
    'reports.incomeReport': 'Income Report',
    'reports.customReport': 'Custom Report',
    'reports.dateRange': 'Date Range',
    'reports.exportPDF': 'Export PDF',
    'reports.exportExcel': 'Export Excel',
    'reports.schedule': 'Schedule Report',
    'reports.savedReports': 'Saved Reports',
    
    // Tax Center
    'tax.title': 'Tax Center',
    'tax.subtitle': 'Optimize your tax strategy and track obligations',
    'tax.estimatedTax': 'Estimated Tax',
    'tax.taxSavings': 'Potential Savings',
    'tax.nextDeadline': 'Next Deadline',
    'tax.taxRate': 'Effective Tax Rate',
    'tax.deductions': 'Deductions',
    'tax.credits': 'Tax Credits',
    'tax.jurisdictions': 'Jurisdictions',
    'tax.optimization': 'Tax Optimization',
    'tax.runOptimization': 'Run Optimization',
    'tax.viewRecommendations': 'View Recommendations',
    'tax.corporateStructure': 'Corporate Structure',
    'tax.addEntity': 'Add Entity',
    'tax.entities': 'Entities',
    'tax.connections': 'Connections',
    
    // AI Assistant
    'ai.title': 'AI Assistant',
    'ai.subtitle': 'Get intelligent insights and recommendations',
    'ai.askAnything': 'Ask me anything about your finances...',
    'ai.suggestions': 'Suggested Questions',
    'ai.recentChats': 'Recent Conversations',
    'ai.newChat': 'New Chat',
    'ai.analyzing': 'Analyzing...',
    'ai.thinking': 'Thinking...',
    'ai.suggestion1': 'How can I reduce my tax burden?',
    'ai.suggestion2': 'What are my biggest expenses this month?',
    'ai.suggestion3': 'Show me my cash flow forecast',
    'ai.suggestion4': 'Analyze my spending patterns',
    
    // Team Chat
    'chat.title': 'Team Chat',
    'chat.subtitle': 'Collaborate with your team in real-time',
    'chat.channels': 'Channels',
    'chat.directMessages': 'Direct Messages',
    'chat.newChannel': 'New Channel',
    'chat.newMessage': 'New Message',
    'chat.typeMessage': 'Type a message...',
    'chat.send': 'Send',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.members': 'Members',
    'chat.files': 'Shared Files',
    'chat.search': 'Search messages...',
    
    // Auth
    'auth.login': 'Sign In',
    'auth.register': 'Create Account',
    'auth.email': 'Email Address',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.rememberMe': 'Remember me',
    'auth.noAccount': 'Don\'t have an account?',
    'auth.hasAccount': 'Already have an account?',
    'auth.signUp': 'Sign Up',
    'auth.signIn': 'Sign In',
    'auth.orContinueWith': 'Or continue with',
    'auth.termsAgree': 'By signing up, you agree to our',
    'auth.terms': 'Terms of Service',
    'auth.and': 'and',
    'auth.privacy': 'Privacy Policy',
    'auth.welcomeBack': 'Welcome back',
    'auth.loginSubtitle': 'Enter your credentials to access your account',
    'auth.createAccount': 'Create your account',
    'auth.registerSubtitle': 'Start managing your finances today',
    'auth.firstName': 'First Name',
    'auth.lastName': 'Last Name',
  },
  
  de: {
    // Navigation
    'nav.dashboard': 'Übersicht',
    'nav.transactions': 'Transaktionen',
    'nav.accounts': 'Konten',
    'nav.wallet': 'Wallet',
    'nav.receipts': 'Belege',
    'nav.reports': 'Berichte',
    'nav.taxCenter': 'Steuerzentrale',
    'nav.aiAssistant': 'KI-Assistent',
    'nav.teamChat': 'Team-Chat',
    'nav.settings': 'Einstellungen',
    'nav.main': 'Hauptmenü',
    'nav.tools': 'Werkzeuge',
    
    // Common
    'common.user': 'Benutzer',
    'common.organization': 'Organisation',
    'common.save': 'Speichern',
    'common.cancel': 'Abbrechen',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.add': 'Hinzufügen',
    'common.search': 'Suchen',
    'common.filter': 'Filtern',
    'common.export': 'Exportieren',
    'common.import': 'Importieren',
    'common.all': 'Alle',
    'common.active': 'Aktiv',
    'common.inactive': 'Inaktiv',
    'common.status': 'Status',
    'common.date': 'Datum',
    'common.amount': 'Betrag',
    'common.type': 'Typ',
    'common.category': 'Kategorie',
    'common.description': 'Beschreibung',
    'common.actions': 'Aktionen',
    'common.view': 'Ansehen',
    'common.download': 'Herunterladen',
    'common.upload': 'Hochladen',
    'common.loading': 'Laden...',
    'common.noData': 'Keine Daten verfügbar',
    'common.error': 'Ein Fehler ist aufgetreten',
    'common.success': 'Erfolgreich',
    'common.warning': 'Warnung',
    'common.info': 'Information',
    'common.confirm': 'Bestätigen',
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.previous': 'Vorherige',
    'common.today': 'Heute',
    'common.yesterday': 'Gestern',
    'common.thisWeek': 'Diese Woche',
    'common.thisMonth': 'Diesen Monat',
    'common.thisYear': 'Dieses Jahr',
    'common.custom': 'Benutzerdefiniert',
    'common.from': 'Von',
    'common.to': 'Bis',
    'common.total': 'Gesamt',
    'common.balance': 'Kontostand',
    'common.income': 'Einnahmen',
    'common.expense': 'Ausgaben',
    'common.profit': 'Gewinn',
    'common.loss': 'Verlust',
    'common.viewAll': 'Alle anzeigen',
    
    // Settings
    'settings.title': 'Einstellungen',
    'settings.subtitle': 'Verwalten Sie Ihr Konto und Ihre Präferenzen',
    'settings.save': 'Änderungen speichern',
    'settings.saved': 'Gespeichert!',
    
    // Settings Tabs
    'settings.tabs.profile': 'Profil',
    'settings.tabs.organization': 'Organisation',
    'settings.tabs.notifications': 'Benachrichtigungen',
    'settings.tabs.security': 'Sicherheit',
    'settings.tabs.billing': 'Abrechnung',
    'settings.tabs.integrations': 'Integrationen',
    'settings.tabs.appearance': 'Erscheinungsbild',
    
    // Appearance
    'appearance.theme': 'Design',
    'appearance.themeDesc': 'Wählen Sie das Erscheinungsbild von PrimeBalance',
    'appearance.light': 'Hell',
    'appearance.lightDesc': 'Heller Hintergrund mit dunklem Text',
    'appearance.dark': 'Dunkel',
    'appearance.darkDesc': 'Dunkler Hintergrund mit hellem Text',
    'appearance.system': 'System',
    'appearance.systemDesc': 'Systemeinstellung übernehmen',
    'appearance.accentColor': 'Akzentfarbe',
    'appearance.accentColorDesc': 'Wählen Sie Ihre bevorzugte Akzentfarbe',
    'appearance.sidebar': 'Seitenleiste',
    'appearance.sidebarDesc': 'Wählen Sie das Verhalten der Seitenleiste',
    'appearance.expanded': 'Erweitert',
    'appearance.expandedDesc': 'Volle Seitenleiste mit Beschriftungen',
    'appearance.collapsed': 'Kompakt',
    'appearance.collapsedDesc': 'Nur kompakte Symbole',
    'appearance.autohide': 'Automatisch ausblenden',
    'appearance.autohideDesc': 'Bei Hover anzeigen',
    'appearance.language': 'Sprache',
    'appearance.languageDesc': 'Wählen Sie Ihre bevorzugte Sprache',
    'appearance.preview': 'Vorschau',
    'appearance.currentSettings': 'Aktuelle Einstellungen',
    'appearance.primaryButton': 'Primäre Schaltfläche',
    'appearance.secondary': 'Sekundär',
    
    // Profile
    'profile.personalInfo': 'Persönliche Informationen',
    'profile.firstName': 'Vorname',
    'profile.lastName': 'Nachname',
    'profile.email': 'E-Mail',
    'profile.phone': 'Telefonnummer',
    'profile.timezone': 'Zeitzone',
    
    // Organization
    'org.details': 'Organisationsdetails',
    'org.companyName': 'Firmenname',
    'org.industry': 'Branche',
    'org.companySize': 'Unternehmensgröße',
    
    // Notifications
    'notifications.preferences': 'Benachrichtigungseinstellungen',
    'notifications.transactionAlerts': 'Transaktionsbenachrichtigungen',
    'notifications.transactionAlertsDesc': 'Bei allen Transaktionen benachrichtigen',
    'notifications.weeklyReports': 'Wochenberichte',
    'notifications.weeklyReportsDesc': 'Wöchentliche Finanzzusammenfassung erhalten',
    'notifications.taxReminders': 'Steuererinnerungen',
    'notifications.taxRemindersDesc': 'Anstehende Steuerfristen',
    'notifications.teamUpdates': 'Team-Updates',
    'notifications.teamUpdatesDesc': 'Wenn Teammitglieder Änderungen vornehmen',
    
    // Security
    'security.password': 'Passwort',
    'security.currentPassword': 'Aktuelles Passwort',
    'security.newPassword': 'Neues Passwort',
    'security.confirmPassword': 'Passwort bestätigen',
    'security.twoFactor': 'Zwei-Faktor-Authentifizierung',
    'security.authenticatorApp': 'Authenticator-App',
    'security.authenticatorAppDesc': 'Eine App zur Code-Generierung verwenden',
    'security.enable': 'Aktivieren',
    
    // Billing
    'billing.currentPlan': 'Aktueller Tarif',
    'billing.professionalPlan': 'Professional-Tarif',
    'billing.upgrade': 'Upgrade',
    'billing.paymentMethod': 'Zahlungsmethode',
    'billing.update': 'Aktualisieren',
    
    // Integrations
    'integrations.connectedServices': 'Verbundene Dienste',
    'integrations.connected': 'Verbunden',
    'integrations.connect': 'Verbinden',
    
    // Header
    'header.search': 'Transaktionen, Konten, Berichte suchen...',
    'header.newTransaction': 'Neue Transaktion',
    'header.new': 'Neu',
    'header.notifications': 'Benachrichtigungen',
    'header.markAllRead': 'Alle als gelesen markieren',
    'header.viewAll': 'Alle Benachrichtigungen anzeigen',
    'header.profileSettings': 'Profileinstellungen',
    'header.accountSettings': 'Kontoeinstellungen',
    'header.billingReports': 'Abrechnung & Berichte',
    'header.signOut': 'Abmelden',
    
    // Dashboard
    'dashboard.title': 'Übersicht',
    'dashboard.subtitle': 'Willkommen zurück! Hier ist Ihr Finanzüberblick.',
    'dashboard.totalBalance': 'Gesamtguthaben',
    'dashboard.monthlyIncome': 'Monatliche Einnahmen',
    'dashboard.monthlyExpenses': 'Monatliche Ausgaben',
    'dashboard.pendingInvoices': 'Offene Rechnungen',
    'dashboard.vsLastMonth': 'ggü. Vormonat',
    'dashboard.recentTransactions': 'Letzte Transaktionen',
    'dashboard.viewAll': 'Alle anzeigen',
    'dashboard.aiInsights': 'KI-Einblicke',
    'dashboard.cashFlow': 'Cashflow',
    'dashboard.expenseBreakdown': 'Ausgabenübersicht',
    'dashboard.last30Days': 'Letzte 30 Tage',
    'dashboard.askAI': 'Fragen Sie die KI zu Ihren Finanzen...',
    
    // Transactions
    'transactions.title': 'Transaktionen',
    'transactions.subtitle': 'Alle Finanztransaktionen anzeigen und verwalten',
    'transactions.addTransaction': 'Transaktion hinzufügen',
    'transactions.filterBy': 'Filtern nach',
    'transactions.sortBy': 'Sortieren nach',
    'transactions.dateRange': 'Zeitraum',
    'transactions.allCategories': 'Alle Kategorien',
    'transactions.allAccounts': 'Alle Konten',
    'transactions.income': 'Einnahmen',
    'transactions.expense': 'Ausgaben',
    'transactions.transfer': 'Überweisung',
    'transactions.pending': 'Ausstehend',
    'transactions.completed': 'Abgeschlossen',
    'transactions.failed': 'Fehlgeschlagen',
    'transactions.noTransactions': 'Keine Transaktionen gefunden',
    'transactions.searchTransactions': 'Transaktionen suchen...',
    
    // Accounts
    'accounts.title': 'Konten',
    'accounts.subtitle': 'Finanzkonten und Verbindungen verwalten',
    'accounts.addAccount': 'Konto hinzufügen',
    'accounts.totalBalance': 'Gesamtguthaben',
    'accounts.bankAccounts': 'Bankkonten',
    'accounts.creditCards': 'Kreditkarten',
    'accounts.investments': 'Investitionen',
    'accounts.crypto': 'Krypto-Wallets',
    'accounts.lastSync': 'Zuletzt synchronisiert',
    'accounts.sync': 'Synchronisieren',
    'accounts.connected': 'Verbunden',
    'accounts.disconnected': 'Getrennt',
    'accounts.connectBank': 'Bank verbinden',
    'accounts.manualAccount': 'Manuelles Konto',
    
    // Wallet
    'wallet.title': 'Wallet',
    'wallet.subtitle': 'Krypto-Assets und DeFi-Portfolio verwalten',
    'wallet.connectWallet': 'Wallet verbinden',
    'wallet.totalValue': 'Gesamtwert des Portfolios',
    'wallet.assets': 'Vermögenswerte',
    'wallet.nfts': 'NFTs',
    'wallet.defi': 'DeFi-Positionen',
    'wallet.history': 'Transaktionsverlauf',
    'wallet.send': 'Senden',
    'wallet.receive': 'Empfangen',
    'wallet.swap': 'Tauschen',
    'wallet.stake': 'Staken',
    'wallet.noWallet': 'Kein Wallet verbunden',
    'wallet.connectPrompt': 'Verbinden Sie Ihr Wallet, um Ihr Krypto-Portfolio anzuzeigen',
    
    // Receipts
    'receipts.title': 'Belege',
    'receipts.subtitle': 'Belege scannen, organisieren und verwalten',
    'receipts.uploadReceipt': 'Beleg hochladen',
    'receipts.scanReceipt': 'Beleg scannen',
    'receipts.allReceipts': 'Alle Belege',
    'receipts.unmatched': 'Nicht zugeordnet',
    'receipts.matched': 'Zugeordnet',
    'receipts.archived': 'Archiviert',
    'receipts.dragDrop': 'Belege hier ablegen oder klicken zum Hochladen',
    'receipts.supportedFormats': 'Unterstützte Formate: JPG, PNG, PDF',
    'receipts.processing': 'Verarbeitung...',
    'receipts.merchant': 'Händler',
    'receipts.extractedData': 'Extrahierte Daten',
    'receipts.matchTransaction': 'Mit Transaktion verknüpfen',
    
    // Reports
    'reports.title': 'Berichte',
    'reports.subtitle': 'Finanzberichte erstellen und analysieren',
    'reports.generateReport': 'Bericht erstellen',
    'reports.profitLoss': 'Gewinn & Verlust',
    'reports.balanceSheet': 'Bilanz',
    'reports.cashFlow': 'Cashflow',
    'reports.taxSummary': 'Steuerzusammenfassung',
    'reports.expenseReport': 'Ausgabenbericht',
    'reports.incomeReport': 'Einnahmenbericht',
    'reports.customReport': 'Benutzerdefinierter Bericht',
    'reports.dateRange': 'Zeitraum',
    'reports.exportPDF': 'Als PDF exportieren',
    'reports.exportExcel': 'Als Excel exportieren',
    'reports.schedule': 'Bericht planen',
    'reports.savedReports': 'Gespeicherte Berichte',
    
    // Tax Center
    'tax.title': 'Steuerzentrale',
    'tax.subtitle': 'Steuerstrategie optimieren und Verpflichtungen verfolgen',
    'tax.estimatedTax': 'Geschätzte Steuer',
    'tax.taxSavings': 'Potenzielle Einsparungen',
    'tax.nextDeadline': 'Nächste Frist',
    'tax.taxRate': 'Effektiver Steuersatz',
    'tax.deductions': 'Abzüge',
    'tax.credits': 'Steuergutschriften',
    'tax.jurisdictions': 'Steuergebiete',
    'tax.optimization': 'Steueroptimierung',
    'tax.runOptimization': 'Optimierung starten',
    'tax.viewRecommendations': 'Empfehlungen anzeigen',
    'tax.corporateStructure': 'Unternehmensstruktur',
    'tax.addEntity': 'Einheit hinzufügen',
    'tax.entities': 'Einheiten',
    'tax.connections': 'Verbindungen',
    
    // AI Assistant
    'ai.title': 'KI-Assistent',
    'ai.subtitle': 'Erhalten Sie intelligente Einblicke und Empfehlungen',
    'ai.askAnything': 'Fragen Sie mich alles zu Ihren Finanzen...',
    'ai.suggestions': 'Vorgeschlagene Fragen',
    'ai.recentChats': 'Letzte Gespräche',
    'ai.newChat': 'Neuer Chat',
    'ai.analyzing': 'Analysiere...',
    'ai.thinking': 'Denke nach...',
    'ai.suggestion1': 'Wie kann ich meine Steuerlast reduzieren?',
    'ai.suggestion2': 'Was sind meine größten Ausgaben diesen Monat?',
    'ai.suggestion3': 'Zeige mir meine Cashflow-Prognose',
    'ai.suggestion4': 'Analysiere meine Ausgabenmuster',
    
    // Team Chat
    'chat.title': 'Team-Chat',
    'chat.subtitle': 'Arbeiten Sie in Echtzeit mit Ihrem Team zusammen',
    'chat.channels': 'Kanäle',
    'chat.directMessages': 'Direktnachrichten',
    'chat.newChannel': 'Neuer Kanal',
    'chat.newMessage': 'Neue Nachricht',
    'chat.typeMessage': 'Nachricht eingeben...',
    'chat.send': 'Senden',
    'chat.online': 'Online',
    'chat.offline': 'Offline',
    'chat.members': 'Mitglieder',
    'chat.files': 'Geteilte Dateien',
    'chat.search': 'Nachrichten suchen...',
    
    // Auth
    'auth.login': 'Anmelden',
    'auth.register': 'Konto erstellen',
    'auth.email': 'E-Mail-Adresse',
    'auth.password': 'Passwort',
    'auth.confirmPassword': 'Passwort bestätigen',
    'auth.forgotPassword': 'Passwort vergessen?',
    'auth.rememberMe': 'Angemeldet bleiben',
    'auth.noAccount': 'Noch kein Konto?',
    'auth.hasAccount': 'Bereits ein Konto?',
    'auth.signUp': 'Registrieren',
    'auth.signIn': 'Anmelden',
    'auth.orContinueWith': 'Oder fortfahren mit',
    'auth.termsAgree': 'Mit der Registrierung akzeptieren Sie unsere',
    'auth.terms': 'Nutzungsbedingungen',
    'auth.and': 'und',
    'auth.privacy': 'Datenschutzrichtlinie',
    'auth.welcomeBack': 'Willkommen zurück',
    'auth.loginSubtitle': 'Geben Sie Ihre Anmeldedaten ein',
    'auth.createAccount': 'Konto erstellen',
    'auth.registerSubtitle': 'Beginnen Sie heute mit der Verwaltung Ihrer Finanzen',
    'auth.firstName': 'Vorname',
    'auth.lastName': 'Nachname',
  },
  
  es: {
    // Navigation
    'nav.dashboard': 'Panel',
    'nav.transactions': 'Transacciones',
    'nav.accounts': 'Cuentas',
    'nav.wallet': 'Billetera',
    'nav.receipts': 'Recibos',
    'nav.reports': 'Informes',
    'nav.taxCenter': 'Centro de Impuestos',
    'nav.aiAssistant': 'Asistente IA',
    'nav.teamChat': 'Chat de Equipo',
    'nav.settings': 'Configuración',
    'nav.main': 'Principal',
    'nav.tools': 'Herramientas',
    
    // Common
    'common.user': 'Usuario',
    'common.organization': 'Organización',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.add': 'Añadir',
    'common.search': 'Buscar',
    'common.filter': 'Filtrar',
    'common.export': 'Exportar',
    'common.import': 'Importar',
    'common.all': 'Todos',
    'common.active': 'Activo',
    'common.inactive': 'Inactivo',
    'common.status': 'Estado',
    'common.date': 'Fecha',
    'common.amount': 'Monto',
    'common.type': 'Tipo',
    'common.category': 'Categoría',
    'common.description': 'Descripción',
    'common.actions': 'Acciones',
    'common.view': 'Ver',
    'common.download': 'Descargar',
    'common.upload': 'Subir',
    'common.loading': 'Cargando...',
    'common.noData': 'No hay datos disponibles',
    'common.error': 'Ha ocurrido un error',
    'common.success': 'Éxito',
    'common.warning': 'Advertencia',
    'common.info': 'Información',
    'common.confirm': 'Confirmar',
    'common.back': 'Atrás',
    'common.next': 'Siguiente',
    'common.previous': 'Anterior',
    'common.today': 'Hoy',
    'common.yesterday': 'Ayer',
    'common.thisWeek': 'Esta Semana',
    'common.thisMonth': 'Este Mes',
    'common.thisYear': 'Este Año',
    'common.custom': 'Personalizado',
    'common.from': 'Desde',
    'common.to': 'Hasta',
    'common.total': 'Total',
    'common.balance': 'Saldo',
    'common.income': 'Ingresos',
    'common.expense': 'Gastos',
    'common.profit': 'Ganancia',
    'common.loss': 'Pérdida',
    'common.viewAll': 'Ver Todo',
    
    // Settings
    'settings.title': 'Configuración',
    'settings.subtitle': 'Administra tu cuenta y preferencias',
    'settings.save': 'Guardar Cambios',
    'settings.saved': '¡Guardado!',
    
    // Settings Tabs
    'settings.tabs.profile': 'Perfil',
    'settings.tabs.organization': 'Organización',
    'settings.tabs.notifications': 'Notificaciones',
    'settings.tabs.security': 'Seguridad',
    'settings.tabs.billing': 'Facturación',
    'settings.tabs.integrations': 'Integraciones',
    'settings.tabs.appearance': 'Apariencia',
    
    // Appearance
    'appearance.theme': 'Tema',
    'appearance.themeDesc': 'Elige cómo se ve PrimeBalance para ti',
    'appearance.light': 'Claro',
    'appearance.lightDesc': 'Fondo claro con texto oscuro',
    'appearance.dark': 'Oscuro',
    'appearance.darkDesc': 'Fondo oscuro con texto claro',
    'appearance.system': 'Sistema',
    'appearance.systemDesc': 'Coincidir con la configuración del sistema',
    'appearance.accentColor': 'Color de Acento',
    'appearance.accentColorDesc': 'Selecciona tu color de acento preferido',
    'appearance.sidebar': 'Barra Lateral',
    'appearance.sidebarDesc': 'Elige cómo se comporta la barra lateral',
    'appearance.expanded': 'Expandida',
    'appearance.expandedDesc': 'Barra lateral completa con etiquetas',
    'appearance.collapsed': 'Compacta',
    'appearance.collapsedDesc': 'Solo iconos compactos',
    'appearance.autohide': 'Auto-ocultar',
    'appearance.autohideDesc': 'Mostrar al pasar el cursor',
    'appearance.language': 'Idioma',
    'appearance.languageDesc': 'Selecciona tu idioma preferido',
    'appearance.preview': 'Vista Previa',
    'appearance.currentSettings': 'Configuración Actual',
    'appearance.primaryButton': 'Botón Primario',
    'appearance.secondary': 'Secundario',
    
    // Profile
    'profile.personalInfo': 'Información Personal',
    'profile.firstName': 'Nombre',
    'profile.lastName': 'Apellido',
    'profile.email': 'Correo Electrónico',
    'profile.phone': 'Número de Teléfono',
    'profile.timezone': 'Zona Horaria',
    
    // Organization
    'org.details': 'Detalles de la Organización',
    'org.companyName': 'Nombre de la Empresa',
    'org.industry': 'Industria',
    'org.companySize': 'Tamaño de la Empresa',
    
    // Notifications
    'notifications.preferences': 'Preferencias de Notificación',
    'notifications.transactionAlerts': 'Alertas de transacciones',
    'notifications.transactionAlertsDesc': 'Recibir notificaciones de todas las transacciones',
    'notifications.weeklyReports': 'Informes semanales',
    'notifications.weeklyReportsDesc': 'Recibir resumen financiero semanal',
    'notifications.taxReminders': 'Recordatorios de impuestos',
    'notifications.taxRemindersDesc': 'Próximas fechas límite de impuestos',
    'notifications.teamUpdates': 'Actualizaciones del equipo',
    'notifications.teamUpdatesDesc': 'Cuando los miembros del equipo hacen cambios',
    
    // Security
    'security.password': 'Contraseña',
    'security.currentPassword': 'Contraseña Actual',
    'security.newPassword': 'Nueva Contraseña',
    'security.confirmPassword': 'Confirmar Contraseña',
    'security.twoFactor': 'Autenticación de Dos Factores',
    'security.authenticatorApp': 'App de Autenticación',
    'security.authenticatorAppDesc': 'Usar una app para generar códigos',
    'security.enable': 'Activar',
    
    // Billing
    'billing.currentPlan': 'Plan Actual',
    'billing.professionalPlan': 'Plan Profesional',
    'billing.upgrade': 'Mejorar',
    'billing.paymentMethod': 'Método de Pago',
    'billing.update': 'Actualizar',
    
    // Integrations
    'integrations.connectedServices': 'Servicios Conectados',
    'integrations.connected': 'Conectado',
    'integrations.connect': 'Conectar',
    
    // Header
    'header.search': 'Buscar transacciones, cuentas, informes...',
    'header.newTransaction': 'Nueva Transacción',
    'header.new': 'Nuevo',
    'header.notifications': 'Notificaciones',
    'header.markAllRead': 'Marcar todo como leído',
    'header.viewAll': 'Ver todas las notificaciones',
    'header.profileSettings': 'Configuración de Perfil',
    'header.accountSettings': 'Configuración de Cuenta',
    'header.billingReports': 'Facturación e Informes',
    'header.signOut': 'Cerrar sesión',
    
    // Dashboard
    'dashboard.title': 'Panel',
    'dashboard.subtitle': '¡Bienvenido de nuevo! Aquí está tu resumen financiero.',
    'dashboard.totalBalance': 'Saldo Total',
    'dashboard.monthlyIncome': 'Ingresos Mensuales',
    'dashboard.monthlyExpenses': 'Gastos Mensuales',
    'dashboard.pendingInvoices': 'Facturas Pendientes',
    'dashboard.vsLastMonth': 'vs mes anterior',
    'dashboard.recentTransactions': 'Transacciones Recientes',
    'dashboard.viewAll': 'Ver Todo',
    'dashboard.aiInsights': 'Análisis de IA',
    'dashboard.cashFlow': 'Flujo de Caja',
    'dashboard.expenseBreakdown': 'Desglose de Gastos',
    'dashboard.last30Days': 'Últimos 30 días',
    'dashboard.askAI': 'Pregunta a la IA sobre tus finanzas...',
    
    // Transactions
    'transactions.title': 'Transacciones',
    'transactions.subtitle': 'Ver y gestionar todas tus transacciones financieras',
    'transactions.addTransaction': 'Añadir Transacción',
    'transactions.filterBy': 'Filtrar por',
    'transactions.sortBy': 'Ordenar por',
    'transactions.dateRange': 'Rango de Fechas',
    'transactions.allCategories': 'Todas las Categorías',
    'transactions.allAccounts': 'Todas las Cuentas',
    'transactions.income': 'Ingresos',
    'transactions.expense': 'Gastos',
    'transactions.transfer': 'Transferencia',
    'transactions.pending': 'Pendiente',
    'transactions.completed': 'Completado',
    'transactions.failed': 'Fallido',
    'transactions.noTransactions': 'No se encontraron transacciones',
    'transactions.searchTransactions': 'Buscar transacciones...',
    
    // Accounts
    'accounts.title': 'Cuentas',
    'accounts.subtitle': 'Gestionar tus cuentas financieras y conexiones',
    'accounts.addAccount': 'Añadir Cuenta',
    'accounts.totalBalance': 'Saldo Total',
    'accounts.bankAccounts': 'Cuentas Bancarias',
    'accounts.creditCards': 'Tarjetas de Crédito',
    'accounts.investments': 'Inversiones',
    'accounts.crypto': 'Billeteras Crypto',
    'accounts.lastSync': 'Última sincronización',
    'accounts.sync': 'Sincronizar',
    'accounts.connected': 'Conectado',
    'accounts.disconnected': 'Desconectado',
    'accounts.connectBank': 'Conectar Banco',
    'accounts.manualAccount': 'Cuenta Manual',
    
    // Wallet
    'wallet.title': 'Billetera',
    'wallet.subtitle': 'Gestionar tus activos crypto y portafolio DeFi',
    'wallet.connectWallet': 'Conectar Billetera',
    'wallet.totalValue': 'Valor Total del Portafolio',
    'wallet.assets': 'Activos',
    'wallet.nfts': 'NFTs',
    'wallet.defi': 'Posiciones DeFi',
    'wallet.history': 'Historial de Transacciones',
    'wallet.send': 'Enviar',
    'wallet.receive': 'Recibir',
    'wallet.swap': 'Intercambiar',
    'wallet.stake': 'Staking',
    'wallet.noWallet': 'No hay billetera conectada',
    'wallet.connectPrompt': 'Conecta tu billetera para ver tu portafolio crypto',
    
    // Receipts
    'receipts.title': 'Recibos',
    'receipts.subtitle': 'Escanear, organizar y gestionar tus recibos',
    'receipts.uploadReceipt': 'Subir Recibo',
    'receipts.scanReceipt': 'Escanear Recibo',
    'receipts.allReceipts': 'Todos los Recibos',
    'receipts.unmatched': 'Sin Emparejar',
    'receipts.matched': 'Emparejados',
    'receipts.archived': 'Archivados',
    'receipts.dragDrop': 'Arrastra y suelta recibos aquí o haz clic para subir',
    'receipts.supportedFormats': 'Formatos soportados: JPG, PNG, PDF',
    'receipts.processing': 'Procesando...',
    'receipts.merchant': 'Comerciante',
    'receipts.extractedData': 'Datos Extraídos',
    'receipts.matchTransaction': 'Vincular a Transacción',
    
    // Reports
    'reports.title': 'Informes',
    'reports.subtitle': 'Generar y analizar informes financieros',
    'reports.generateReport': 'Generar Informe',
    'reports.profitLoss': 'Ganancias y Pérdidas',
    'reports.balanceSheet': 'Balance General',
    'reports.cashFlow': 'Flujo de Caja',
    'reports.taxSummary': 'Resumen de Impuestos',
    'reports.expenseReport': 'Informe de Gastos',
    'reports.incomeReport': 'Informe de Ingresos',
    'reports.customReport': 'Informe Personalizado',
    'reports.dateRange': 'Rango de Fechas',
    'reports.exportPDF': 'Exportar PDF',
    'reports.exportExcel': 'Exportar Excel',
    'reports.schedule': 'Programar Informe',
    'reports.savedReports': 'Informes Guardados',
    
    // Tax Center
    'tax.title': 'Centro de Impuestos',
    'tax.subtitle': 'Optimizar tu estrategia fiscal y seguir obligaciones',
    'tax.estimatedTax': 'Impuesto Estimado',
    'tax.taxSavings': 'Ahorros Potenciales',
    'tax.nextDeadline': 'Próxima Fecha Límite',
    'tax.taxRate': 'Tasa Impositiva Efectiva',
    'tax.deductions': 'Deducciones',
    'tax.credits': 'Créditos Fiscales',
    'tax.jurisdictions': 'Jurisdicciones',
    'tax.optimization': 'Optimización Fiscal',
    'tax.runOptimization': 'Ejecutar Optimización',
    'tax.viewRecommendations': 'Ver Recomendaciones',
    'tax.corporateStructure': 'Estructura Corporativa',
    'tax.addEntity': 'Añadir Entidad',
    'tax.entities': 'Entidades',
    'tax.connections': 'Conexiones',
    
    // AI Assistant
    'ai.title': 'Asistente IA',
    'ai.subtitle': 'Obtén análisis inteligentes y recomendaciones',
    'ai.askAnything': 'Pregúntame cualquier cosa sobre tus finanzas...',
    'ai.suggestions': 'Preguntas Sugeridas',
    'ai.recentChats': 'Conversaciones Recientes',
    'ai.newChat': 'Nuevo Chat',
    'ai.analyzing': 'Analizando...',
    'ai.thinking': 'Pensando...',
    'ai.suggestion1': '¿Cómo puedo reducir mi carga fiscal?',
    'ai.suggestion2': '¿Cuáles son mis mayores gastos este mes?',
    'ai.suggestion3': 'Muéstrame mi pronóstico de flujo de caja',
    'ai.suggestion4': 'Analiza mis patrones de gasto',
    
    // Team Chat
    'chat.title': 'Chat de Equipo',
    'chat.subtitle': 'Colabora con tu equipo en tiempo real',
    'chat.channels': 'Canales',
    'chat.directMessages': 'Mensajes Directos',
    'chat.newChannel': 'Nuevo Canal',
    'chat.newMessage': 'Nuevo Mensaje',
    'chat.typeMessage': 'Escribe un mensaje...',
    'chat.send': 'Enviar',
    'chat.online': 'En línea',
    'chat.offline': 'Desconectado',
    'chat.members': 'Miembros',
    'chat.files': 'Archivos Compartidos',
    'chat.search': 'Buscar mensajes...',
    
    // Auth
    'auth.login': 'Iniciar Sesión',
    'auth.register': 'Crear Cuenta',
    'auth.email': 'Correo Electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar Contraseña',
    'auth.forgotPassword': '¿Olvidaste tu Contraseña?',
    'auth.rememberMe': 'Recordarme',
    'auth.noAccount': '¿No tienes una cuenta?',
    'auth.hasAccount': '¿Ya tienes una cuenta?',
    'auth.signUp': 'Registrarse',
    'auth.signIn': 'Iniciar Sesión',
    'auth.orContinueWith': 'O continuar con',
    'auth.termsAgree': 'Al registrarte, aceptas nuestros',
    'auth.terms': 'Términos de Servicio',
    'auth.and': 'y',
    'auth.privacy': 'Política de Privacidad',
    'auth.welcomeBack': 'Bienvenido de nuevo',
    'auth.loginSubtitle': 'Ingresa tus credenciales para acceder a tu cuenta',
    'auth.createAccount': 'Crea tu cuenta',
    'auth.registerSubtitle': 'Comienza a gestionar tus finanzas hoy',
    'auth.firstName': 'Nombre',
    'auth.lastName': 'Apellido',
  },
  
  fr: {
    // Navigation
    'nav.dashboard': 'Tableau de bord',
    'nav.transactions': 'Transactions',
    'nav.accounts': 'Comptes',
    'nav.wallet': 'Portefeuille',
    'nav.receipts': 'Reçus',
    'nav.reports': 'Rapports',
    'nav.taxCenter': 'Centre Fiscal',
    'nav.aiAssistant': 'Assistant IA',
    'nav.teamChat': 'Chat d\'Équipe',
    'nav.settings': 'Paramètres',
    'nav.main': 'Principal',
    'nav.tools': 'Outils',
    
    // Common
    'common.user': 'Utilisateur',
    'common.organization': 'Organisation',
    'common.save': 'Enregistrer',
    'common.cancel': 'Annuler',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.add': 'Ajouter',
    'common.search': 'Rechercher',
    'common.filter': 'Filtrer',
    'common.export': 'Exporter',
    'common.import': 'Importer',
    'common.all': 'Tous',
    'common.active': 'Actif',
    'common.inactive': 'Inactif',
    'common.status': 'Statut',
    'common.date': 'Date',
    'common.amount': 'Montant',
    'common.type': 'Type',
    'common.category': 'Catégorie',
    'common.description': 'Description',
    'common.actions': 'Actions',
    'common.view': 'Voir',
    'common.download': 'Télécharger',
    'common.upload': 'Importer',
    'common.loading': 'Chargement...',
    'common.noData': 'Aucune donnée disponible',
    'common.error': 'Une erreur est survenue',
    'common.success': 'Succès',
    'common.warning': 'Avertissement',
    'common.info': 'Information',
    'common.confirm': 'Confirmer',
    'common.back': 'Retour',
    'common.next': 'Suivant',
    'common.previous': 'Précédent',
    'common.today': 'Aujourd\'hui',
    'common.yesterday': 'Hier',
    'common.thisWeek': 'Cette Semaine',
    'common.thisMonth': 'Ce Mois',
    'common.thisYear': 'Cette Année',
    'common.custom': 'Personnalisé',
    'common.from': 'De',
    'common.to': 'À',
    'common.total': 'Total',
    'common.balance': 'Solde',
    'common.income': 'Revenus',
    'common.expense': 'Dépenses',
    'common.profit': 'Bénéfice',
    'common.loss': 'Perte',
    'common.viewAll': 'Voir Tout',
    
    // Settings
    'settings.title': 'Paramètres',
    'settings.subtitle': 'Gérez votre compte et vos préférences',
    'settings.save': 'Enregistrer',
    'settings.saved': 'Enregistré !',
    
    // Settings Tabs
    'settings.tabs.profile': 'Profil',
    'settings.tabs.organization': 'Organisation',
    'settings.tabs.notifications': 'Notifications',
    'settings.tabs.security': 'Sécurité',
    'settings.tabs.billing': 'Facturation',
    'settings.tabs.integrations': 'Intégrations',
    'settings.tabs.appearance': 'Apparence',
    
    // Appearance
    'appearance.theme': 'Thème',
    'appearance.themeDesc': 'Choisissez l\'apparence de PrimeBalance',
    'appearance.light': 'Clair',
    'appearance.lightDesc': 'Fond clair avec texte sombre',
    'appearance.dark': 'Sombre',
    'appearance.darkDesc': 'Fond sombre avec texte clair',
    'appearance.system': 'Système',
    'appearance.systemDesc': 'Suivre les paramètres système',
    'appearance.accentColor': 'Couleur d\'Accent',
    'appearance.accentColorDesc': 'Sélectionnez votre couleur d\'accent préférée',
    'appearance.sidebar': 'Barre Latérale',
    'appearance.sidebarDesc': 'Choisissez le comportement de la barre latérale',
    'appearance.expanded': 'Étendue',
    'appearance.expandedDesc': 'Barre latérale complète avec libellés',
    'appearance.collapsed': 'Réduite',
    'appearance.collapsedDesc': 'Icônes compactes uniquement',
    'appearance.autohide': 'Masquage auto',
    'appearance.autohideDesc': 'Afficher au survol',
    'appearance.language': 'Langue',
    'appearance.languageDesc': 'Sélectionnez votre langue préférée',
    'appearance.preview': 'Aperçu',
    'appearance.currentSettings': 'Paramètres Actuels',
    'appearance.primaryButton': 'Bouton Principal',
    'appearance.secondary': 'Secondaire',
    
    // Profile
    'profile.personalInfo': 'Informations Personnelles',
    'profile.firstName': 'Prénom',
    'profile.lastName': 'Nom',
    'profile.email': 'E-mail',
    'profile.phone': 'Numéro de Téléphone',
    'profile.timezone': 'Fuseau Horaire',
    
    // Organization
    'org.details': 'Détails de l\'Organisation',
    'org.companyName': 'Nom de l\'Entreprise',
    'org.industry': 'Secteur',
    'org.companySize': 'Taille de l\'Entreprise',
    
    // Notifications
    'notifications.preferences': 'Préférences de Notification',
    'notifications.transactionAlerts': 'Alertes de transactions',
    'notifications.transactionAlertsDesc': 'Être notifié pour toutes les transactions',
    'notifications.weeklyReports': 'Rapports hebdomadaires',
    'notifications.weeklyReportsDesc': 'Recevoir un résumé financier hebdomadaire',
    'notifications.taxReminders': 'Rappels fiscaux',
    'notifications.taxRemindersDesc': 'Échéances fiscales à venir',
    'notifications.teamUpdates': 'Mises à jour de l\'équipe',
    'notifications.teamUpdatesDesc': 'Quand les membres de l\'équipe font des changements',
    
    // Security
    'security.password': 'Mot de Passe',
    'security.currentPassword': 'Mot de Passe Actuel',
    'security.newPassword': 'Nouveau Mot de Passe',
    'security.confirmPassword': 'Confirmer le Mot de Passe',
    'security.twoFactor': 'Authentification à Deux Facteurs',
    'security.authenticatorApp': 'Application d\'Authentification',
    'security.authenticatorAppDesc': 'Utiliser une app pour générer des codes',
    'security.enable': 'Activer',
    
    // Billing
    'billing.currentPlan': 'Forfait Actuel',
    'billing.professionalPlan': 'Forfait Professionnel',
    'billing.upgrade': 'Améliorer',
    'billing.paymentMethod': 'Moyen de Paiement',
    'billing.update': 'Mettre à jour',
    
    // Integrations
    'integrations.connectedServices': 'Services Connectés',
    'integrations.connected': 'Connecté',
    'integrations.connect': 'Connecter',
    
    // Header
    'header.search': 'Rechercher transactions, comptes, rapports...',
    'header.newTransaction': 'Nouvelle Transaction',
    'header.new': 'Nouveau',
    'header.notifications': 'Notifications',
    'header.markAllRead': 'Tout marquer comme lu',
    'header.viewAll': 'Voir toutes les notifications',
    'header.profileSettings': 'Paramètres du Profil',
    'header.accountSettings': 'Paramètres du Compte',
    'header.billingReports': 'Facturation & Rapports',
    'header.signOut': 'Déconnexion',
    
    // Dashboard
    'dashboard.title': 'Tableau de Bord',
    'dashboard.subtitle': 'Bienvenue ! Voici votre aperçu financier.',
    'dashboard.totalBalance': 'Solde Total',
    'dashboard.monthlyIncome': 'Revenus Mensuels',
    'dashboard.monthlyExpenses': 'Dépenses Mensuelles',
    'dashboard.pendingInvoices': 'Factures en Attente',
    'dashboard.vsLastMonth': 'vs mois dernier',
    'dashboard.recentTransactions': 'Transactions Récentes',
    'dashboard.viewAll': 'Voir Tout',
    'dashboard.aiInsights': 'Analyses IA',
    'dashboard.cashFlow': 'Flux de Trésorerie',
    'dashboard.expenseBreakdown': 'Répartition des Dépenses',
    'dashboard.last30Days': '30 derniers jours',
    'dashboard.askAI': 'Demandez à l\'IA concernant vos finances...',
    
    // Transactions
    'transactions.title': 'Transactions',
    'transactions.subtitle': 'Voir et gérer toutes vos transactions financières',
    'transactions.addTransaction': 'Ajouter Transaction',
    'transactions.filterBy': 'Filtrer par',
    'transactions.sortBy': 'Trier par',
    'transactions.dateRange': 'Période',
    'transactions.allCategories': 'Toutes les Catégories',
    'transactions.allAccounts': 'Tous les Comptes',
    'transactions.income': 'Revenus',
    'transactions.expense': 'Dépenses',
    'transactions.transfer': 'Transfert',
    'transactions.pending': 'En attente',
    'transactions.completed': 'Terminé',
    'transactions.failed': 'Échoué',
    'transactions.noTransactions': 'Aucune transaction trouvée',
    'transactions.searchTransactions': 'Rechercher transactions...',
    
    // Accounts
    'accounts.title': 'Comptes',
    'accounts.subtitle': 'Gérer vos comptes financiers et connexions',
    'accounts.addAccount': 'Ajouter Compte',
    'accounts.totalBalance': 'Solde Total',
    'accounts.bankAccounts': 'Comptes Bancaires',
    'accounts.creditCards': 'Cartes de Crédit',
    'accounts.investments': 'Investissements',
    'accounts.crypto': 'Portefeuilles Crypto',
    'accounts.lastSync': 'Dernière synchronisation',
    'accounts.sync': 'Synchroniser',
    'accounts.connected': 'Connecté',
    'accounts.disconnected': 'Déconnecté',
    'accounts.connectBank': 'Connecter Banque',
    'accounts.manualAccount': 'Compte Manuel',
    
    // Wallet
    'wallet.title': 'Portefeuille',
    'wallet.subtitle': 'Gérer vos actifs crypto et portefeuille DeFi',
    'wallet.connectWallet': 'Connecter Portefeuille',
    'wallet.totalValue': 'Valeur Totale du Portefeuille',
    'wallet.assets': 'Actifs',
    'wallet.nfts': 'NFTs',
    'wallet.defi': 'Positions DeFi',
    'wallet.history': 'Historique des Transactions',
    'wallet.send': 'Envoyer',
    'wallet.receive': 'Recevoir',
    'wallet.swap': 'Échanger',
    'wallet.stake': 'Staker',
    'wallet.noWallet': 'Aucun portefeuille connecté',
    'wallet.connectPrompt': 'Connectez votre portefeuille pour voir votre portfolio crypto',
    
    // Receipts
    'receipts.title': 'Reçus',
    'receipts.subtitle': 'Scanner, organiser et gérer vos reçus',
    'receipts.uploadReceipt': 'Télécharger Reçu',
    'receipts.scanReceipt': 'Scanner Reçu',
    'receipts.allReceipts': 'Tous les Reçus',
    'receipts.unmatched': 'Non Associés',
    'receipts.matched': 'Associés',
    'receipts.archived': 'Archivés',
    'receipts.dragDrop': 'Glissez-déposez les reçus ici ou cliquez pour télécharger',
    'receipts.supportedFormats': 'Formats supportés: JPG, PNG, PDF',
    'receipts.processing': 'Traitement...',
    'receipts.merchant': 'Commerçant',
    'receipts.extractedData': 'Données Extraites',
    'receipts.matchTransaction': 'Associer à Transaction',
    
    // Reports
    'reports.title': 'Rapports',
    'reports.subtitle': 'Générer et analyser des rapports financiers',
    'reports.generateReport': 'Générer Rapport',
    'reports.profitLoss': 'Profits et Pertes',
    'reports.balanceSheet': 'Bilan',
    'reports.cashFlow': 'Flux de Trésorerie',
    'reports.taxSummary': 'Résumé Fiscal',
    'reports.expenseReport': 'Rapport de Dépenses',
    'reports.incomeReport': 'Rapport de Revenus',
    'reports.customReport': 'Rapport Personnalisé',
    'reports.dateRange': 'Période',
    'reports.exportPDF': 'Exporter PDF',
    'reports.exportExcel': 'Exporter Excel',
    'reports.schedule': 'Planifier Rapport',
    'reports.savedReports': 'Rapports Sauvegardés',
    
    // Tax Center
    'tax.title': 'Centre Fiscal',
    'tax.subtitle': 'Optimiser votre stratégie fiscale et suivre les obligations',
    'tax.estimatedTax': 'Impôt Estimé',
    'tax.taxSavings': 'Économies Potentielles',
    'tax.nextDeadline': 'Prochaine Échéance',
    'tax.taxRate': 'Taux d\'Imposition Effectif',
    'tax.deductions': 'Déductions',
    'tax.credits': 'Crédits d\'Impôt',
    'tax.jurisdictions': 'Juridictions',
    'tax.optimization': 'Optimisation Fiscale',
    'tax.runOptimization': 'Lancer Optimisation',
    'tax.viewRecommendations': 'Voir Recommandations',
    'tax.corporateStructure': 'Structure d\'Entreprise',
    'tax.addEntity': 'Ajouter Entité',
    'tax.entities': 'Entités',
    'tax.connections': 'Connexions',
    
    // AI Assistant
    'ai.title': 'Assistant IA',
    'ai.subtitle': 'Obtenez des analyses intelligentes et des recommandations',
    'ai.askAnything': 'Posez-moi n\'importe quelle question sur vos finances...',
    'ai.suggestions': 'Questions Suggérées',
    'ai.recentChats': 'Conversations Récentes',
    'ai.newChat': 'Nouveau Chat',
    'ai.analyzing': 'Analyse en cours...',
    'ai.thinking': 'Réflexion...',
    'ai.suggestion1': 'Comment puis-je réduire ma charge fiscale ?',
    'ai.suggestion2': 'Quelles sont mes plus grosses dépenses ce mois ?',
    'ai.suggestion3': 'Montrez-moi mes prévisions de trésorerie',
    'ai.suggestion4': 'Analysez mes habitudes de dépenses',
    
    // Team Chat
    'chat.title': 'Chat d\'Équipe',
    'chat.subtitle': 'Collaborez avec votre équipe en temps réel',
    'chat.channels': 'Canaux',
    'chat.directMessages': 'Messages Directs',
    'chat.newChannel': 'Nouveau Canal',
    'chat.newMessage': 'Nouveau Message',
    'chat.typeMessage': 'Tapez un message...',
    'chat.send': 'Envoyer',
    'chat.online': 'En ligne',
    'chat.offline': 'Hors ligne',
    'chat.members': 'Membres',
    'chat.files': 'Fichiers Partagés',
    'chat.search': 'Rechercher messages...',
    
    // Auth
    'auth.login': 'Connexion',
    'auth.register': 'Créer un Compte',
    'auth.email': 'Adresse E-mail',
    'auth.password': 'Mot de Passe',
    'auth.confirmPassword': 'Confirmer le Mot de Passe',
    'auth.forgotPassword': 'Mot de Passe Oublié ?',
    'auth.rememberMe': 'Se souvenir de moi',
    'auth.noAccount': 'Pas encore de compte ?',
    'auth.hasAccount': 'Déjà un compte ?',
    'auth.signUp': 'S\'inscrire',
    'auth.signIn': 'Se Connecter',
    'auth.orContinueWith': 'Ou continuer avec',
    'auth.termsAgree': 'En vous inscrivant, vous acceptez nos',
    'auth.terms': 'Conditions d\'Utilisation',
    'auth.and': 'et',
    'auth.privacy': 'Politique de Confidentialité',
    'auth.welcomeBack': 'Bienvenue',
    'auth.loginSubtitle': 'Entrez vos identifiants pour accéder à votre compte',
    'auth.createAccount': 'Créez votre compte',
    'auth.registerSubtitle': 'Commencez à gérer vos finances aujourd\'hui',
    'auth.firstName': 'Prénom',
    'auth.lastName': 'Nom',
  },
};

// =============================================================================
// ACCENT COLORS
// =============================================================================

export const accentColors: AccentColorConfig[] = [
  {
    name: 'Emerald',
    value: 'emerald',
    primary: '#10b981',
    primaryHover: '#059669',
    primaryLight: '#d1fae5',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'Blue',
    value: 'blue',
    primary: '#3b82f6',
    primaryHover: '#2563eb',
    primaryLight: '#dbeafe',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    name: 'Violet',
    value: 'violet',
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryLight: '#ede9fe',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    name: 'Rose',
    value: 'rose',
    primary: '#f43f5e',
    primaryHover: '#e11d48',
    primaryLight: '#ffe4e6',
    gradient: 'from-rose-500 to-pink-500',
  },
  {
    name: 'Amber',
    value: 'amber',
    primary: '#f59e0b',
    primaryHover: '#d97706',
    primaryLight: '#fef3c7',
    gradient: 'from-amber-500 to-yellow-500',
  },
  {
    name: 'Cyan',
    value: 'cyan',
    primary: '#06b6d4',
    primaryHover: '#0891b2',
    primaryLight: '#cffafe',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Orange',
    value: 'orange',
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryLight: '#ffedd5',
    gradient: 'from-orange-500 to-red-500',
  },
];

// =============================================================================
// STORE INTERFACE
// =============================================================================

interface ThemeState {
  // Theme settings
  themeMode: ThemeMode;
  accentColor: AccentColor;
  sidebarMode: SidebarMode;
  language: Language;
  
  // Computed states
  resolvedTheme: 'light' | 'dark';
  sidebarExpanded: boolean;
  sidebarHovered: boolean;
  
  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setSidebarMode: (mode: SidebarMode) => void;
  setLanguage: (lang: Language) => void;
  setSidebarExpanded: (expanded: boolean) => void;
  setSidebarHovered: (hovered: boolean) => void;
  toggleSidebar: () => void;
  
  // Helpers
  getAccentConfig: () => AccentColorConfig;
  getSidebarWidth: () => number;
  t: (key: string) => string;
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(mode: ThemeMode): 'light' | 'dark' {
  if (mode === 'system') {
    return getSystemTheme();
  }
  return mode;
}

// =============================================================================
// STORE IMPLEMENTATION
// =============================================================================

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      // Initial state
      themeMode: 'dark',
      accentColor: 'emerald',
      sidebarMode: 'expanded',
      language: 'en',
      resolvedTheme: 'dark',
      sidebarExpanded: true,
      sidebarHovered: false,
      
      // Theme mode
      setThemeMode: (mode) => {
        const resolved = resolveTheme(mode);
        set({ themeMode: mode, resolvedTheme: resolved });
        
        // Apply to document
        if (typeof document !== 'undefined') {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(resolved);
          root.setAttribute('data-theme', resolved);
        }
      },
      
      // Accent color
      setAccentColor: (color) => {
        set({ accentColor: color });
        
        // Apply CSS variables
        if (typeof document !== 'undefined') {
          const config = accentColors.find(c => c.value === color);
          if (config) {
            const root = document.documentElement;
            root.style.setProperty('--accent-primary', config.primary);
            root.style.setProperty('--accent-primary-hover', config.primaryHover);
            root.style.setProperty('--accent-primary-light', config.primaryLight);
            root.setAttribute('data-accent', color);
          }
        }
      },
      
      // Language
      setLanguage: (lang) => {
        set({ language: lang });
        
        // Apply to document
        if (typeof document !== 'undefined') {
          document.documentElement.setAttribute('lang', lang);
        }
      },
      
      // Sidebar mode
      setSidebarMode: (mode) => {
        set({ 
          sidebarMode: mode,
          sidebarExpanded: mode === 'expanded',
        });
      },
      
      setSidebarExpanded: (expanded) => {
        set({ sidebarExpanded: expanded });
      },
      
      setSidebarHovered: (hovered) => {
        const { sidebarMode } = get();
        if (sidebarMode === 'autohide') {
          set({ sidebarExpanded: hovered, sidebarHovered: hovered });
        } else {
          set({ sidebarHovered: hovered });
        }
      },
      
      toggleSidebar: () => {
        const { sidebarMode, sidebarExpanded } = get();
        if (sidebarMode === 'collapsed' || sidebarMode === 'expanded') {
          set({ 
            sidebarMode: sidebarExpanded ? 'collapsed' : 'expanded',
            sidebarExpanded: !sidebarExpanded 
          });
        }
      },
      
      // Helpers
      getAccentConfig: () => {
        const { accentColor } = get();
        return accentColors.find(c => c.value === accentColor) || accentColors[0];
      },
      
      getSidebarWidth: () => {
        const { sidebarMode, sidebarExpanded, sidebarHovered } = get();
        
        if (sidebarMode === 'expanded') return 288; // 72 * 4 = w-72
        if (sidebarMode === 'collapsed') return 80; // w-20
        if (sidebarMode === 'autohide') {
          return sidebarHovered ? 288 : 0;
        }
        return sidebarExpanded ? 288 : 80;
      },
      
      // Translation helper
      t: (key: string) => {
        const { language } = get();
        return translations[language]?.[key] || translations['en'][key] || key;
      },
    }),
    {
      name: 'primebalance-theme',
      partialize: (state) => ({
        themeMode: state.themeMode,
        accentColor: state.accentColor,
        sidebarMode: state.sidebarMode,
        language: state.language,
      }),
    }
  )
);

// =============================================================================
// INITIALIZATION HOOK
// =============================================================================

export function initializeTheme() {
  const store = useThemeStore.getState();
  
  // Apply theme
  store.setThemeMode(store.themeMode);
  store.setAccentColor(store.accentColor);
  store.setLanguage(store.language);
  
  // Listen for system theme changes
  if (typeof window !== 'undefined') {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      if (store.themeMode === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        useThemeStore.setState({ resolvedTheme: resolved });
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(resolved);
      }
    });
  }
}
