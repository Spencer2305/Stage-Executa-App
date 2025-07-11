import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import OpenAI from 'openai';

const openai = new OpenAI({
});

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing minimal assistant creation...');

    // Test 1: Authentication
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
    console.log('✅ Test 1 passed: Authentication');

    // Test 2: Database access
    const userAccount = await db.user.findUnique({
      where: { id: user.id },
      include: { account: true }
    });

    if (!userAccount?.account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    console.log('✅ Test 2 passed: Database access');

    // Test 3: OpenAI API key
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
      return NextResponse.json({ 
        error: 'OpenAI API key not configured properly',
        details: 'Current key appears to be placeholder'
      }, { status: 500 });
    }
    console.log('✅ Test 3 passed: OpenAI API key configured');

    // Test 4: Simple database write
    const testAssistant = await db.assistant.create({
      data: {
        accountId: userAccount.account.id,
        name: 'Test Assistant',
        description: 'Test assistant for debugging',
        instructions: 'You are a test assistant.',
        status: 'DRAFT',
        model: 'gpt-4-turbo',
        isPublic: false,
        totalSessions: 0,
        totalMessages: 0
      }
    });
    console.log('✅ Test 4 passed: Database write');

    // Test 5: Basic OpenAI API call
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo",
        messages: [
          {
            role: "system",
            content: "You are a test assistant for the Executa platform."
          },
          {
            role: "user",
            content: "Hello, this is a test message."
          }
        ],
        max_tokens: 50
      });
      console.log('✅ Test 5 passed: Basic OpenAI API call');

      // Clean up test data
      await db.assistant.delete({
        where: { id: testAssistant.id }
      });
      
      console.log('✅ Cleanup completed');

      return NextResponse.json({
        success: true,
        message: 'Core tests passed! The issue is likely in file processing or vector store creation.',
        tests: [
          'Authentication ✅',
          'Database access ✅',
          'OpenAI API key ✅',
          'Database write ✅',
          'Basic OpenAI API call ✅'
        ],
        recommendation: 'Try creating an assistant without files first, or check the file processing logs.'
      });

    } catch (openaiError: any) {
      console.error('❌ OpenAI test failed:', openaiError);
      
      // Clean up partial test data
      await db.assistant.delete({
        where: { id: testAssistant.id }
      }).catch(() => {});

      return NextResponse.json({
        error: 'OpenAI API call failed',
        details: openaiError.message || 'Unknown OpenAI error',
        errorCode: openaiError?.error?.code,
        stage: 'Basic OpenAI API test'
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('❌ Test failed:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error.message || 'Unknown error',
      stage: 'General test'
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Assistant Creation Test Endpoint',
    description: 'POST to this endpoint to test all components of assistant creation'
  });
} 