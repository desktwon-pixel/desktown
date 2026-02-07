import { resolve4 } from 'dns/promises';
import { spawn } from 'child_process';
import { URL } from 'url';

async function start() {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    try {
        const url = new URL(dbUrl);
        const hostname = url.hostname;

        console.log(`[Launcher] Resolving IPv4 for ${hostname}...`);
        const addresses = await resolve4(hostname);

        if (addresses && addresses.length > 0) {
            console.log(`[Launcher] Found IPv4: ${addresses[0]}`);
            url.hostname = addresses[0];
            process.env.DATABASE_URL = url.toString();
            console.log(`[Launcher] DATABASE_URL updated with IP.`);
        }
    } catch (err) {
        console.warn(`[Launcher] DNS resolution failed or skipped: ${err.message}`);
    }

    console.log('[Launcher] Starting application...');

    const child = spawn('node', ['dist/index.cjs'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--dns-result-order=ipv4first' }
    });

    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}

start();
