// src/app/api/chat/dm/[recipientId]/messages/route.ts
// DM Messages API - send/get messages with a specific user

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSessionWithOrg, unauthorized, badRequest, notFound } from '@/lib/api-utils';

type Params = { params: Promise<{ recipientId: string }> };

// GET /api/chat/dm/[recipientId]/messages - Get messages with a user
export async function GET(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { recipientId } = await params;

  // Create consistent DM channel name
  const sortedIds = [user.id, recipientId].sort();
  const dmChannelName = `dm:${sortedIds[0]}:${sortedIds[1]}`;

  // Find the DM channel
  const dmChannel = await prisma.chatChannel.findFirst({
    where: {
      organizationId: user.organizationId,
      name: dmChannelName,
      type: 'direct',
    },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        include: { user: { select: { id: true, name: true, image: true } } },
      },
    },
  });

  if (!dmChannel) {
    return NextResponse.json({ messages: [] });
  }

  return NextResponse.json({
    channelId: dmChannel.id,
    messages: dmChannel.messages.map((m) => ({
      id: m.id,
      content: m.content,
      senderId: m.userId,
      senderName: m.user.name || 'Unknown',
      senderAvatar: m.user.image || '',
      timestamp: m.createdAt.toISOString(),
    })),
  });
}

// POST /api/chat/dm/[recipientId]/messages - Send a message to a user
export async function POST(req: NextRequest, { params }: Params) {
  const user = await getSessionWithOrg();
  if (!user?.organizationId) return unauthorized();

  const { recipientId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return badRequest('Message content is required');
  }

  // Prevent DM to self
  if (recipientId === user.id) {
    return badRequest('Cannot send DM to yourself');
  }

  // Create consistent DM channel name
  const sortedIds = [user.id, recipientId].sort();
  const dmChannelName = `dm:${sortedIds[0]}:${sortedIds[1]}`;

  // Find or create the DM channel
  let dmChannel = await prisma.chatChannel.findFirst({
    where: {
      organizationId: user.organizationId,
      name: dmChannelName,
      type: 'direct',
    },
  });

  if (!dmChannel) {
    dmChannel = await prisma.chatChannel.create({
      data: {
        name: dmChannelName,
        type: 'direct',
        description: 'Direct message channel',
        organizationId: user.organizationId,
      },
    });
  }

  // Create the message
  const message = await prisma.chatMessage.create({
    data: {
      content: content.trim(),
      channelId: dmChannel.id,
      userId: user.id,
    },
    include: {
      user: { select: { id: true, name: true, image: true } },
    },
  });

  // Update channel's updatedAt
  await prisma.chatChannel.update({
    where: { id: dmChannel.id },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({
    id: message.id,
    content: message.content,
    senderId: message.userId,
    senderName: message.user.name || 'Unknown',
    senderAvatar: message.user.image || '',
    timestamp: message.createdAt.toISOString(),
  });
}
