// src/lib/ai/tools.ts
// DeepSeek function calling tool definitions

export const AI_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_transactions',
      description: 'Get a list of transactions with optional filters. Use this to retrieve transaction history, spending patterns, income, etc.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['income', 'expense', 'transfer'],
            description: 'Filter by transaction type'
          },
          status: {
            type: 'string',
            enum: ['pending', 'completed', 'cancelled'],
            description: 'Filter by transaction status'
          },
          category: {
            type: 'string',
            description: 'Filter by category name'
          },
          startDate: {
            type: 'string',
            description: 'Start date filter (ISO format)'
          },
          endDate: {
            type: 'string',
            description: 'End date filter (ISO format)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of transactions to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_transaction_summary',
      description: 'Get a summary of transactions including totals by type, category breakdown, and trends. Use for financial overviews and reports.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period for the summary'
          },
          groupBy: {
            type: 'string',
            enum: ['category', 'type', 'status', 'month'],
            description: 'How to group the summary data'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_invoices',
      description: 'Get a list of invoices with optional filters. Use for invoice management, payment tracking, and receivables analysis.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'confirmed', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled', 'archived'],
            description: 'Filter by invoice status'
          },
          customerId: {
            type: 'string',
            description: 'Filter by customer ID'
          },
          startDate: {
            type: 'string',
            description: 'Filter invoices from this date (ISO format)'
          },
          endDate: {
            type: 'string',
            description: 'Filter invoices until this date (ISO format)'
          },
          overdue: {
            type: 'boolean',
            description: 'Only return overdue invoices'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of invoices to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_invoice_statistics',
      description: 'Get invoice statistics including total amounts, payment rates, and aging analysis.',
      parameters: {
        type: 'object',
        properties: {
          period: {
            type: 'string',
            enum: ['week', 'month', 'quarter', 'year'],
            description: 'Time period for statistics'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_receipts',
      description: 'Get a list of receipts with optional filters. Use for expense tracking and receipt management.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'matched', 'unmatched', 'archived'],
            description: 'Filter by receipt status'
          },
          category: {
            type: 'string',
            description: 'Filter by category'
          },
          vendor: {
            type: 'string',
            description: 'Filter by vendor name (partial match)'
          },
          startDate: {
            type: 'string',
            description: 'Filter receipts from this date (ISO format)'
          },
          endDate: {
            type: 'string',
            description: 'Filter receipts until this date (ISO format)'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of receipts to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_assets',
      description: 'Get a list of company assets with optional filters. Use for asset tracking, depreciation analysis, and fixed asset management.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['draft', 'active', 'fully_depreciated', 'impaired', 'disposed', 'written_off'],
            description: 'Filter by asset status'
          },
          category: {
            type: 'string',
            enum: ['property_plant_equipment', 'intangible', 'financial', 'right_of_use', 'investment_property', 'biological', 'other'],
            description: 'Filter by asset category'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of assets to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_customers',
      description: 'Get a list of customers with their basic information. Use for customer analysis and relationship management.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['active', 'inactive', 'prospect', 'churned'],
            description: 'Filter by customer status'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of customers to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_financial_accounts',
      description: 'Get a list of financial accounts (chart of accounts). Use for understanding the accounting structure.',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
            description: 'Filter by account type'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of accounts to return (default: 50, max: 200)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_receivables',
      description: 'Get accounts receivable information including outstanding amounts and aging.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['open', 'partial', 'paid', 'overdue', 'written_off'],
            description: 'Filter by receivable status'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of receivables to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_projects',
      description: 'Get a list of projects with budget and status information.',
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['planning', 'active', 'on_hold', 'completed', 'cancelled'],
            description: 'Filter by project status'
          },
          limit: {
            type: 'number',
            description: 'Maximum number of projects to return (default: 20, max: 100)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_kpis',
      description: 'Get key performance indicators and their current values.',
      parameters: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            description: 'Filter by KPI category'
          }
        }
      }
    }
  }
] as const

export type ToolName = typeof AI_TOOLS[number]['function']['name']
