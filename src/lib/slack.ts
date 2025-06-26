import { WebClient } from '@slack/web-api';
import crypto from 'crypto';

export interface SlackOAuthResponse {
  ok: boolean;
  access_token: string;
  token_type: string;
  scope: string;
  bot_user_id: string;
  app_id: string;
  team: {
    id: string;
    name: string;
    domain?: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    scope: string;
    access_token: string;
    token_type: string;
  };
  incoming_webhook?: {
    channel: string;
    channel_id: string;
    configuration_url: string;
    url: string;
  };
  error?: string;
}

export interface SlackEvent {
  type: string;
  channel: string;
  user: string;
  text: string;
  ts: string;
  event_ts: string;
  channel_type: string;
  bot_id?: string;
  thread_ts?: string;
}

export interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: string;
  event_id: string;
  event_time: number;
  authorizations: Array<{
    enterprise_id?: string;
    team_id: string;
    user_id: string;
    is_bot: boolean;
    is_enterprise_install: boolean;
  }>;
  is_ext_shared_channel: boolean;
  event_context: string;
}

export function isSlackConfigured(): boolean {
  return !!(
    process.env.SLACK_CLIENT_ID &&
    process.env.SLACK_CLIENT_SECRET &&
    process.env.SLACK_SIGNING_SECRET
  );
}

export function getSlackAuthUrl(state: string, assistantId: string): string {
  if (!isSlackConfigured()) {
    throw new Error('Slack integration not configured');
  }

  const scopes = [
    'app_mentions:read',
    'chat:write',
    'channels:read',
    'groups:read',
    'im:read',
    'im:write',
    'mpim:read',
    'users:read'
  ].join(',');

  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID!,
    scope: scopes,
    redirect_uri: process.env.SLACK_REDIRECT_URI!,
    state: `${state}:${assistantId}`,
    user_scope: 'identify'
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeCodeForToken(code: string, redirectUri: string): Promise<SlackOAuthResponse> {
  if (!isSlackConfigured()) {
    throw new Error('Slack integration not configured');
  }

  const response = await fetch('https://slack.com/api/oauth.v2.access', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      client_secret: process.env.SLACK_CLIENT_SECRET!,
      code,
      redirect_uri: redirectUri,
    }),
  });

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(`Slack OAuth error: ${data.error}`);
  }

  return data;
}

export function verifySlackSignature(
  signingSecret: string,
  body: string,
  timestamp: string,
  signature: string
): boolean {
  const hmac = crypto.createHmac('sha256', signingSecret);
  const [version, hash] = signature.split('=');
  
  hmac.update(`${version}:${timestamp}:${body}`);
  const computedSignature = hmac.digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(computedSignature, 'hex')
  );
}

export function createSlackClient(token: string): WebClient {
  return new WebClient(token);
}

export async function sendSlackMessage(
  token: string, 
  channel: string, 
  text: string, 
  threadTs?: string
): Promise<any> {
  const client = createSlackClient(token);
  
  return await client.chat.postMessage({
    channel,
    text,
    thread_ts: threadTs,
    unfurl_links: false,
    unfurl_media: false
  });
} 