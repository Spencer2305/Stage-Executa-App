// Discord Integration Library
import { PrismaClient } from '@prisma/client';
import { sign } from 'tweetnacl';

const prisma = new PrismaClient();

export interface DiscordAuthData {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  guild?: {
    id: string;
    name: string;
    icon: string | null;
    owner: boolean;
    permissions: string;
  };
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

export interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  email?: string;
}

export interface DiscordMessage {
  content?: string;
  embeds?: Array<{
    title?: string;
    description?: string;
    color?: number;
    fields?: Array<{
      name: string;
      value: string;
      inline?: boolean;
    }>;
  }>;
}

export interface DiscordInteraction {
  type: number;
  data?: {
    name: string;
    options?: Array<{
      name: string;
      value: string;
    }>;
  };
  guild_id?: string;
  channel_id: string;
  member?: {
    user: {
      id: string;
      username: string;
    };
  };
  user?: {
    id: string;
    username: string;
  };
  token: string;
  id: string;
}

// Check if Discord is configured
export function isDiscordConfigured(): boolean {
  return !!(
    process.env.DISCORD_CLIENT_ID &&
    process.env.DISCORD_CLIENT_SECRET &&
    process.env.DISCORD_BOT_TOKEN
  );
}

// Generate Discord OAuth URL
export function getDiscordAuthUrl(assistantId: string): string {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/discord/callback`;
  
  if (!clientId) {
    throw new Error('Discord client ID not configured');
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'bot',
    state: assistantId,
    permissions: '2147568640' // View Channels + Send Messages + Use Slash Commands + Read Message History + Embed Links
  });

  return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
}

// Exchange code for token
export async function exchangeCodeForToken(code: string): Promise<DiscordAuthData> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/discord/callback`;

  if (!clientId || !clientSecret) {
    throw new Error('Discord client credentials not configured');
  }

  const response = await fetch('https://discord.com/api/oauth2/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to exchange code for token: ${error}`);
  }

  return response.json();
}

// Get guild info where bot was added
export async function getGuildInfo(accessToken: string): Promise<DiscordGuild[]> {
  const response = await fetch('https://discord.com/api/users/@me/guilds', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch guild information');
  }

  return response.json();
}

// Send message to Discord channel
export async function sendDiscordMessage(
  channelId: string,
  message: DiscordMessage
): Promise<void> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  
  if (!botToken) {
    throw new Error('Discord bot token not configured');
  }

  const response = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bot ${botToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to send Discord message: ${error}`);
  }
}

// Verify Discord webhook signature
export function verifyDiscordSignature(
  rawBody: string,
  signature: string,
  timestamp: string,
  publicKey: string
): boolean {
  try {
    // Discord signatures are 64 bytes (128 hex characters)
    if (signature.length !== 128) {
      console.error('Invalid signature length:', signature.length, 'expected 128');
      return false;
    }

    // Discord public keys are 32 bytes (64 hex characters)
    if (publicKey.length !== 64) {
      console.error('Invalid public key length:', publicKey.length, 'expected 64');
      return false;
    }

    const timestampBuffer = Buffer.from(timestamp, 'utf8');
    const bodyBuffer = Buffer.from(rawBody, 'utf8');
    const message = Buffer.concat([timestampBuffer, bodyBuffer]);
    
    const signatureBuffer = Buffer.from(signature, 'hex');
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    
    // Verify the signature length is exactly 64 bytes
    if (signatureBuffer.length !== 64) {
      console.error('Signature buffer length:', signatureBuffer.length, 'expected 64');
      return false;
    }

    // Verify the public key length is exactly 32 bytes  
    if (publicKeyBuffer.length !== 32) {
      console.error('Public key buffer length:', publicKeyBuffer.length, 'expected 32');
      return false;
    }
    
    return sign.detached.verify(message, signatureBuffer, publicKeyBuffer);
  } catch (error) {
    console.error('Error verifying Discord signature:', error);
    return false;
  }
}

// Create Discord client helper
export function createDiscordClient() {
  return {
    send: sendDiscordMessage,
  };
} 