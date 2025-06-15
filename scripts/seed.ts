import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/auth';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  try {
    // Create test account
    const testAccount = await prisma.account.create({
      data: {
        name: 'Test Organization',
        slug: 'test-org',
        accountId: `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        plan: 'PRO',
        billingEmail: 'admin@test.com'
      }
    });

    console.log(`✅ Created test account: ${testAccount.accountId}`);

    // Create test user
    const passwordHash = await hashPassword('Test123!');
    const testUser = await prisma.user.create({
      data: {
        accountId: testAccount.id,
        email: 'admin@test.com',
        passwordHash,
        name: 'Test Admin',
        role: 'OWNER',
        emailVerified: true
      }
    });

    console.log(`✅ Created test user: ${testUser.email}`);

    // Create a processing session
    const processingSession = await prisma.fileProcessingSession.create({
      data: {
        accountId: testAccount.accountId,
        userId: testUser.id,
        sessionName: 'Initial Knowledge Base Setup',
        status: 'COMPLETED',
        totalFiles: 0,
        processedFiles: 0,
        errorFiles: 0,
        startedAt: new Date(),
        completedAt: new Date()
      }
    });

    console.log(`✅ Created processing session: ${processingSession.id}`);

    // Create test assistant
    const testAssistant = await prisma.assistant.create({
      data: {
        accountId: testAccount.accountId,
        name: 'Test AI Assistant',
        description: 'A test AI assistant for demo purposes',
        instructions: 'You are a helpful AI assistant. Answer questions based on the provided knowledge base.',
        status: 'ACTIVE',
        model: 'gpt-4-turbo',
        isPublic: false,
        totalSessions: 0,
        totalMessages: 0
      }
    });

    console.log(`✅ Created test assistant: ${testAssistant.id}`);

    console.log('🎉 Database seeding completed successfully!');
    console.log(`
📋 Test Data Summary:
- Account ID: ${testAccount.accountId}
- User: ${testUser.email} (password: Test123!)
- Assistant: ${testAssistant.name}
    `);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1)); 