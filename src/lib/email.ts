import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

// Initialize SES client conditionally
let sesClient: SESClient | null = null;

if (process.env.EXECUTA_AWS_ACCESS_KEY_ID && process.env.EXECUTA_AWS_SECRET_ACCESS_KEY) {
  sesClient = new SESClient({
    region: process.env.EXECUTA_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.EXECUTA_AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.EXECUTA_AWS_SECRET_ACCESS_KEY,
    },
  });
}

export interface SendEmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
}

export async function sendEmail({ to, subject, htmlBody, textBody }: SendEmailOptions) {
  if (!sesClient) {
    throw new Error('AWS SES not configured - email credentials not available');
  }
  
  const fromEmail = process.env.AWS_SES_FROM_EMAIL || 'noreply@yourdomain.com';
  
  try {
    const command = new SendEmailCommand({
      Source: fromEmail,
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Html: {
            Data: htmlBody,
            Charset: 'UTF-8',
          },
          ...(textBody && {
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          }),
        },
      },
    });

    const result = await sesClient.send(command);
    console.log('✅ Email sent successfully:', {
      messageId: result.MessageId,
      to: to.substring(0, 3) + '***'
    });
    
    return {
      success: true,
      messageId: result.MessageId,
    };
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw new Error('Failed to send email');
  }
}

export function generatePasswordResetEmail(
  recipientName: string,
  resetUrl: string,
  expirationHours: number = 1
) {
  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Your Password</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo h1 {
            color: #3B82F6;
            margin: 0;
            font-size: 28px;
            font-weight: bold;
        }
        .content {
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: #3B82F6;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 25px 0;
            font-size: 16px;
        }
        .button:hover {
            background-color: #2563EB;
        }
        .warning {
            background-color: #FEF3CD;
            border: 1px solid #FBBF24;
            border-radius: 6px;
            padding: 15px;
            margin: 25px 0;
            font-size: 14px;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            font-size: 12px;
            color: #6B7280;
            text-align: center;
        }
        .backup-link {
            background-color: #F3F4F6;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
            font-size: 14px;
            word-break: break-all;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>Executa</h1>
        </div>
        
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>Hello ${recipientName},</p>
            <p>We received a request to reset your password for your Executa account. Click the button below to create a new password:</p>
            
            <a href="${resetUrl}" class="button">Reset Your Password</a>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in ${expirationHours} hour${expirationHours > 1 ? 's' : ''} and can only be used once.
                If you didn't request this password reset, please ignore this email.
            </div>
            
            <p>If the button above doesn't work, copy and paste this link into your browser:</p>
            <div class="backup-link">
                ${resetUrl}
            </div>
            
            <p>If you're having trouble, please contact our support team.</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by Executa.<br>
            If you didn't request this password reset, please ignore this email.</p>
        </div>
    </div>
</body>
</html>
  `.trim();

  const textBody = `
Reset Your Password - Executa

Hello ${recipientName},

We received a request to reset your password for your Executa account.

To reset your password, click this link:
${resetUrl}

This link will expire in ${expirationHours} hour${expirationHours > 1 ? 's' : ''} and can only be used once.

If you didn't request this password reset, please ignore this email.

If you're having trouble with the link, copy and paste it into your browser.

Thanks,
The Executa Team
  `.trim();

  return {
    subject: 'Reset Your Executa Password',
    htmlBody,
    textBody,
  };
}

// Test email function for development
export async function sendTestEmail(to: string) {
  const testEmailContent = generatePasswordResetEmail(
    'Test User',
    'https://yourapp.com/reset-password?token=test-token-123',
    1
  );

  return sendEmail({
    to,
    subject: '[TEST] ' + testEmailContent.subject,
    htmlBody: testEmailContent.htmlBody,
    textBody: testEmailContent.textBody,
  });
} 