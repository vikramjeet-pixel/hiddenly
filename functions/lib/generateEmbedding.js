"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateGemEmbedding = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
const firestore_2 = require("firebase-admin/firestore");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
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
exports.generateGemEmbedding = (0, firestore_1.onDocumentWritten)({
    document: "gems/{gemId}",
    timeoutSeconds: 120,
    memory: "256MiB",
    secrets: [geminiApiKey],
}, async (event) => {
    // Skip deletions
    if (!event.data?.after.exists)
        return;
    const after = event.data.after.data() || {};
    const before = event.data.before?.data() || {};
    // Only re-embed when searchable content actually changed, or embedding is missing
    const contentChanged = after.title !== before.title ||
        after.description !== before.description ||
        after.type !== before.type;
    if (!contentChanged && after.embedding) {
        console.log(`⏭️  Skipping ${event.params.gemId} — no content change.`);
        return;
    }
    // Build the semantic text we want to embed.
    // Format: "<type>. <title>. <description>"
    const textToEmbed = [
        after.type ? `Category: ${after.type}.` : "",
        after.title ? `Title: ${after.title}.` : "",
        after.description ? after.description : "",
    ]
        .filter(Boolean)
        .join(" ");
    if (!textToEmbed.trim()) {
        console.warn(`⚠️  Gem ${event.params.gemId} has no embeddable content — skipping.`);
        return;
    }
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)({ apiKey: geminiApiKey.value() })],
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
            embedding: firestore_2.FieldValue.vector(embedResponse),
            embeddedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Embedding saved for ${event.params.gemId} (${embedResponse.length} dims).`);
    }
    catch (error) {
        console.error(`❌ Embedding failed for ${event.params.gemId}:`, error);
        // Don't rethrow — let the document remain without an embedding rather
        // than retrying forever and burning quota.
    }
});
//# sourceMappingURL=generateEmbedding.js.map