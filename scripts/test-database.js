const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testDatabase() {
  console.log('🧪 Testing Database Connection and Data...\n');

  try {
    // Test 1: Database Connection
    console.log('1️⃣ Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Test 2: Count Users
    console.log('2️⃣ Counting users in database...');
    const userCount = await prisma.user.count();
    console.log(`✅ Found ${userCount} users in database\n`);

    // Test 3: List Recent Users
    console.log('3️⃣ Listing recent users...');
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        emailVerified: true,
        createdAt: true
      }
    });
    
    console.log('Recent users:');
    recentUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} (${user.email}) - ${user.plan} - ${user.createdAt.toISOString()}`);
    });
    console.log('');

    // Test 4: Count Sessions
    console.log('4️⃣ Counting active sessions...');
    const sessionCount = await prisma.session.count();
    console.log(`✅ Found ${sessionCount} sessions in database\n`);

    // Test 5: Test Database Schema
    console.log('5️⃣ Testing database schema...');
    const tables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    
    console.log('Database tables:');
    tables.forEach((table, index) => {
      console.log(`  ${index + 1}. ${table.table_name}`);
    });
    console.log('');

    // Test 6: Test User Creation (and cleanup)
    console.log('6️⃣ Testing user creation and cleanup...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test-cleanup@example.com',
        name: 'Test Cleanup User',
        passwordHash: 'test-hash',
        plan: 'FREE'
      }
    });
    console.log(`✅ Created test user: ${testUser.id}`);
    
    // Clean up test user
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Cleaned up test user\n');

    console.log('🎉 All database tests passed!');

  } catch (error) {
    console.error('❌ Database test failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testDatabase(); 