
import "dotenv/config";
console.log("dotenv loaded");

try {
    await import("../shared/schema");
    console.log("schema imported");
} catch (e) {
    console.error("schema failed", e);
}

try {
    await import("./db");
    console.log("db imported");
} catch (e) {
    console.error("db failed", e);
}

try {
    await import("./storage");
    console.log("storage imported");
} catch (e) {
    console.error("storage failed", e);
}

try {
    await import("./replitAuth");
    console.log("replitAuth imported");
} catch (e) {
    console.error("replitAuth failed", e);
}

try {
    await import("./routes");
    console.log("routes imported");
} catch (e) {
    console.error("routes failed", e);
}

try {
    // Check vite config import which was suspected
    await import("./vite");
    console.log("vite module imported");
} catch (e) {
    console.error("vite module failed", e);
}
