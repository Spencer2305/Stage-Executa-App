import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all human agents in the account
    const agents = await db.humanAgent.findMany({
      where: {
        accountId: user.account.id
      },
      include: {
        user: {
          select: {
            email: true,
            name: true
          }
        },
        _count: {
          select: {
            handoffRequests: {
              where: {
                status: {
                  in: ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS']
                }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Transform the data to match the frontend interface
    const formattedAgents = agents.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: agent.email,
      isOnline: agent.isOnline,
      isAvailable: agent.isAvailable,
      department: agent.departments[0] || 'General',
      skills: agent.skills,
      activeTickets: agent._count.handoffRequests,
      lastActive: agent.lastActive
    }));

    return NextResponse.json({
      success: true,
      agents: formattedAgents
    });

  } catch (error) {
    console.error('Error fetching agents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agents' },
      { status: 500 }
    );
  }
}

// POST endpoint to create or update agent profile
export async function POST(request: NextRequest) {
  try {
    const user = await authenticateRequest(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, department, skills, isAvailable = true } = body;

    // Create or update human agent profile for current user
    const agent = await db.humanAgent.upsert({
      where: {
        userId: user.id
      },
      update: {
        name: name || user.name,
        departments: department ? [department] : ['General'],
        skills: skills || [],
        isAvailable,
        lastActive: new Date()
      },
      create: {
        userId: user.id,
        accountId: user.account.id,
        name: name || user.name,
        email: user.email,
        departments: department ? [department] : ['General'],
        skills: skills || [],
        isAvailable,
        isOnline: false,
        lastActive: new Date()
      }
    });

    return NextResponse.json({
      success: true,
      agent: {
        id: agent.id,
        name: agent.name,
        email: agent.email,
        isOnline: agent.isOnline,
        isAvailable: agent.isAvailable,
        department: agent.departments[0] || 'General',
        skills: agent.skills,
        activeTickets: 0
      }
    });

  } catch (error) {
    console.error('Error creating/updating agent:', error);
    return NextResponse.json(
      { error: 'Failed to create/update agent profile' },
      { status: 500 }
    );
  }
} 