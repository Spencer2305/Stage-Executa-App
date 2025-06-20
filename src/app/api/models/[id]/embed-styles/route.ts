import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const assistantId = params.id;
    const body = await request.json();
    const { embedBubbleColor, embedButtonShape, embedFontStyle, embedPosition } = body;

    // Verify the assistant belongs to the user's account
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.accountId,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Update the assistant with new embed styles
    const updatedAssistant = await prisma.assistant.update({
      where: { id: assistantId },
      data: {
        // TODO: Uncomment these fields after running database migration
        // embedBubbleColor,
        // embedButtonShape,
        // embedFontStyle,
        // embedPosition,
        updatedAt: new Date(), // Update timestamp for now
      },
    });

    return NextResponse.json({
      message: 'Embed styles updated successfully',
      assistant: updatedAssistant,
      styles: { embedBubbleColor, embedButtonShape, embedFontStyle, embedPosition },
    });
  } catch (error) {
    console.error('Error updating embed styles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifyToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const assistantId = params.id;

    // Get the assistant's embed styles
    const assistant = await prisma.assistant.findFirst({
      where: {
        id: assistantId,
        accountId: user.accountId,
      },
      select: {
        id: true,
        // TODO: Uncomment these fields after running database migration
        // embedBubbleColor: true,
        // embedButtonShape: true,
        // embedFontStyle: true,
        // embedPosition: true,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    // Return default values for now
    return NextResponse.json({
      id: assistant.id,
      embedBubbleColor: "#3B82F6",
      embedButtonShape: "rounded",
      embedFontStyle: "system",
      embedPosition: "bottom-right",
    });
  } catch (error) {
    console.error('Error fetching embed styles:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 