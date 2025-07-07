import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from './auth';
import crypto from 'crypto';

// Environment validation - called at startup
export function validateSecurityEnvironment(): void {
  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    console.error('🚨 CRITICAL SECURITY ERROR: Missing required environment variables:');
    missing.forEach(envVar => console.error(`   - ${envVar}`));
    console.error('Application cannot start without these security-critical environment variables.');
    process.exit(1);
  }

  if (jwtSecret.length < 32) {
    process.exit(1);
  }

  if (jwtSecret === 'fallback-secret' || jwtSecret === 'your-secret-key' || jwtSecret === 'secret') {
    process.exit(1);
  }

  console.log('✅ Security environment validation passed');
}

// Secure JWT verification without fallback
export function secureVerifyToken(token: string): any {
  if (!jwtSecret) {
  }
  
  return verifyToken(token);
}

// Rate limiting storage interface
interface RateLimitStore {
  get(key: string): Promise<number | null>;
  set(key: string, value: number, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<number>;
}

// In-memory store (development only)
class MemoryStore implements RateLimitStore {
  private store = new Map<string, { value: number; expires: number }>();

  async get(key: string): Promise<number | null> {
    const item = this.store.get(key);
    if (!item || item.expires < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return item.value;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    this.store.set(key, { value, expires: Date.now() + ttl * 1000 });
  }

  async increment(key: string, ttl: number): Promise<number> {
    const current = await this.get(key);
    const newValue = (current || 0) + 1;
    await this.set(key, newValue, ttl);
    return newValue;
  }
}

// Redis store (production recommended)
class RedisStore implements RateLimitStore {
  private redis: any;

  constructor(redisClient: any) {
    this.redis = redisClient;
  }

  async get(key: string): Promise<number | null> {
    const value = await this.redis.get(key);
    return value ? parseInt(value, 10) : null;
  }

  async set(key: string, value: number, ttl: number): Promise<void> {
    await this.redis.setex(key, ttl, value);
  }

  async increment(key: string, ttl: number): Promise<number> {
    const multi = this.redis.multi();
    multi.incr(key);
    multi.expire(key, ttl);
    const results = await multi.exec();
    return results[0][1];
  }
}

// Production-ready rate limiting configuration
const RATE_LIMIT_CONFIG = {
  // API endpoints
  api: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // Authentication endpoints (stricter)
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 login attempts per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true, // Don't count successful requests
  },
  
  // Chat endpoints
  chat: {
    windowMs: 60 * 1000, // 1 minute
    max: 30, // limit each IP to 30 chat messages per minute
    standardHeaders: true,
    legacyHeaders: false,
  },
  
  // File upload endpoints
  upload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // limit each IP to 10 file uploads per hour
    standardHeaders: true,
    legacyHeaders: false,
  }
};

// Rate limiting store (use Redis in production)
let rateLimitStore: RateLimitStore;

if (process.env.NODE_ENV === 'production' && process.env.REDIS_URL) {
  // TODO: Initialize Redis store in production
  // const redis = require('redis').createClient(process.env.REDIS_URL);
  // rateLimitStore = new RedisStore(redis);
  console.warn('⚠️  PRODUCTION SECURITY: Redis rate limiting not configured. Using memory store (not suitable for production clusters)');
  rateLimitStore = new MemoryStore();
} else {
  rateLimitStore = new MemoryStore();
}

// Rate limiting function
export async function rateLimit(
  identifier: string,
  limit: number = 100,
  windowMs: number = 15 * 60 * 1000
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
  const key = `rate_limit:${identifier}`;
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const windowKey = `${key}:${windowStart}`;
  
  try {
    const count = await rateLimitStore.increment(windowKey, Math.ceil(windowMs / 1000));
    const remaining = Math.max(0, limit - count);
    const resetTime = windowStart + windowMs;
    
    return {
      allowed: count <= limit,
      remaining,
      resetTime
    };
  } catch (error) {
    console.error('Rate limiting error:', error);
    // Fail open in case of rate limit storage issues
    return { allowed: true, remaining: limit, resetTime: Date.now() + windowMs };
  }
}

// Get rate limit configuration by type
export function getRateLimitConfig(type: 'api' | 'auth' | 'chat' | 'upload') {
  return RATE_LIMIT_CONFIG[type];
}

// Export rate limit configs for direct access
export const RATE_LIMIT_CONFIGS = {
  AUTH: RATE_LIMIT_CONFIG.auth,
  API: RATE_LIMIT_CONFIG.api,
  CHAT: RATE_LIMIT_CONFIG.chat,
  UPLOAD: RATE_LIMIT_CONFIG.upload,
  PASSWORD_RESET: RATE_LIMIT_CONFIG.auth, // Use same config as auth
};

// Higher-order function to apply rate limiting to route handlers
export function withRateLimit(
  config: { windowMs: number; max: number },
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Get IP address for rate limiting
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded ? forwarded.split(',')[0] : realIp || 'unknown';
    
    // Apply rate limiting
    const rateLimitResult = await rateLimit(ip, config.max, config.windowMs);
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
          }
        }
      );
    }
    
    // Call the original handler
    return handler(request);
  };
}

// Security headers configuration
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://app.executa.ai https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://app.executa.ai https://api.stripe.com https://*.stripe.com wss: ws:",
    "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
  ].join('; '),
  
  // Security headers
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // HSTS (only in production with HTTPS)
  ...(process.env.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  })
};

// Apply security headers to response
export function applySecurityHeaders(headers: Headers): void {
  Object.entries(SECURITY_HEADERS).forEach(([name, value]) => {
    headers.set(name, value);
  });
}

// Validate and sanitize user input
export function validateInput(input: string, maxLength: number = 1000): string {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: must be a non-empty string');
  }
  
  if (input.length > maxLength) {
    throw new Error(`Input too long: maximum ${maxLength} characters allowed`);
  }
  
  // Remove potential XSS patterns
  const sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
    
  return sanitized;
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Hash sensitive data
export function hashSensitiveData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Validate file upload security
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // File size limit (10MB)
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 10MB limit' };
  }
  
  // Allowed file types
  const ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/json',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ];
  
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  // Validate file extension matches MIME type
  const extension = file.name.toLowerCase().split('.').pop();
  const mimeToExt: Record<string, string[]> = {
    'application/pdf': ['pdf'],
    'text/plain': ['txt'],
    'text/csv': ['csv'],
    'application/json': ['json'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/gif': ['gif'],
    'image/webp': ['webp']
  };
  
  const validExtensions = mimeToExt[file.type];
  if (!validExtensions || !extension || !validExtensions.includes(extension)) {
    return { valid: false, error: 'File extension does not match file type' };
  }
  
  return { valid: true };
}

// Check if IP is from a known proxy/VPN (basic implementation)
export function isProxyIP(ip: string): boolean {
  // Add your proxy/VPN detection logic here
  // This is a basic implementation - consider using a service like IPQualityScore
  const knownProxyRanges = [
    // Add known proxy IP ranges here
  ];
  
  return false; // Placeholder
}

// Production security checklist
export const PRODUCTION_SECURITY_CHECKLIST = {
  required: [
    'DATABASE_URL uses SSL in production',
    'REDIS_URL configured for rate limiting',
    'All API keys stored in environment variables',
    'HTTPS enabled with valid SSL certificate',
    'Security headers configured',
    'Rate limiting implemented',
    'Input validation on all endpoints',
    'File upload restrictions in place',
    'SQL injection protection with Prisma',
    'XSS protection implemented',
    'CSRF protection enabled'
  ],
  recommended: [
    'Content Security Policy configured',
    'Dependency vulnerability scanning',
    'Error logging and monitoring',
    'Backup and disaster recovery plan',
    'DDoS protection (Cloudflare/AWS)',
    'Web Application Firewall (WAF)',
    'Regular security audits',
    'Penetration testing'
  ]
};

// Export production configuration check
export function checkProductionSecurity(): { passed: string[]; failed: string[] } {
  const passed: string[] = [];
  const failed: string[] = [];
  
  // Check environment variables
  
  if (process.env.DATABASE_URL?.includes('ssl=true')) passed.push('DATABASE_URL uses SSL in production');
  else failed.push('DATABASE_URL uses SSL in production');
  
  if (process.env.REDIS_URL) passed.push('REDIS_URL configured for rate limiting');
  else failed.push('REDIS_URL configured for rate limiting');
  
  // Add more checks as needed
  
  return { passed, failed };
} 