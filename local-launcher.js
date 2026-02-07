import { resolve4 } from 'dns/promises';
import { spawn } from 'child_process';
import { URL } from 'url';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

async function start() {
    let dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.error('DATABASE_URL is not set');
        process.exit(1);
    }

    try {
        const url = new URL(dbUrl);
        const hostname = url.hostname;

        console.log(`[Local Launcher] Resolving IPv4 for ${hostname}...`);
        const addresses = await resolve4(hostname);

        if (addresses && addresses.length > 0) {
            console.log(`[Local Launcher] Found IPv4: ${addresses[0]}`);
            url.hostname = addresses[0];
            dbUrl = url.toString();
            console.log(`[Local Launcher] DATABASE_URL updated with IP.`);
        }
    } catch (err) {
        console.warn(`[Local Launcher] DNS resolution failed: ${err.message}`);
    }

    console.log('[Local Launcher] Starting dev server on port 5003...');

    // Windows compatibility: use npm.cmd, and use shell option
    const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';

    const child = spawn(npmCmd, ['run', 'dev'], {
        stdio: 'inherit',
        shell: true,
        env: { 
            ...process.env, 
            DATABASE_URL: dbUrl,
            PORT: '5003',
            NODE_ENV: 'development',
            USE_MEMORY_SESSION: 'true'
        }
    });

    child.on('exit', (code) => {
        process.exit(code || 0);
    });
}

start();
