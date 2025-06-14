import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { db } from './db';

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Types
export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  plan: string;
  emailVerified: boolean;
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
      include: { user: true }
    });

    if (!session || session.expiresAt < new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      plan: session.user.plan,
      emailVerified: session.user.emailVerified
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

// Create session
export async function createSession(userId: string, userAgent?: string, ipAddress?: string): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  const token = signToken({
    userId: user.id,
    email: user.email
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
