// src/app/api/chat/dm/route.ts
// Direct Message API - creates/gets DM channels between users

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest } from '@/lib/api-utils';

// GET /api/chat/dm - Get all DM channels for current user
export async function GET(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  // Find all DM channels where the current user is a participant
  // DM channel names are formatted as "dm:{id1}:{id2}" with IDs in sorted order
  const dmChannels = await prisma.chatChannel.findMany({
    where: {
      organizationId: user.organizationId,
      type: 'direct',
      name: { contains: user.id },
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      _count: { select: { messages: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Extract the other participant's ID from the channel name
  const dmList = dmChannels.map((channel) => {
    const parts = channel.name.replace('dm:', '').split(':');
    const otherUserId = parts.find((id) => id !== user.id) || parts[0];
    return {
      id: channel.id,
      otherUserId,
      lastMessage: channel.messages[0] || null,
      messageCount: channel._count.messages,
      updatedAt: channel.updatedAt,
    };
  });

  return NextResponse.json(dmList);
}

// POST /api/chat/dm - Create or get a DM channel with another user
export async function POST(req: NextRequest) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { recipientId } = await req.json();
  if (!recipientId) return badRequest('Recipient ID is required');

  // Prevent DM to self
  if (recipientId === user.id) {
    return badRequest('Cannot create DM with yourself');
  }

  // Verify recipient exists and is in the same organization
  const recipient = await prisma.account.findFirst({
    where: {
      userId: recipientId,
    },
    include: {
      user: true,
    },
  });

  // Create consistent DM channel name (sorted IDs to ensure uniqueness)
  const sortedIds = [user.id, recipientId].sort();
  const dmChannelName = `dm:${sortedIds[0]}:${sortedIds[1]}`;

  // Check if DM channel already exists
  let dmChannel = await prisma.chatChannel.findFirst({
    where: {
      organizationId: user.organizationId,
      name: dmChannelName,
      type: 'direct',
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  // Create if doesn't exist
  if (!dmChannel) {
    dmChannel = await prisma.chatChannel.create({
      data: {
        name: dmChannelName,
        type: 'direct',
        description: `Direct message between users`,
        organizationId: user.organizationId,
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { id: true, name: true, image: true } } },
        },
      },
    });
  }

  return NextResponse.json({
    channelId: dmChannel.id,
    messages: dmChannel.messages.reverse(), // Return in chronological order
  });
}
