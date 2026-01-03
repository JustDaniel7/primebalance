import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user's organization
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { organizationId: true }
    })

    if (!currentUser?.organizationId) {
      return NextResponse.json({ members: [] })
    }

    // Get all members of the organization
    const members = await prisma.user.findMany({
      where: {
        organizationId: currentUser.organizationId,
        id: { not: session.user.id } // Exclude current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Failed to fetch organization members:', error)
    return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 })
  }
}
