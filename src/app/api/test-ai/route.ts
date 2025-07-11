import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
});

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      return NextResponse.json({
        response: 'OpenAI API key not configured. Please add your API key to the .env file.',
        isDemo: true
      });
    }

    // Test basic OpenAI functionality
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful AI assistant for testing the Executa platform integration. Keep responses concise and mention that this is a test of the AI functionality."
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 150
    });

    return NextResponse.json({
      response: completion.choices[0].message.content,
      usage: completion.usage,
      model: completion.model,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test AI API error:', error);
    
    if (error?.error?.code === 'insufficient_quota') {
      return NextResponse.json({
        error: 'OpenAI quota exceeded',
        details: 'Please check your OpenAI billing and quota limits.'
      }, { status: 429 });
    }

    return NextResponse.json({
      error: 'AI test failed',
      details: error.message || 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Test Endpoint',
    status: 'Ready',
  });
} 