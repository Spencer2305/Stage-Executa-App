import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // Get auth token
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify JWT token
    let userId: string;
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get user with account
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { account: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'disconnect') {
      // Delete all Discord connections for this account
      await prisma.discordConnection.deleteMany({
        where: {
          accountId: user.account.id
        }
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Discord connections disconnected successfully' 
      });
    }

    // For other actions (like status check), return current connections
    const connections = await prisma.discordConnection.findMany({
      where: {
        accountId: user.account.id,
        isActive: true
      },
      include: {
        assistant: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    return NextResponse.json({
      connected: connections.length > 0,
      connections: connections.map(conn => ({
        id: conn.id,
        guildName: conn.guildName,
        guildId: conn.guildId,
        assistant: conn.assistant,
        totalMessages: conn.totalMessages,
        lastMessageAt: conn.lastMessageAt,
        createdAt: conn.createdAt
      }))
    });

  } catch (error) {
    console.error('Discord status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 