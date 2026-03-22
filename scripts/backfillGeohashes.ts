/**
 * backfillGeohashes.ts
 * ---------------------
 * Standalone Node.js script that backfills `geohash`, `lat`, and `lng`
 * fields onto existing Firestore gem documents that were created before
 * geospatial indexing was added.
 *
 * Prerequisites:
 *   1. Download your Firebase service account key from:
 *      Firebase Console → Project Settings → Service Accounts → Generate new private key
 *   2. Save it as:  scripts/serviceAccountKey.json   (already gitignored)
 *   3. Run:  npx ts-node --project scripts/tsconfig.json scripts/backfillGeohashes.ts
 *
 * Safety:
 *   - Uses writeBatch (max 500 ops) to stay within Firestore limits
 *   - Skips documents that already have a geohash (idempotent — safe to re-run)
 *   - Skips documents missing a coordinates GeoPoint (logs a warning)
 */

import * as admin from "firebase-admin";
import { geohashForLocation } from "geofire-common";
import * as path from "path";

// ─── Firebase Admin Initialisation ──────────────────────────────────────────
const serviceAccount = require(path.resolve(__dirname, "serviceAccountKey.json"));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: "vikram-480113",
});

const db = admin.firestore();

// ─── Config ──────────────────────────────────────────────────────────────────
const COLLECTION   = "gems";
const BATCH_SIZE   = 499; // Firestore hard limit is 500 ops per batch
const GEO_PRECISION = 9;  // ~4.8 m accuracy

// ─── Main ─────────────────────────────────────────────────────────────────────
async function backfill(): Promise<void> {
  console.log("🌍  Starting geohash backfill for collection:", COLLECTION);

  // 1. Fetch all gems that don't yet have a geohash field
  const snapshot = await db
    .collection(COLLECTION)
    .where("geohash", "==", null)   // null means field not set (Firestore treats missing as null)
    .get();

  // Also catch documents where the field simply doesn't exist yet
  // by fetching all and filtering client-side
  const allSnap = await db.collection(COLLECTION).get();
  const needsUpdate = allSnap.docs.filter((d) => !d.data().geohash);

  const total = needsUpdate.length;

  if (total === 0) {
    console.log("✅  All gems already have geohashes. Nothing to do.");
    process.exit(0);
  }

  console.log(`📦  Found ${total} gem(s) missing geohashes. Processing in batches of ${BATCH_SIZE}…\n`);

  let processed = 0;
  let skipped   = 0;
  let batchNum  = 0;

  // 2. Process in batches of BATCH_SIZE
  for (let i = 0; i < needsUpdate.length; i += BATCH_SIZE) {
    const chunk = needsUpdate.slice(i, i + BATCH_SIZE);
    const batch = db.batch();
    batchNum++;

    for (const docSnap of chunk) {
      const data = docSnap.data();
      const coords = data.coordinates as admin.firestore.GeoPoint | undefined;

      // Skip docs with no GeoPoint (shouldn't happen, but be defensive)
      if (!coords || typeof coords.latitude !== "number" || typeof coords.longitude !== "number") {
        console.warn(`  ⚠️  Skipping doc ${docSnap.id} — missing or invalid coordinates`);
        skipped++;
        continue;
      }

      const lat = coords.latitude;
      const lng = coords.longitude;
      const geohash = geohashForLocation([lat, lng], GEO_PRECISION);

      // 3. Stage the update in the batch
      batch.update(docSnap.ref, {
        geohash,
        lat,
        lng,
      });

      processed++;
    }

    // 4. Commit this batch
    await batch.commit();

    const done = Math.min(i + BATCH_SIZE, needsUpdate.length);
    console.log(`  ✓  Batch ${batchNum} committed — Updated ${done}/${total} gems…`);
  }

  // 5. Final summary
  console.log(`
────────────────────────────────
✅  Backfill complete!
   Updated : ${processed} gems
   Skipped : ${skipped} gems (missing coordinates)
   Total   : ${total} gems processed
────────────────────────────────
  `);

  process.exit(0);
}

// ─── Run ──────────────────────────────────────────────────────────────────────
backfill().catch((err) => {
  console.error("❌  Backfill failed:", err);
  process.exit(1);
});
