import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { connectToPortalMongoDB } from './mongodb';
import PortalUser, { IPortalUser } from '../models/PortalUser';

const JWT_EXPIRES_IN = '7d';

export interface PortalAuthPayload {
  userId: string;
  username: string;
  role: string;
}

// Generate JWT token
export function generatePortalToken(user: IPortalUser): string {
  return jwt.sign(
    {
      userId: user._id.toString(),
      username: user.username,
      role: user.role
    },
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyPortalToken(token: string): PortalAuthPayload | null {
  try {
  } catch (error) {
    return null;
  }
}

// Authenticate portal user from request
export async function authenticatePortalUser(request: NextRequest): Promise<IPortalUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || 
                 request.cookies.get('portal-auth-token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyPortalToken(token);
    if (!payload) {
      return null;
    }

    await connectToPortalMongoDB();
    const user = await PortalUser.findById(payload.userId).select('-password');
    
    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Portal auth error:', error);
    return null;
  }
}

// Login function
export async function loginPortalUser(username: string, password: string): Promise<{ user: IPortalUser; token: string } | null> {
  try {
    await connectToPortalMongoDB();
    
    const user = await PortalUser.findOne({ username: username.toLowerCase() });
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return null;
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    const token = generatePortalToken(user);
    
    // Remove password from returned user
    const userObject = user.toObject();
    delete userObject.password;

    return { 
      user: userObject as IPortalUser, 
      token 
    };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Create default admin user (for setup)
export async function createDefaultAdmin(): Promise<void> {
  try {
    await connectToPortalMongoDB();
    
    const existingAdmin = await PortalUser.findOne({ role: 'admin' });
    if (existingAdmin) {
      return; // Admin already exists
    }

    const adminUser = new PortalUser({
      username: 'admin',
      password: 'admin123', // Change this in production!
      role: 'admin',
      email: 'admin@company.com'
    });

    await adminUser.save();
    console.log('✅ Default admin user created (username: admin, password: admin123)');
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
} 