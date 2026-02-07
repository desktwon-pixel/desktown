
import { db } from "../server/db.ts";
import { users } from "../shared/schema.ts";
import { storage } from "../server/storage.ts";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function main() {
  try {
    console.log("Checking for users...");
    const allUsers = await storage.getAllUsers();
    console.log(`Found ${allUsers.length} users.`);

    if (allUsers.length === 0) {
      console.log("No users found. Creating initial admin user...");
      const hashedPassword = await hashPassword("admin123");
      const adminUser = await storage.upsertUser({
        username: "admin",
        password: hashedPassword,
        email: "admin@desktown.app",
        firstName: "Admin",
        lastName: "User",
        role: "admin",
        status: "online",
        profileImageUrl: "https://ui-avatars.com/api/?name=Admin&background=random"
      });
      console.log("Admin user created successfully:", adminUser.username);
    } else {
      console.log("Users existing in database:");
      allUsers.forEach(u => console.log(`- ${u.username} (${u.role})`));
    }
  } catch (error) {
    console.error("Error checking/creating users:", error);
  } finally {
    process.exit(0);
  }
}

main();
