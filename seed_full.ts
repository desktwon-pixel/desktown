
import 'dotenv/config';
import { storage } from "./server/storage";

async function seed() {
    console.log("Seeding initial data...");

    // 1. Create a dev admin if not exists (already done in other script but for safety)
    const adminId = "dev-user-id";
    const user = await storage.getUser(adminId);
    if (!user) {
        await storage.upsertUser({
            id: adminId,
            email: "dev@desktown.local",
            firstName: "Dev",
            lastName: "User",
            role: "admin",
            status: "online",
        });
    }

    // 2. Create some offices
    const existingOffices = await storage.getOffices();
    if (existingOffices.length === 0) {
        console.log("Creating sample offices...");
        await storage.createOffice({
            name: "Finance Pro",
            slug: "finance-pro",
            description: "Expert financial consulting services.",
            category: "finance",
            ownerId: adminId,
            isPublished: true,
            subscriptionStatus: "active",
        });
        await storage.createOffice({
            name: "Legal Hub",
            slug: "legal-hub",
            description: "Top-tier legal services for individuals and businesses.",
            category: "legal",
            ownerId: adminId,
            isPublished: true,
            subscriptionStatus: "active",
        });
        console.log("Sample offices created.");
    }

    // 3. Create some active advertisements
    const activeAds = await storage.getActiveAdvertisements();
    if (activeAds.length === 0) {
        console.log("Creating sample advertisements...");
        await storage.createAdvertisement({
            userId: adminId,
            title: "Join Our New Workspace",
            description: "Special offer for the first 50 subscribers.",
            imageUrl: "https://via.placeholder.com/800x400",
            linkUrl: "https://example.com",
            status: "active",
            startDate: new Date(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        });
        console.log("Sample advertisements created.");
    }

    console.log("Seeding complete.");
    process.exit(0);
}

seed().catch(err => {
    console.error("Seeding failed:", err);
    process.exit(1);
});
