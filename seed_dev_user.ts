
import 'dotenv/config';
import { storage } from "./server/storage";

async function seed() {
    console.log("Checking for dev user...");
    const devUser = await storage.getUser("dev-user-id");
    if (!devUser) {
        console.log("Dev user not found. Creating...");
        await storage.upsertUser({
            id: "dev-user-id",
            email: "dev@desktown.local",
            firstName: "Dev",
            lastName: "User",
            profileImageUrl: "https://via.placeholder.com/150",
            role: "admin",
            status: "online",
            lastSeenAt: new Date(),
        });
        console.log("Dev user created successfully with Admin role.");
    } else {
        console.log("Dev user already exists.");
    }
    process.exit(0);
}

seed().catch(err => {
    console.error(err);
    process.exit(1);
});
