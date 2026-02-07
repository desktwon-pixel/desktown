import 'dotenv/config';
import fetch from 'node-fetch';

async function test() {
    const baseUrl = 'http://localhost:5000'; // Assuming server is running locally for test
    try {
        console.log('🔍 Testing public services endpoint...');
        const res = await fetch(`${baseUrl}/api/public/services`);
        if (res.ok) {
            const data = await res.json();
            console.log(`✅ Success! Found ${data.length} services.`);
            console.log('Sample:', data.slice(0, 1));
        } else {
            console.error(`❌ Failed: ${res.status} ${res.statusText}`);
        }
    } catch (e) {
        console.log('⚠️ Server not reachable locally. This is expected if the server isn''t running.');
        console.log('Checking database counts instead...');

        // Final DB check
        const postgres = (await import('postgres')).default;
        const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });
        const offices = await sql`SELECT count(*) FROM offices`;
        const services = await sql`SELECT count(*) FROM office_services`;
        console.log(`📊 DB Status: ${offices[0].count} Offices, ${services[0].count} Services.`);
        await sql.end();
    }
}

test();
