import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function createUser() {
  console.log('👤 Creating user account for spencersnow@me.com...');

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'spencersnow@me.com' }
    });

    if (existingUser) {
      console.log('ℹ️  User already exists. Skipping creation.');
      return;
    }

    // Create account first
    const account = await prisma.account.create({
      data: {
        name: 'Spencer Snow Organization',
        slug: 'spencer-snow',
        accountId: `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        plan: 'PRO',
        billingEmail: 'spencersnow@me.com'
      }
    });

    console.log(`✅ Created account: ${account.accountId}`);

    // Create user with a secure default password
    const defaultPassword = 'Executa2025!';
    const passwordHash = await hashPassword(defaultPassword);
    
    const user = await prisma.user.create({
      data: {
        accountId: account.id,
        email: 'spencersnow@me.com',
        passwordHash,
        name: 'Spencer Snow',
        role: 'OWNER',
        emailVerified: true
      }
    });

    console.log(`✅ Created user: ${user.email}`);

    // Create a default assistant
    const assistant = await prisma.assistant.create({
      data: {
        accountId: account.id,
        name: 'My AI Assistant',
        description: 'Your personal AI assistant powered by Executa',
        instructions: 'You are a helpful AI assistant. Answer questions based on the provided knowledge base and be professional and friendly.',
        status: 'ACTIVE',
        model: 'gpt-4-turbo',
        isPublic: false,
        totalSessions: 0,
        totalMessages: 0
      }
    });

    console.log(`✅ Created default assistant: ${assistant.name}`);

    console.log(`
🎉 User setup completed successfully!

📋 Login Credentials:
- Email: spencersnow@me.com
- Password: ${defaultPassword}
- Account: ${account.name}
- Account ID: ${account.accountId}

🔐 Security Note: Please change your password after first login!

🚀 You can now:
1. Login at: http://localhost:3000/login
2. Access dashboard at: http://localhost:3000/dashboard
3. Start building AI assistants!
    `);

  } catch (error) {
    console.error('❌ User creation failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 