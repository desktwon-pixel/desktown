import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from "../shared/schema.ts";
import dns from 'dns';

// Let Node decide DNS order automatically for IPv6 support
// dns.setDefaultResultOrder('ipv4first'); 


const connectionString = process.env.DATABASE_URL!;

// We use the connection string directly. 
// The dns.setDefaultResultOrder('ipv4first') above handles the IPv6/IPv4 preference 
// which is the root cause of ENOTFOUND on Render.
export const sql = postgres(connectionString, {
  prepare: false,
  ssl: { rejectUnauthorized: false },
  connect_timeout: 30,
  max: 20,
  idle_timeout: 20,
  onnotice: () => { }
});

console.log("[DB] Database connection initialized using postgres.js");

export const db = drizzle(sql, { schema, logger: true });
