// src/lib/notifications.ts
// Notification service for creating system notifications

import { prisma } from './prisma'

export type NotificationType =
  | 'assignment'      // Task assigned to user
  | 'mention'         // User mentioned in comment
  | 'status_change'   // Task status changed
  | 'comment'         // New comment on task
  | 'due_soon'        // Task due within 24h
  | 'overdue'         // Task is overdue
  | 'invoice_created' // New invoice created
  | 'invoice_paid'    // Invoice was paid
  | 'invoice_overdue' // Invoice is overdue
  | 'dunning_sent'    // Dunning email sent
  | 'dunning_escalated' // Dunning level escalated
  | 'dunning_resolved' // Dunning case resolved
  | 'receivable_overdue' // Receivable is overdue
  | 'offer_accepted'  // Offer was accepted
  | 'offer_rejected'  // Offer was rejected
  | 'offer_expired'   // Offer has expired
  | 'welcome'         // Welcome notification for new users
  | 'system'          // System notifications

interface CreateNotificationParams {
  type: NotificationType
  title: string
  message: string
  recipientId: string
  organizationId: string
  actorId?: string
  actorName?: string
  taskId?: string
  riskId?: string
}

interface NotifyAssigneesParams {
  taskId: string
  taskTitle: string
  assigneeIds: string[]
  actorId: string
  actorName: string
  organizationId: string
}

interface NotifyStatusChangeParams {
  taskId: string
  taskTitle: string
  previousStatus: string
  newStatus: string
  ownerId: string
  actorId: string
  actorName: string
  organizationId: string
}

interface NotifyCommentParams {
  taskId: string
  taskTitle: string
  commentContent: string
  taskOwnerId: string
  mentionedUserIds?: string[]
  actorId: string
  actorName: string
  organizationId: string
}

interface NotifyInvoiceParams {
  invoiceNumber: string
  amount: number
  currency: string
  recipientId: string
  actorId?: string
  actorName?: string
  organizationId: string
}

// =============================================================================
// CORE NOTIFICATION FUNCTIONS
// =============================================================================

/**
 * Create a single notification
 */
export async function createNotification(params: CreateNotificationParams) {
  const {
    type,
    title,
    message,
    recipientId,
    organizationId,
    actorId,
    actorName,
    taskId,
    riskId,
  } = params

  // Don't notify the actor about their own actions
  if (actorId && recipientId === actorId) {
    return null
  }

  try {
    return await prisma.taskNotification.create({
      data: {
        type,
        title,
        message,
        recipientId,
        organizationId,
        actorId,
        actorName,
        taskId,
        riskId,
      },
    })
  } catch (error) {
    console.error('Failed to create notification:', error)
    return null
  }
}

/**
 * Create notifications for multiple recipients
 */
export async function createBulkNotifications(
  notifications: CreateNotificationParams[]
) {
  const validNotifications = notifications.filter(
    (n) => !n.actorId || n.recipientId !== n.actorId
  )

  if (validNotifications.length === 0) return []

  try {
    return await prisma.taskNotification.createMany({
      data: validNotifications.map((n) => ({
        type: n.type,
        title: n.title,
        message: n.message,
        recipientId: n.recipientId,
        organizationId: n.organizationId,
        actorId: n.actorId,
        actorName: n.actorName,
        taskId: n.taskId,
        riskId: n.riskId,
      })),
    })
  } catch (error) {
    console.error('Failed to create bulk notifications:', error)
    return []
  }
}

// =============================================================================
// TASK NOTIFICATIONS
// =============================================================================

/**
 * Notify users when they are assigned to a task
 */
export async function notifyTaskAssignment(params: NotifyAssigneesParams) {
  const { taskId, taskTitle, assigneeIds, actorId, actorName, organizationId } = params

  const notifications = assigneeIds.map((assigneeId) => ({
    type: 'assignment' as NotificationType,
    title: 'New Task Assigned',
    message: `${actorName} assigned you to "${taskTitle}"`,
    recipientId: assigneeId,
    organizationId,
    actorId,
    actorName,
    taskId,
  }))

  return createBulkNotifications(notifications)
}

/**
 * Notify task owner when status changes
 */
export async function notifyTaskStatusChange(params: NotifyStatusChangeParams) {
  const {
    taskId,
    taskTitle,
    previousStatus,
    newStatus,
    ownerId,
    actorId,
    actorName,
    organizationId,
  } = params

  return createNotification({
    type: 'status_change',
    title: 'Task Status Updated',
    message: `${actorName} changed "${taskTitle}" from ${formatStatus(previousStatus)} to ${formatStatus(newStatus)}`,
    recipientId: ownerId,
    organizationId,
    actorId,
    actorName,
    taskId,
  })
}

/**
 * Notify task owner and mentioned users about a new comment
 */
export async function notifyTaskComment(params: NotifyCommentParams) {
  const {
    taskId,
    taskTitle,
    commentContent,
    taskOwnerId,
    mentionedUserIds = [],
    actorId,
    actorName,
    organizationId,
  } = params

  const truncatedComment = commentContent.length > 50
    ? commentContent.substring(0, 50) + '...'
    : commentContent

  const notifications: CreateNotificationParams[] = []

  // Notify task owner
  notifications.push({
    type: 'comment',
    title: 'New Comment on Task',
    message: `${actorName} commented on "${taskTitle}": "${truncatedComment}"`,
    recipientId: taskOwnerId,
    organizationId,
    actorId,
    actorName,
    taskId,
  })

  // Notify mentioned users
  for (const userId of mentionedUserIds) {
    if (userId !== taskOwnerId) {
      notifications.push({
        type: 'mention',
        title: 'You Were Mentioned',
        message: `${actorName} mentioned you in "${taskTitle}": "${truncatedComment}"`,
        recipientId: userId,
        organizationId,
        actorId,
        actorName,
        taskId,
      })
    }
  }

  return createBulkNotifications(notifications)
}

/**
 * Notify about tasks due soon (within 24h)
 */
export async function notifyTaskDueSoon(
  taskId: string,
  taskTitle: string,
  ownerId: string,
  organizationId: string,
  dueDate: Date
) {
  const formattedDate = dueDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })

  return createNotification({
    type: 'due_soon',
    title: 'Task Due Soon',
    message: `"${taskTitle}" is due ${formattedDate}`,
    recipientId: ownerId,
    organizationId,
    taskId,
  })
}

/**
 * Notify about overdue tasks
 */
export async function notifyTaskOverdue(
  taskId: string,
  taskTitle: string,
  ownerId: string,
  organizationId: string
) {
  return createNotification({
    type: 'overdue',
    title: 'Task Overdue',
    message: `"${taskTitle}" is now overdue. Please update the status or due date.`,
    recipientId: ownerId,
    organizationId,
    taskId,
  })
}

// =============================================================================
// INVOICE NOTIFICATIONS
// =============================================================================

/**
 * Notify about new invoice created
 */
export async function notifyInvoiceCreated(params: NotifyInvoiceParams) {
  const { invoiceNumber, amount, currency, recipientId, actorId, actorName, organizationId } = params

  return createNotification({
    type: 'invoice_created',
    title: 'New Invoice Created',
    message: `Invoice #${invoiceNumber} for ${formatCurrency(amount, currency)} has been created`,
    recipientId,
    organizationId,
    actorId,
    actorName,
  })
}

/**
 * Notify about invoice payment received
 */
export async function notifyInvoicePaid(params: NotifyInvoiceParams) {
  const { invoiceNumber, amount, currency, recipientId, organizationId } = params

  return createNotification({
    type: 'invoice_paid',
    title: 'Invoice Paid',
    message: `Invoice #${invoiceNumber} for ${formatCurrency(amount, currency)} has been paid`,
    recipientId,
    organizationId,
  })
}

// =============================================================================
// SYSTEM NOTIFICATIONS
// =============================================================================

/**
 * Send welcome notification to new users
 */
export async function notifyWelcome(userId: string, userName: string, organizationId: string) {
  return createNotification({
    type: 'welcome',
    title: 'Welcome to PrimeBalance!',
    message: `Hi ${userName || 'there'}! Your account is set up and ready to go. Start by exploring the dashboard.`,
    recipientId: userId,
    organizationId,
  })
}

/**
 * Send a system notification
 */
export async function notifySystem(
  recipientId: string,
  organizationId: string,
  title: string,
  message: string
) {
  return createNotification({
    type: 'system',
    title,
    message,
    recipientId,
    organizationId,
  })
}

// =============================================================================
// HELPERS
// =============================================================================

function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
  }).format(amount)
}

/**
 * Get organization admin user IDs (owners and admins)
 */
export async function getOrgAdminIds(organizationId: string): Promise<string[]> {
  const admins = await prisma.user.findMany({
    where: {
      organizationId,
      role: { in: ['owner', 'admin'] },
    },
    select: { id: true },
  })
  return admins.map((a) => a.id)
}

/**
 * Notify all organization admins
 */
export async function notifyOrgAdmins(
  organizationId: string,
  type: NotificationType,
  title: string,
  message: string,
  options?: { actorId?: string; actorName?: string; taskId?: string }
) {
  const adminIds = await getOrgAdminIds(organizationId)

  const notifications = adminIds.map((adminId) => ({
    type,
    title,
    message,
    recipientId: adminId,
    organizationId,
    actorId: options?.actorId,
    actorName: options?.actorName,
    taskId: options?.taskId,
  }))

  return createBulkNotifications(notifications)
}

// =============================================================================
// DUNNING NOTIFICATIONS
// =============================================================================

interface DunningNotificationParams {
  dunningId: string
  dunningNumber: string
  customerName: string
  amount: number
  currency: string
  level: number
  organizationId: string
  actorId?: string
  actorName?: string
}

/**
 * Notify admins when a dunning email is sent
 */
export async function notifyDunningSent(params: DunningNotificationParams) {
  const { dunningNumber, customerName, amount, currency, level, organizationId, actorId, actorName } = params

  return notifyOrgAdmins(
    organizationId,
    'dunning_sent',
    'Dunning Email Sent',
    `Level ${level} dunning sent to ${customerName} for ${formatCurrency(amount, currency)} (${dunningNumber})`,
    { actorId, actorName }
  )
}

/**
 * Notify admins when a dunning case is escalated
 */
export async function notifyDunningEscalated(params: DunningNotificationParams) {
  const { dunningNumber, customerName, amount, currency, level, organizationId, actorId, actorName } = params

  return notifyOrgAdmins(
    organizationId,
    'dunning_escalated',
    'Dunning Escalated',
    `${dunningNumber} for ${customerName} escalated to Level ${level} (${formatCurrency(amount, currency)})`,
    { actorId, actorName }
  )
}

/**
 * Notify admins when a dunning case is resolved
 */
export async function notifyDunningResolved(params: Omit<DunningNotificationParams, 'level'>) {
  const { dunningNumber, customerName, amount, currency, organizationId, actorId, actorName } = params

  return notifyOrgAdmins(
    organizationId,
    'dunning_resolved',
    'Dunning Resolved',
    `${dunningNumber} for ${customerName} (${formatCurrency(amount, currency)}) has been resolved`,
    { actorId, actorName }
  )
}

// =============================================================================
// RECEIVABLE NOTIFICATIONS
// =============================================================================

interface ReceivableNotificationParams {
  invoiceNumber: string
  customerName: string
  amount: number
  currency: string
  daysOverdue: number
  organizationId: string
}

/**
 * Notify admins about overdue receivables
 */
export async function notifyReceivableOverdue(params: ReceivableNotificationParams) {
  const { invoiceNumber, customerName, amount, currency, daysOverdue, organizationId } = params

  return notifyOrgAdmins(
    organizationId,
    'receivable_overdue',
    'Receivable Overdue',
    `Invoice #${invoiceNumber} from ${customerName} (${formatCurrency(amount, currency)}) is ${daysOverdue} days overdue`
  )
}

// =============================================================================
// OFFER NOTIFICATIONS
// =============================================================================

interface OfferNotificationParams {
  offerNumber: string
  customerName: string
  amount: number
  currency: string
  recipientId: string
  organizationId: string
  actorId?: string
  actorName?: string
}

/**
 * Notify when an offer is accepted
 */
export async function notifyOfferAccepted(params: OfferNotificationParams) {
  const { offerNumber, customerName, amount, currency, recipientId, organizationId } = params

  return createNotification({
    type: 'offer_accepted',
    title: 'Offer Accepted',
    message: `${customerName} accepted offer #${offerNumber} for ${formatCurrency(amount, currency)}`,
    recipientId,
    organizationId,
  })
}

/**
 * Notify when an offer is rejected
 */
export async function notifyOfferRejected(params: OfferNotificationParams) {
  const { offerNumber, customerName, amount, currency, recipientId, organizationId } = params

  return createNotification({
    type: 'offer_rejected',
    title: 'Offer Rejected',
    message: `${customerName} rejected offer #${offerNumber} for ${formatCurrency(amount, currency)}`,
    recipientId,
    organizationId,
  })
}

/**
 * Notify when an offer expires
 */
export async function notifyOfferExpired(params: OfferNotificationParams) {
  const { offerNumber, customerName, amount, currency, recipientId, organizationId } = params

  return createNotification({
    type: 'offer_expired',
    title: 'Offer Expired',
    message: `Offer #${offerNumber} for ${customerName} (${formatCurrency(amount, currency)}) has expired`,
    recipientId,
    organizationId,
  })
}
