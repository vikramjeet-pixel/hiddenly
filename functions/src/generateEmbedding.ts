import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { genkit } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import { FieldValue } from "firebase-admin/firestore";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Ensure admin is initialised once
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * generateGemEmbedding
 *
 * Triggers on every write to gems/{gemId}.
 * - Embeds: title + description + type/category (768-dim via text-embedding-004)
 * - Skips:  deletions | no content change when embedding already exists
 * - Stores: embedding field as a Firestore VectorValue (FieldValue.vector)
 *
 * The resulting field is indexed by the vector index declared in
 * firestore.indexes.json, enabling findNearest() KNN searches.
 */
export const generateGemEmbedding = onDocumentWritten(
  {
    document: "gems/{gemId}",
    timeoutSeconds: 120,
    memory: "256MiB",
    secrets: [geminiApiKey],
  },
  async (event) => {
    // Skip deletions
    if (!event.data?.after.exists) return;

    const after  = event.data.after.data()  || {};
    const before = event.data.before?.data() || {};

    // Only re-embed when searchable content actually changed, or embedding is missing
    const contentChanged =
      after.title       !== before.title       ||
      after.description !== before.description ||
      after.type        !== before.type;

    if (!contentChanged && after.embedding) {
      console.log(`⏭️  Skipping ${event.params.gemId} — no content change.`);
      return;
    }

    // Build the semantic text we want to embed.
    // Format: "<type>. <title>. <description>"
    const textToEmbed = [
      after.type        ? `Category: ${after.type}.` : "",
      after.title       ? `Title: ${after.title}.`   : "",
      after.description ? after.description           : "",
    ]
      .filter(Boolean)
      .join(" ");

    if (!textToEmbed.trim()) {
      console.warn(`⚠️  Gem ${event.params.gemId} has no embeddable content — skipping.`);
      return;
    }

    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey.value() })],
    });

    console.log(`🔮 Generating embedding for gem ${event.params.gemId}…`);

    try {
      // text-embedding-004 produces 768-dimensional vectors — matches the
      // vector index dimension declared in firestore.indexes.json
      const embedResponse = await ai.embed({
        embedder: "googleai/text-embedding-004",
        content: textToEmbed,
      });

      await event.data.after.ref.update({
        embedding: FieldValue.vector(embedResponse),
        embeddedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Embedding saved for ${event.params.gemId} (${embedResponse.length} dims).`);
    } catch (error) {
      console.error(`❌ Embedding failed for ${event.params.gemId}:`, error);
      // Don't rethrow — let the document remain without an embedding rather
      // than retrying forever and burning quota.
    }
  }
);
