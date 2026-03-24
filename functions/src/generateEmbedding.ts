import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { genkit } from "genkit";
import { googleAI, textEmbeddingGecko001 } from "@genkit-ai/googleai";
import { FieldValue } from "firebase-admin/firestore";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Note: Ensure admin is initialized elsewhere or check here
if (!admin.apps.length) {
  admin.initializeApp();
}

export const generateGemEmbedding = onDocumentWritten(
  {
    document: "gems/{gemId}",
    timeoutSeconds: 120,
    secrets: [geminiApiKey],
  },
  async (event) => {
    // Determine if it's a deletion
    if (!event.data?.after.exists) return;

    const afterData = event.data.after.data() || {};
    const beforeData = event.data.before?.data() || {};

    const titleChanged = afterData.title !== beforeData.title;
    const descChanged = afterData.description !== beforeData.description;

    // Only run if title or description changed, or if it's new and doesn't have an embedding yet
    if (!titleChanged && !descChanged && afterData.embedding) {
      return;
    }

    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey.value() })],
    });

    const textToEmbed = `${afterData.title || ""}. ${afterData.description || ""}`;

    console.log(`Generating embedding for gem ${event.params.gemId}...`);
    try {
      const embedResponse = await ai.embed({
        embedder: textEmbeddingGecko001,
        content: textToEmbed,
      });

      // Update the document with the vector field
      await event.data.after.ref.update({
        embedding: FieldValue.vector(embedResponse),
      });

      console.log(`✅ Embedding saved for ${event.params.gemId}`);
    } catch (error) {
      console.error(`❌ Failed to generate embedding for ${event.params.gemId}:`, error);
    }
  }
);
