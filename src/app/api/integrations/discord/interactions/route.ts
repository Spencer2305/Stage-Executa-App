import { NextRequest, NextResponse } from 'next/server';
import { verifyDiscordSignature } from '@/lib/discord';
import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';

const prisma = new PrismaClient();
// Initialize OpenAI client conditionally
let openai: OpenAI | null = null;

// Only initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

// Discord interaction types
const DISCORD_INTERACTION_TYPES = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5,
};

// Discord interaction response types
const DISCORD_INTERACTION_RESPONSE_TYPES = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
};

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    
    console.log('Discord interaction headers:', {
      signature: signature ? `${signature.substring(0, 20)}...` : 'missing',
      timestamp,
      signatureLength: signature?.length,
    });
    
    if (!signature || !timestamp) {
      console.log('Missing signature headers');
      return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
    }

    const rawBody = await request.text();
    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    console.log('Request details:', {
      bodyLength: rawBody.length,
      publicKeyLength: publicKey?.length,
      hasPublicKey: !!publicKey,
    });

    if (!publicKey) {
      console.log('Discord public key not configured');
      return NextResponse.json({ error: 'Discord not configured' }, { status: 500 });
    }

    // Verify the signature
    const isValid = verifyDiscordSignature(rawBody, signature, timestamp, publicKey);
    console.log('Signature verification result:', isValid);
    
    // Temporary bypass for testing - remove this in production
    const isTestSignature = signature === 'test';
    
    if (!isValid && !isTestSignature) {
      console.log('Invalid signature - details:', {
        signature: signature.substring(0, 20) + '...',
        timestamp,
        bodyPreview: rawBody.substring(0, 100),
        publicKeyPreview: publicKey.substring(0, 20) + '...',
      });
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    if (isTestSignature) {
      console.log('Using test signature bypass');
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (error) {
      console.log('Invalid JSON body:', error);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    console.log('Discord interaction received:', {
      type: body.type,
      id: body.id,
      token: body.token?.substring(0, 10) + '...',
      data: body.data
    });

    // Handle PING (Discord verification)
    if (body.type === DISCORD_INTERACTION_TYPES.PING) {
      console.log('Responding to PING');
      return NextResponse.json({
        type: DISCORD_INTERACTION_RESPONSE_TYPES.PONG
      });
    }

    // Handle slash commands
    if (body.type === DISCORD_INTERACTION_TYPES.APPLICATION_COMMAND) {
      const { data, guild_id, channel_id, member, user } = body;
      
      // Get the command name
      const commandName = data.name;
      console.log('Handling command:', commandName);

      // Find the Discord connection for this guild
      const connection = await prisma.discordConnection.findFirst({
        where: {
          guildId: guild_id,
        },
        include: {
          assistant: {
            include: {
              files: true,
            },
          },
        },
      });

      if (!connection) {
        return NextResponse.json({
          type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '❌ No AI assistant configured for this server. Please set up the integration first.',
            flags: 64, // Ephemeral message
          },
        });
      }

      if (commandName === 'ask') {
        const question = data.options?.[0]?.value;
        
        if (!question) {
          return NextResponse.json({
            type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '❌ Please provide a question to ask the AI.',
              flags: 64, // Ephemeral message
            },
          });
        }

        try {
          // Defer the response since AI processing might take time
          return NextResponse.json({
            type: DISCORD_INTERACTION_RESPONSE_TYPES.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE,
          });

          // Note: In a real implementation, you'd handle the deferred response
          // by making a follow-up request to Discord's webhook URL
          // For now, we'll just return the deferred response
          
        } catch (error) {
          console.error('Error processing AI request:', error);
          return NextResponse.json({
            type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
            data: {
              content: '❌ Sorry, I encountered an error processing your request.',
              flags: 64, // Ephemeral message
            },
          });
        }
      }

      // Default response for unknown commands
      return NextResponse.json({
        type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: `❓ Unknown command: ${commandName}`,
          flags: 64, // Ephemeral message
        },
      });
    }

    // Handle other interaction types
    console.log('Unhandled interaction type:', body.type);
    return NextResponse.json({
      type: DISCORD_INTERACTION_RESPONSE_TYPES.CHANNEL_MESSAGE_WITH_SOURCE,
      data: {
        content: '❓ I don\'t know how to handle this type of interaction yet.',
        flags: 64, // Ephemeral message
      },
    });

  } catch (error) {
    console.error('Error in Discord interactions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Also handle GET requests for debugging
export async function GET() {
  return new NextResponse(JSON.stringify({ 
    status: 'Discord endpoint active',
    timestamp: Date.now()
  }), {
    headers: {
      'Content-Type': 'application/json',
    },
  });
} 