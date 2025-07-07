import { NextRequest, NextResponse } from 'next/server';
import { initWebSocketIfNeeded } from '@/lib/websocket-init';

export async function POST(request: NextRequest) {
  try {
    initWebSocketIfNeeded();
    
    return NextResponse.json({
      success: true,
      message: 'WebSocket server initialization triggered'
    });
  } catch (error) {
    console.error('Error initializing WebSocket:', error);
    return NextResponse.json(
      { error: 'Failed to initialize WebSocket server' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'WebSocket initialization endpoint',
    instructions: 'Send POST request to initialize WebSocket server'
  });
} 