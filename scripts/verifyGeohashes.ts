/**
 * verifyGeohashes.ts
 * ------------------
 * Scans the 'gems' collection and prints geohash coverage stats.
 * Also validates that every geohash is exactly 9 characters.
 *
 * Run: npx ts-node --project scripts/tsconfig.json scripts/verifyGeohashes.ts
 */

import * as admin from "firebase-admin";
import * as path from "path";

const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "vikram-480113",
});

const db = admin.firestore();

async function verify(): Promise<void> {
  console.log("🔍  Scanning gems collection for geohash coverage…\n");

  const snap = await db.collection("gems").get();
  const total = snap.size;

  if (total === 0) {
    console.log("⚠️   No documents found in gems collection.");
    process.exit(0);
  }

  const missingGeohash: string[] = [];
  const badLength: { id: string; hash: string }[] = [];
  const missingLatLng: string[] = [];

  let validCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    const id = doc.id;

    // ── Check geohash ────────────────────────────────────────────
    if (!data.geohash) {
      missingGeohash.push(id);
    } else if (typeof data.geohash !== "string" || data.geohash.length !== 9) {
      badLength.push({ id, hash: String(data.geohash) });
    }

    // ── Check flat lat/lng ───────────────────────────────────────
    if (typeof data.lat !== "number" || typeof data.lng !== "number") {
      missingLatLng.push(id);
    }

    if (data.geohash && data.geohash.length === 9 && typeof data.lat === "number") {
      validCount++;
    }

    // ── Print per-document summary ───────────────────────────────
    const geohashStr = data.geohash
      ? `✅ ${data.geohash} (${data.geohash.length} chars)`
      : "❌ MISSING";
    const latStr = data.lat != null ? `${data.lat.toFixed(4)}` : "❌";
    const lngStr = data.lng != null ? `${data.lng.toFixed(4)}` : "❌";
    console.log(`  Doc ${id.slice(0, 8)}… | geohash: ${geohashStr} | lat: ${latStr} | lng: ${lngStr}`);
  }

  // ── Summary ──────────────────────────────────────────────────
  console.log(`
══════════════════════════════════════════
📊  GEOHASH COVERAGE REPORT
──────────────────────────────────────────
  Total gems        : ${total}
  ✅ Fully indexed  : ${validCount}  (${Math.round((validCount / total) * 100)}%)
  ❌ Missing geohash: ${missingGeohash.length}
  ⚠️  Wrong length  : ${badLength.length}
  ❌ Missing lat/lng: ${missingLatLng.length}
══════════════════════════════════════════`);

  if (missingGeohash.length > 0) {
    console.log("\n⚠️   IDs missing geohash (run backfill):");
    missingGeohash.forEach((id) => console.log(`     - ${id}`));
  }

  if (badLength.length > 0) {
    console.log("\n⚠️   IDs with wrong geohash length:");
    badLength.forEach(({ id, hash }) => console.log(`     - ${id} → "${hash}" (${hash.length} chars)`));
  }

  if (missingGeohash.length > 0 || badLength.length > 0) {
    console.log("\n💡  Run:  npm run backfill:geohashes  to fix these.\n");
  } else {
    console.log("\n🎉  All gems are fully geospatially indexed!\n");
  }

  process.exit(0);
}

verify().catch((err) => {
  console.error("❌  Verification failed:", err);
  process.exit(1);
});
