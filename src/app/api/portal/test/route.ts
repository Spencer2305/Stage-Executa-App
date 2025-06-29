import { NextRequest, NextResponse } from 'next/server';
import { connectToPortalMongoDB } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Testing Portal MongoDB connection...');
    
    // Check environment variables
    const mongoUri = process.env.PORTAL_MONGODB_URI;
    const dbName = process.env.PORTAL_DATABASE_NAME;
    
    console.log('📋 Environment check:');
    console.log('- PORTAL_MONGODB_URI exists:', !!mongoUri);
    console.log('- PORTAL_DATABASE_NAME:', dbName);
    
    if (!mongoUri) {
      return NextResponse.json({
        error: 'PORTAL_MONGODB_URI environment variable not set',
        envCheck: {
          mongoUri: !!mongoUri,
          dbName,
          jwtSecret: !!jwtSecret
        }
      }, { status: 500 });
    }
    
    // Test MongoDB connection
    await connectToPortalMongoDB();
    console.log('✅ MongoDB connection successful');
    
    return NextResponse.json({
      success: true,
      message: 'Portal MongoDB connection successful',
      envCheck: {
        mongoUri: !!mongoUri,
        dbName,
        jwtSecret: !!jwtSecret
      }
    });
    
  } catch (error) {
    console.error('❌ Portal MongoDB test failed:', error);
    return NextResponse.json({
      error: 'MongoDB connection failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 