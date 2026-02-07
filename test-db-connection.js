import 'dotenv/config';
import postgres from 'postgres';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env file');
    process.exit(1);
}

console.log('🔍 Testing Supabase connection...');

const url = new URL(DATABASE_URL);
const hostname = url.hostname;

console.log(`📍 Host: ${hostname}`);


const sql = postgres(DATABASE_URL, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
    connect_timeout: 20,
    max: 1,
});

try {
    console.log('🔌 Attempting to connect...');
    const result = await sql`SELECT version(), current_database(), current_user`;

    console.log('\n✅ Connection successful!');
    console.log('📊 Database:', result[0].current_database);
    console.log('👤 User:', result[0].current_user);
    console.log('🗄️  PostgreSQL version:', result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1]);

    // Test table access
    const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    LIMIT 5
  `;

    console.log('\n📋 Sample tables:');
    tables.forEach(t => console.log('  -', t.table_name));

    await sql.end();
    console.log('\n🎉 All tests passed!');
    process.exit(0);

} catch (error) {
    console.error('\n❌ Connection failed!');
    console.error('Error:', error.message);
    if (error.code) console.error('Code:', error.code);
    await sql.end();
    process.exit(1);
}
