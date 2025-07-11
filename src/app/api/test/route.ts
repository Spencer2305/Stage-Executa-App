import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'API routes are working on Netlify!',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'GET'
  });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'POST method works too!',
    timestamp: new Date().toISOString(),
    url: request.url,
    method: 'POST'
  });
} 