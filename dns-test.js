import dns from 'dns/promises';

async function diagnose() {
    const host = 'db.imzjapteeyxumnevnxmu.supabase.co';
    console.log(`Resolving ${host}...`);

    try {
        const ipv4 = await dns.resolve4(host);
        console.log('IPv4 addresses:', ipv4);
    } catch (err) {
        console.warn('IPv4 Resolution failed:', err.message);
    }

    try {
        const ipv6 = await dns.resolve6(host);
        console.log('IPv6 addresses:', ipv6);
    } catch (err) {
        console.error('IPv6 Resolution failed:', err.message);
    }
}

diagnose();
