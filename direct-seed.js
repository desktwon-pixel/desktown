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

async function run() {
    try {
        console.log('🚀 Starting robust SQL seed...');

        const adminId = 'dev-user-id';

        // 1. Ensure Admin User exists
        console.log('👤 Ensuring admin user exists...');
        await sql`
            INSERT INTO users (id, email, first_name, last_name, role, status)
            VALUES (${adminId}, 'admin@desktown.com', 'Admin', 'User', 'admin', 'online')
            ON CONFLICT (id) DO NOTHING
        `;

        // 2. Create Offices
        console.log('🏢 Seeding offices...');
        const officesData = [
            { name: 'Finance Pro', slug: 'finance-pro', description: 'Expert financial consulting services.', category: 'finance' },
            { name: 'Legal Hub', slug: 'legal-hub', 'description': 'Top-tier legal services.', category: 'legal' },
            { name: 'IT Solutions', slug: 'it-solutions', 'description': 'Managed IT and cloud services.', category: 'tech' }
        ];

        for (const office of officesData) {
            const [inserted] = await sql`
                INSERT INTO offices (name, slug, description, category, owner_id, is_published, subscription_status)
                VALUES (${office.name}, ${office.slug}, ${office.description}, ${office.category}, ${adminId}, true, 'active')
                ON CONFLICT (slug) DO UPDATE SET is_published = true, subscription_status = 'active'
                RETURNING id, slug
            `;

            console.log(`✅ Office created: ${inserted.slug} (ID: ${inserted.id})`);

            // 3. Create Services for this office
            console.log(`🛠️ Seeding services for ${inserted.slug}...`);
            const services = [
                { title: `${inserted.slug.split('-')[0].toUpperCase()} Premium Service`, description: 'High quality professional service.', price: 2500, type: 'fixed' },
                { title: `${inserted.slug.split('-')[0].toUpperCase()} Consultation`, description: 'Hourly advice session.', price: 400, type: 'hourly' }
            ];

            for (const s of services) {
                await sql`
                    INSERT INTO office_services (office_id, title, description, price, price_type, category, is_active, is_featured)
                    VALUES (${inserted.id}, ${s.title}, ${s.description}, ${s.price}, ${s.type}, ${office.category}, true, true)
                `;
            }
        }

        console.log('🎉 Seed complete! Offices and Services are now in the database.');
        await sql.end();
    } catch (e) {
        console.error('❌ SQL Seed failed:', e.stack || e.message);
        await sql.end();
        process.exit(1);
    }
}

run();
