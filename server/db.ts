import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema.ts";
import dns from 'dns';

// Let Node decide DNS order automatically to support IPv6 projects
// dns.setDefaultResultOrder('ipv4first'); 


const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
  connect_timeout: 30,
  max: 20,
  idle_timeout: 20,
  onnotice: () => { }
});

export const db = drizzle(client, { schema });

