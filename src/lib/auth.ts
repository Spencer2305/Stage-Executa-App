import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from './db';
import { v4 as uuidv4 } from 'uuid';
import { validateSecurityEnvironment } from './security';

// Validate security environment on module load
if (typeof window === 'undefined') { // Only run on server side
  validateSecurityEnvironment();
}

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  accountId: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  bio?: string;
  company?: string;
  website?: string;
  role: string;
  emailVerified: boolean;
  account: {
    id: string;
    accountId: string;
    name: string;
    plan: string;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
    subscriptionStatus?: string | null;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
  };
}

// Password utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// JWT utilities
export function signToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
    expiresIn: JWT_EXPIRES_IN 
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JWTPayload | null {
  try {
  } catch (error) {
    return null;
  }
}

// Request authentication
export async function authenticateRequest(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return null;
    }

    // Check if session exists and is valid
    const session = await db.session.findUnique({
      where: { token },
      include: { 
        user: {
          include: {
            account: true
          }
        }
      }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.avatar || undefined,
      bio: session.user.bio || undefined,
      company: session.user.company || undefined,
      website: session.user.website || undefined,
      role: session.user.role,
      emailVerified: session.user.emailVerified,
      account: {
        id: session.user.account.id,
        accountId: session.user.account.accountId,
        name: session.user.account.name,
        plan: session.user.account.plan,
        stripeCustomerId: session.user.account.stripeCustomerId,
        stripeSubscriptionId: session.user.account.stripeSubscriptionId,
        subscriptionStatus: session.user.account.subscriptionStatus,
        currentPeriodStart: session.user.account.currentPeriodStart,
        currentPeriodEnd: session.user.account.currentPeriodEnd,
      }
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Create session
export async function createSession(
  userId: string, 
  userAgent?: string, 
  ipAddress?: string
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { account: true }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    accountId: user.account.accountId
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now

  await db.session.create({
    data: {
      userId,
      token,
      expiresAt,
      userAgent,
      ipAddress
    }
  });

  return token;
}

// Delete session (logout)
export async function deleteSession(token: string): Promise<void> {
  await db.session.deleteMany({
    where: { token }
  });
}

// Create account and user (for registration)
export async function createAccountAndUser(
  email: string,
  password: string,
  name: string,
  organizationName?: string
): Promise<{ user: AuthUser; token: string }> {
  // Hash password (for OAuth users, password will be empty string)
  const passwordHash = password ? await hashPassword(password) : '';

  // Generate account ID
  const accountId = `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`;
  const baseSlug = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
  const slug = `${baseSlug}-${uuidv4().substring(0, 8)}`; // Make slug unique

  // Create account and user in a transaction
  const result = await db.$transaction(async (tx) => {
    // Create account
    const account = await tx.account.create({
      data: {
        name: organizationName || `${name}'s Organization`,
        slug: slug,
        accountId: accountId,
        plan: 'FREE',
        billingEmail: email
      }
    });

    // Create user
    const user = await tx.user.create({
      data: {
        accountId: account.id,
        email,
        passwordHash,
        name,
        role: 'OWNER',
        emailVerified: false
      },
      include: {
        account: true
      }
    });

    return { account, user };
  });

  // Create session token
  const token = signToken({
    userId: result.user.id,
    email: result.user.email,
    accountId: result.account.accountId
  });

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  await db.session.create({
    data: {
      userId: result.user.id,
      token,
      expiresAt
    }
  });

  const authUser: AuthUser = {
    id: result.user.id,
    email: result.user.email,
    name: result.user.name,
    avatar: result.user.avatar || undefined,
    bio: result.user.bio || undefined,
    company: result.user.company || undefined,
    website: result.user.website || undefined,
    role: result.user.role,
    emailVerified: result.user.emailVerified,
    account: {
      id: result.account.id,
      accountId: result.account.accountId,
      name: result.account.name,
      plan: result.account.plan,
      stripeCustomerId: result.account.stripeCustomerId,
      stripeSubscriptionId: result.account.stripeSubscriptionId,
      subscriptionStatus: result.account.subscriptionStatus,
      currentPeriodStart: result.account.currentPeriodStart,
      currentPeriodEnd: result.account.currentPeriodEnd,
    }
  };

  return { user: authUser, token };
}

// Validation utilities
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Get integration context for AI assistants
export async function getIntegrationContext(accountId: string): Promise<string> {
  try {
    // This function builds context about connected integrations for the AI
    // The AI can then inform users about available integrations and capabilities
    
    const integrationStatus: string[] = [
      "📋 **Available Integrations for this account:**",
      ""
    ];

    // Check for email integrations
    // TODO: Query actual integration status from database
    integrationStatus.push("**Communication:**");
    integrationStatus.push("• Gmail - Connect to import email conversations and customer support data");
    integrationStatus.push("• Slack - Deploy this assistant directly in Slack channels");
    integrationStatus.push("• Microsoft Teams - Enterprise communication integration");
    integrationStatus.push("");

    integrationStatus.push("**Knowledge Management:**");
    integrationStatus.push("• Google Drive - Access documents and files from Google Drive");
    integrationStatus.push("• Dropbox - Connect to Dropbox files and folders");
    integrationStatus.push("• Notion - Import from Notion workspaces and databases");
    integrationStatus.push("");

    integrationStatus.push("**CRM & Support:**");
    integrationStatus.push("• HubSpot - Customer relationship management integration");
    integrationStatus.push("• Salesforce - Enterprise CRM data access");
    integrationStatus.push("• Zendesk - Customer support ticket integration");
    integrationStatus.push("");

    integrationStatus.push("**Productivity:**");
    integrationStatus.push("• Calendly - Schedule meetings and appointments");
    integrationStatus.push("• Trello - Project management and task tracking");
    integrationStatus.push("• Asana - Team collaboration and project coordination");
    integrationStatus.push("");

    integrationStatus.push("📝 *To connect any of these integrations, users can visit the dashboard settings under the 'Integrations' tab.*");

    return integrationStatus.join("\n");
  } catch (error) {
    console.error('Error getting integration context:', error);
    return "Integration information temporarily unavailable.";
  }
}
