import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
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

    // Get user's assistants
    const assistants = await prisma.assistant.findMany({
      where: {
        accountId: user.account.id
      },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        isPublic: true,
        createdAt: true,
        updatedAt: true,
        totalSessions: true,
        totalMessages: true,
        _count: {
          select: {
            files: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      assistants: assistants.map(assistant => ({
        ...assistant,
        fileCount: assistant._count.files
      }))
    });

  } catch (error) {
    console.error('Get assistants error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 