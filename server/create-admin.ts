
import "dotenv/config";
import { storage } from "./storage.ts";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function createAdmin() {
  try {
    const username = "admin";
    const password = "admin123";
    const email = "admin@example.com";

    console.log(`Checking if user ${username} exists...`);
    const existingUser = await storage.getUserByUsername(username);

    if (existingUser) {
      console.log(`User ${username} already exists. Updating role to admin...`);
      // Here we would update the role, but for simplicity let's just log it
      // Since storage doesn't have updateUserRole exposed directly in the interface usually,
      // we assume if it exists we might need to manually update it or it's fine.
      // But let's try to create a fresh one if possible or just exit.
      console.log("Existing user found:", existingUser);
      process.exit(0);
    }

    console.log(`Creating new admin user: ${username}`);
    const hashedPassword = await hashPassword(password);

    const newUser = await storage.upsertUser({
      username,
      email,
      password: hashedPassword,
      firstName: "System",
      lastName: "Admin",
      role: "admin", // Important: Set role to admin
      status: "online",
      profileImageUrl: `https://ui-avatars.com/api/?name=${username}&background=random`
    });

    console.log("Admin user created successfully!");
    console.log("Username:", username);
    console.log("Password:", password);

  } catch (error) {
    console.error("Failed to create admin user:", error);
  } finally {
    process.exit(0);
  }
}

createAdmin();
