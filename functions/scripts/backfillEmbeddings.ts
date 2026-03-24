import * as admin from "firebase-admin";
import { genkit } from "genkit";
import { googleAI, textEmbeddingGecko001 } from "@genkit-ai/googleai";
import * as dotenv from "dotenv";

// Load env vars
dotenv.config({ path: ".env.local" });

// Initialize Firebase Admin
admin.initializeApp({
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
});
const db = admin.firestore();

// Initialize Genkit
const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GEMINI_API_KEY })],
});

async function main() {
  console.log("Starting embedding backfill...");
  const snapshot = await db.collection("gems").get();
  
  let processed = 0;
  let skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (data.embedding) {
      skipped++;
      continue;
    }

    const textToEmbed = `${data.title || ""}. ${data.description || ""}`;
    console.log(`Processing gem: ${doc.id} - ${data.title}`);

    try {
      const embedResponse = await ai.embed({
        embedder: textEmbeddingGecko001,
        content: textToEmbed,
      });

      await doc.ref.update({
        embedding: admin.firestore.FieldValue.vector(embedResponse),
      });
      processed++;
      console.log(`  ✅ Added embedding`);
    } catch (e) {
      console.error(`  ❌ Failed:`, e);
    }
    
    // Tiny delay to avoid rate limits
    await new Promise(r => setTimeout(r, 100));
  }

  console.log(`\nBackfill complete! Processed: ${processed}, Skipped: ${skipped}`);
}

main().catch(console.error);
