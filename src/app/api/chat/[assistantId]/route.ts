import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { assistantId: string } }
) {
  try {
    const { message } = await request.json();
    const assistantId = params.assistantId;

    if (!message || !assistantId) {
      return NextResponse.json({ error: 'Message and assistant ID are required' }, { status: 400 });
    }

    // Get the assistant
    const assistant = await prisma.assistant.findUnique({
      where: { id: assistantId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
      },
    });

    if (!assistant) {
      return NextResponse.json({ error: 'Assistant not found' }, { status: 404 });
    }

    if (assistant.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Assistant is not active' }, { status: 400 });
    }

    // For now, return a simple demo response
    // In the future, this would integrate with OpenAI or your AI service
    const responses = [
      "Thank you for your message! I'm here to help you with any questions you might have.",
      "That's a great question! Let me help you with that information.",
      "I understand what you're looking for. Here's what I can tell you about that topic.",
      "Thanks for reaching out! I'm ready to assist you with your inquiry.",
      "I appreciate you contacting us. Let me provide you with the information you need."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    // Log the conversation (optional)
    try {
      await prisma.assistant.update({
        where: { id: assistantId },
        data: {
          totalMessages: {
            increment: 1
          }
        }
      });
    } catch (error) {
      console.warn('Failed to update message count:', error);
    }

    return NextResponse.json({
      response: randomResponse,
      assistantId: assistantId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 