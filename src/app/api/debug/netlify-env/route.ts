import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Check critical environment variables (without exposing secrets)
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      DATABASE_URL: process.env.DATABASE_URL ? 'SET' : 'NOT SET',
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET',
      
      // AWS variables (new names)
      EXECUTA_AWS_ACCESS_KEY_ID: process.env.EXECUTA_AWS_ACCESS_KEY_ID ? 'SET' : 'NOT SET',
      EXECUTA_AWS_SECRET_ACCESS_KEY: process.env.EXECUTA_AWS_SECRET_ACCESS_KEY ? 'SET' : 'NOT SET',
      EXECUTA_AWS_REGION: process.env.EXECUTA_AWS_REGION || 'NOT SET',
      
      // Check if old AWS variables still exist (they shouldn't)
      OLD_AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ? 'STILL SET (REMOVE)' : 'NOT SET (GOOD)',
      OLD_AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ? 'STILL SET (REMOVE)' : 'NOT SET (GOOD)',
      OLD_AWS_REGION: process.env.AWS_REGION ? 'STILL SET (REMOVE)' : 'NOT SET (GOOD)',
      
      // Stripe
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
      STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ? 'SET' : 'NOT SET',
      
      // OAuth
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET',
      
      // Discord
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN ? 'SET' : 'NOT SET',
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID ? 'SET' : 'NOT SET',
      DISCORD_CLIENT_SECRET: process.env.DISCORD_CLIENT_SECRET ? 'SET' : 'NOT SET',
    };

    // Test database connection
    let dbStatus = 'NOT TESTED';
    try {
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      await prisma.$connect();
      dbStatus = 'CONNECTED';
      await prisma.$disconnect();
    } catch (dbError) {
      dbStatus = `ERROR: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
    }

    return NextResponse.json({
      success: true,
      environment: envCheck,
      database: dbStatus,
      timestamp: new Date().toISOString(),
      host: request.headers.get('host'),
      userAgent: request.headers.get('user-agent'),
    });

  } catch (error) {
    return NextResponse.json(
      { 
        error: 'Debug check failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 