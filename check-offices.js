import 'dotenv/config';
import postgres from 'postgres';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set');
    process.exit(1);
}

const sql = postgres(DATABASE_URL, {
    prepare: false,
    ssl: { rejectUnauthorized: false },
});

try {
    console.log('🔍 Checking offices table...');
    const result = await sql`SELECT count(*) FROM offices`;
    console.log('✅ Columns or Count:', result);

    const samples = await sql`SELECT * FROM offices LIMIT 5`;
    console.log('📋 Sample offices:', samples);

    await sql.end();
} catch (error) {
    console.error('❌ Error checking offices:', error.message);
    await sql.end();
}
