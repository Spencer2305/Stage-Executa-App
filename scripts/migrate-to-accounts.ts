import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const db = new PrismaClient();

async function migrateToAccounts() {
  console.log('🚀 Starting migration to account-based structure...');

  try {
    // Create a default account for new installations
    const defaultAccount = await db.account.create({
      data: {
        name: 'Default Organization',
        slug: 'default',
        accountId: `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
        plan: 'FREE',
        billingEmail: null
      }
    });

    console.log(`✅ Created default account: ${defaultAccount.accountId}`);

    // Since we just reset the database, there won't be existing users
    // But this script is ready for future migrations
    const existingUsers = await db.user.findMany();

    for (const user of existingUsers) {
      // Create individual account for each existing user
      const userAccount = await db.account.create({
        data: {
          name: `${user.name}'s Organization`,
          slug: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, ''),
          accountId: `acc_${uuidv4().replace(/-/g, '').substring(0, 16)}`,
          plan: user.plan,
          billingEmail: user.email
        }
      });

      // Update user to belong to their account
      await db.user.update({
        where: { id: user.id },
        data: {
          accountId: userAccount.id,
          role: 'OWNER' // Original users become owners
        }
      });

      console.log(`✅ Created account for user ${user.email}: ${userAccount.accountId}`);
    }

    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await db.$disconnect();
  }
}

if (require.main === module) {
  migrateToAccounts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default migrateToAccounts; 