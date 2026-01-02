'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useThemeStore } from '@/store/theme-store'
import { Button, Card } from '@/components/ui'
import { LogoIcon } from '@/components/ui/Icons'

interface Organization {
  id: string
  name: string
  slug: string
}

interface PendingInvitation {
  id: string
  organization: Organization
  role: string
  inviteCode: string
  expiresAt: string
}

interface AvailableOrgsResponse {
  hasOrganization: boolean
  currentOrganization: Organization | null
  pendingInvitations: PendingInvitation[]
}

type ViewMode = 'select' | 'create' | 'join'

function SelectOrganizationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useThemeStore()
  const { update: updateSession } = useSession()

  const [viewMode, setViewMode] = useState<ViewMode>('select')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendingInvitations, setPendingInvitations] = useState<PendingInvitation[]>([])

  // Create org form
  const [orgName, setOrgName] = useState('')
  const [country, setCountry] = useState('CH')
  const [currency, setCurrency] = useState('USD')

  // Join org form
  const [inviteCode, setInviteCode] = useState('')
  const [validatingCode, setValidatingCode] = useState(false)
  const [codeValidation, setCodeValidation] = useState<{ valid: boolean; organization?: Organization } | null>(null)

  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  useEffect(() => {
    fetchAvailableOrgs()
  }, [])

  async function fetchAvailableOrgs() {
    try {
      const res = await fetch('/api/organizations/available')
      if (!res.ok) throw new Error('Failed to fetch')

      const data: AvailableOrgsResponse = await res.json()

      // If user already has an organization, redirect
      if (data.hasOrganization && data.currentOrganization) {
        router.push(callbackUrl)
        return
      }

      setPendingInvitations(data.pendingInvitations)
    } catch (err) {
      console.error('Error fetching organizations:', err)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleCreateOrganization(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          country,
          defaultCurrency: currency,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create organization')
        return
      }

      // CRITICAL: Update the session to refresh the JWT with the new organizationId
      // This triggers the jwt callback with trigger='update', which re-fetches from DB
      await updateSession()

      // Success - redirect to dashboard
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleJoinOrganization(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join organization')
        return
      }

      // CRITICAL: Update the session to refresh the JWT with the new organizationId
      await updateSession()

      // Success - redirect to dashboard
      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleAcceptInvitation(invitation: PendingInvitation) {
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/organizations/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteCode: invitation.inviteCode }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to join organization')
        return
      }

      // CRITICAL: Update the session to refresh the JWT with the new organizationId
      await updateSession()

      router.push(callbackUrl)
      router.refresh()
    } catch (err) {
      setError('An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function validateInviteCode(code: string) {
    if (!code || code.length < 6) {
      setCodeValidation(null)
      return
    }

    setValidatingCode(true)
    try {
      const res = await fetch(`/api/organizations/join?code=${encodeURIComponent(code)}`)
      const data = await res.json()

      if (res.ok && data.valid) {
        setCodeValidation({ valid: true, organization: data.organization })
      } else {
        setCodeValidation({ valid: false })
      }
    } catch {
      setCodeValidation({ valid: false })
    } finally {
      setValidatingCode(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-950 dark:to-surface-900 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--accent-primary)] mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-surface-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-950 dark:to-surface-900 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-primary-hover)]">
              <LogoIcon size={28} className="text-white" />
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white font-display">
              PrimeBalance
            </span>
          </Link>
        </div>

        <Card variant="elevated" padding="lg">
          {/* Selection View */}
          {viewMode === 'select' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {t('auth.selectOrganization') || 'Select Organization'}
                </h1>
                <p className="text-gray-500 dark:text-surface-400 mt-2">
                  {t('auth.selectOrgSubtitle') || 'Create a new organization or join an existing one'}
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              {/* Pending Invitations */}
              {pendingInvitations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-surface-300 mb-3">
                    Pending Invitations
                  </h3>
                  <div className="space-y-2">
                    {pendingInvitations.map((invitation) => (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {invitation.organization.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-surface-400">
                            Role: {invitation.role}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleAcceptInvitation(invitation)}
                          disabled={isSubmitting}
                        >
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={() => setViewMode('create')}
                >
                  Create New Organization
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => setViewMode('join')}
                >
                  Join with Invite Code
                </Button>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-surface-700">
                <button
                  onClick={() => signOut({ callbackUrl: '/auth/login' })}
                  className="w-full text-center text-sm text-gray-500 dark:text-surface-400 hover:text-gray-700 dark:hover:text-surface-300"
                >
                  Sign out and use a different account
                </button>
              </div>
            </>
          )}

          {/* Create Organization View */}
          {viewMode === 'create' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Create Organization
                </h1>
                <p className="text-gray-500 dark:text-surface-400 mt-2">
                  Set up your company or team workspace
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleCreateOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    required
                    minLength={2}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                    placeholder="Acme Inc."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                      Country
                    </label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                    >
                      <option value="CH">Switzerland</option>
                      <option value="DE">Germany</option>
                      <option value="US">United States</option>
                      <option value="GB">United Kingdom</option>
                      <option value="FR">France</option>
                      <option value="IT">Italy</option>
                      <option value="ES">Spain</option>
                      <option value="NL">Netherlands</option>
                      <option value="AT">Austria</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                      Currency
                    </label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                    >
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="CHF">CHF - Swiss Franc</option>
                      <option value="GBP">GBP - British Pound</option>
                    </select>
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !orgName.trim()}
                  >
                    {isSubmitting ? 'Creating...' : 'Create Organization'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setViewMode('select')
                      setError('')
                    }}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </>
          )}

          {/* Join Organization View */}
          {viewMode === 'join' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Join Organization
                </h1>
                <p className="text-gray-500 dark:text-surface-400 mt-2">
                  Enter the invite code from your organization admin
                </p>
              </div>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoinOrganization} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-surface-300 mb-1.5">
                    Invite Code *
                  </label>
                  <input
                    type="text"
                    value={inviteCode}
                    onChange={(e) => {
                      setInviteCode(e.target.value)
                      validateInviteCode(e.target.value)
                    }}
                    required
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-surface-800/50 border border-gray-200 dark:border-surface-700/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30"
                    placeholder="Enter invite code"
                  />

                  {validatingCode && (
                    <p className="mt-2 text-sm text-gray-500">Validating...</p>
                  )}

                  {codeValidation && !validatingCode && (
                    <p className={`mt-2 text-sm ${codeValidation.valid ? 'text-green-500' : 'text-red-500'}`}>
                      {codeValidation.valid
                        ? `Valid code for: ${codeValidation.organization?.name}`
                        : 'Invalid or expired invite code'}
                    </p>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting || !inviteCode.trim() || !!(codeValidation && !codeValidation.valid)}
                  >
                    {isSubmitting ? 'Joining...' : 'Join Organization'}
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="w-full"
                    onClick={() => {
                      setViewMode('select')
                      setError('')
                      setInviteCode('')
                      setCodeValidation(null)
                    }}
                  >
                    Back
                  </Button>
                </div>
              </form>
            </>
          )}
        </Card>
      </motion.div>
    </div>
  )
}

function SelectOrganizationFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-surface-950 dark:to-surface-900 p-4">
      <div className="w-full max-w-md animate-pulse">
        <div className="h-12 bg-gray-200 dark:bg-surface-800 rounded-xl mb-8 mx-auto w-48" />
        <div className="bg-white dark:bg-surface-900 rounded-2xl p-8 space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-surface-800 rounded w-3/4 mx-auto" />
          <div className="h-4 bg-gray-200 dark:bg-surface-800 rounded w-1/2 mx-auto" />
          <div className="space-y-3 mt-6">
            <div className="h-12 bg-gray-200 dark:bg-surface-800 rounded-xl" />
            <div className="h-12 bg-gray-200 dark:bg-surface-800 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SelectOrganizationPage() {
  return (
    <Suspense fallback={<SelectOrganizationFallback />}>
      <SelectOrganizationForm />
    </Suspense>
  )
}
