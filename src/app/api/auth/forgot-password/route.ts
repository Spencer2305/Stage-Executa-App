import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateEmail } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/security';
import { sendEmail, generatePasswordResetEmail } from '@/lib/email';

async function handleForgotPassword(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { email } = body;

    // Validation
    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    // For security, always return success even if user doesn't exist
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`🔍 Password reset requested for non-existent user: ${email.substring(0, 3)}***`);
      return NextResponse.json({
        message: 'If an account with this email exists, we have sent password reset instructions.'
      });
    }

    // Generate reset token
    const resetToken = uuidv4();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Token expires in 1 hour

    // Store reset token in database
    await db.passwordReset.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        token: resetToken,
        expiresAt,
      },
      update: {
        token: resetToken,
        expiresAt,
        used: false,
      },
    });

    // Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    
    try {
      const emailContent = generatePasswordResetEmail(user.name, resetUrl, 1);
      
      await sendEmail({
        to: user.email,
        subject: emailContent.subject,
        htmlBody: emailContent.htmlBody,
        textBody: emailContent.textBody,
      });

      console.log(`📧 Password reset email sent to: ${user.email.substring(0, 3)}***`);
         } catch (emailError) {
       console.error(`❌ Failed to send password reset email to ${user.email.substring(0, 3)}***:`, {
         error: emailError,
         message: emailError instanceof Error ? emailError.message : String(emailError),
         stack: emailError instanceof Error ? emailError.stack : undefined
       });
       
       // Don't fail the request if email sending fails - for better UX
       // You might want to implement a retry mechanism or queue
     }

    // In development, also log the reset URL for easy testing
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔗 DEV MODE: Password reset URL: ${resetUrl}`);
    }

    console.log(`✅ Password reset token generated for user: ${user.email.substring(0, 3)}***`);

    return NextResponse.json({
      message: 'If an account with this email exists, we have sent password reset instructions.',
      ...(process.env.NODE_ENV === 'development' && { resetUrl }) // Include reset URL in dev mode
    });

  } catch (error) {
    console.error('🚫 Forgot password error:', {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    
    return NextResponse.json(
      { 
        error: 'Failed to process password reset request. Please try again.',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : String(error) : undefined
      },
      { status: 500 }
    );
  }
}

// Apply rate limiting to prevent abuse
export const POST = withRateLimit(RATE_LIMIT_CONFIGS.AUTH, handleForgotPassword); 