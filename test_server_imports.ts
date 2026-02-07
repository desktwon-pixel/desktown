
console.log("Starting import test...");
try {
    await import("./server/db.ts");
    console.log("db.ts imported");
} catch (e) {
    console.error("FAIL: db.ts", e);
}

try {
    await import("./server/storage.ts");
    console.log("storage.ts imported");
} catch (e) {
    console.error("FAIL: storage.ts", e);
}

try {
    await import("./server/routes.ts");
    console.log("routes.ts imported");
} catch (e) {
    console.error("FAIL: routes.ts", e);
}

try {
    await import("./server/vite.ts");
    console.log("vite.ts imported");
} catch (e) {
    console.error("FAIL: vite.ts", e);
}
