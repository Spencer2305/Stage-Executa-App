import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { generateSampleAnalyticsData } from '@/lib/analytics';

export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assistantId } = await request.json();

    console.log(`🎯 Generating sample analytics data for account ${user.account.id}, assistantId: ${assistantId || 'all'}`);

    // Generate sample data (this might take a while)
    await generateSampleAnalyticsData(user.account.id, assistantId);

    console.log(`✅ Sample analytics data generated successfully`);
    
    return NextResponse.json({
      success: true,
      message: 'Sample analytics data generated successfully',
    });

  } catch (error) {
    console.error('❌ Error generating sample analytics data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate sample analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 