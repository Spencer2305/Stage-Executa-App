import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifySlackSignature, sendSlackMessage } from '@/lib/slack';
import OpenAI from 'openai';

// Initialize OpenAI client conditionally
let openai: OpenAI | null = null;

// Only initialize OpenAI client if API key is available
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-openai-api-key') {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const timestamp = request.headers.get('x-slack-request-timestamp');
    const signature = request.headers.get('x-slack-signature');

    // Verify request is from Slack
    if (!timestamp || !signature || !process.env.SLACK_SIGNING_SECRET) {
      console.error('Missing Slack headers or signing secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Prevent replay attacks (timestamp should be within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - parseInt(timestamp)) > 300) {
      console.error('Request timestamp too old');
      return NextResponse.json({ error: 'Request expired' }, { status: 401 });
    }

    if (!verifySlackSignature(process.env.SLACK_SIGNING_SECRET, body, timestamp, signature)) {
      console.error('Invalid Slack signature');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = JSON.parse(body);

    // Handle URL verification for initial setup
    if (payload.type === 'url_verification') {
      return NextResponse.json({ challenge: payload.challenge });
    }

    // Handle events
    if (payload.type === 'event_callback') {
      const event = payload.event;

      // Only respond to messages that aren't from bots and are direct messages or mentions
      if (event.type === 'message' && 
          !event.bot_id && 
          event.user && 
          (event.channel_type === 'im' || event.text?.includes('<@'))) {
        
        // Find the Slack connection for this team
        const slackConnection = await db.slackConnection.findFirst({
          where: {
            teamId: payload.team_id,
            isActive: true
          },
          include: {
            assistant: {
              include: {
                account: true
              }
            }
          }
        });

        if (!slackConnection) {
          console.log('No active Slack connection found for team:', payload.team_id);
          return NextResponse.json({ status: 'ignored' });
        }

        // Don't respond to our own messages
        if (event.user === slackConnection.botUserId) {
          return NextResponse.json({ status: 'ignored' });
        }

        const assistant = slackConnection.assistant;

        // Check if assistant is active and has OpenAI configuration
        if (assistant.status !== 'ACTIVE' || !assistant.openaiAssistantId) {
          await sendSlackMessage(
            slackConnection.botToken,
            event.channel,
            "I'm not fully configured yet. Please make sure I'm trained and activated in the dashboard.",
            event.thread_ts
          );
          return NextResponse.json({ status: 'sent_error' });
        }

        // Check if OpenAI API key is configured
        if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your-openai-api-key')) {
          await sendSlackMessage(
            slackConnection.botToken,
            event.channel,
            "I need an OpenAI API key to be configured to provide intelligent responses. Please contact the administrator.",
            event.thread_ts
          );
          return NextResponse.json({ status: 'sent_error' });
        }

        try {
          if (!openai) {
            await sendSlackMessage(
              slackConnection.botToken,
              event.channel,
              "I need an OpenAI API key to be configured to provide intelligent responses. Please contact the administrator.",
              event.thread_ts
            );
            return NextResponse.json({ status: 'sent_error' });
          }
          
          // Clean the message text (remove bot mentions)
          let messageText = event.text;
          if (event.channel_type !== 'im') {
            // Remove bot mention from the message
            messageText = messageText.replace(/<@[^>]+>/g, '').trim();
          }

          // Create OpenAI thread for this Slack conversation
          const thread = await openai.beta.threads.create();

          // Add user message to thread
          await openai.beta.threads.messages.create(thread.id, {
            role: "user",
            content: messageText
          });

          // Create and poll run
          const run = await openai.beta.threads.runs.createAndPoll(thread.id, {
            assistant_id: assistant.openaiAssistantId,
            instructions: `You are ${assistant.name} for ${assistant.account.name}. You are responding to a message in Slack from team "${slackConnection.teamName}". 

Use your knowledge base to provide helpful, accurate responses. Keep responses conversational and appropriate for Slack. 

When users ask about integrations or connecting external services, refer them to the dashboard settings. If they ask about specific data from integrations (like emails, CRM data, etc.), explain that this data can be connected through the integrations and will then be available for you to help with.

Always be helpful and professional.`
          });

          if (run.status === 'completed') {
            // Get the assistant's response
            const messages = await openai.beta.threads.messages.list(thread.id);
            const lastMessage = messages.data[0];
            
            if (lastMessage && lastMessage.role === 'assistant' && lastMessage.content[0].type === 'text') {
              const responseText = lastMessage.content[0].text.value;
              
              // Send response to Slack
              await sendSlackMessage(
                slackConnection.botToken,
                event.channel,
                responseText,
                event.thread_ts
              );

              // Update statistics
              await db.slackConnection.update({
                where: { id: slackConnection.id },
                data: {
                  lastMessageAt: new Date(),
                  totalMessages: {
                    increment: 1
                  }
                }
              });

              await db.assistant.update({
                where: { id: assistant.id },
                data: {
                  totalMessages: {
                    increment: 1
                  }
                }
              });

              return NextResponse.json({ status: 'sent_response' });
            }
          } else {
            console.error('OpenAI run failed:', run.status, run.last_error);
            await sendSlackMessage(
              slackConnection.botToken,
              event.channel,
              "I'm having trouble processing your request right now. Please try again in a moment.",
              event.thread_ts
            );
            return NextResponse.json({ status: 'sent_error' });
          }

        } catch (openaiError: any) {
          console.error('OpenAI API error in Slack handler:', openaiError);
          await sendSlackMessage(
            slackConnection.botToken,
            event.channel,
            "I'm experiencing technical difficulties. Please try again later.",
            event.thread_ts
          );
          return NextResponse.json({ status: 'sent_error' });
        }
      }
    }

    return NextResponse.json({ status: 'ignored' });

  } catch (error) {
    console.error('Slack events error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 