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
// Note: Ensure admin is initialized elsewhere or check here
if (!admin.apps.length) {
    admin.initializeApp();
}
exports.generateGemEmbedding = (0, firestore_1.onDocumentWritten)({
    document: "gems/{gemId}",
    timeoutSeconds: 120,
    secrets: [geminiApiKey],
}, async (event) => {
    // Determine if it's a deletion
    if (!event.data?.after.exists)
        return;
    const afterData = event.data.after.data() || {};
    const beforeData = event.data.before?.data() || {};
    const titleChanged = afterData.title !== beforeData.title;
    const descChanged = afterData.description !== beforeData.description;
    // Only run if title or description changed, or if it's new and doesn't have an embedding yet
    if (!titleChanged && !descChanged && afterData.embedding) {
        return;
    }
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)({ apiKey: geminiApiKey.value() })],
    });
    const textToEmbed = `${afterData.title || ""}. ${afterData.description || ""}`;
    console.log(`Generating embedding for gem ${event.params.gemId}...`);
    try {
        const embedResponse = await ai.embed({
            embedder: googleai_1.textEmbeddingGecko001,
            content: textToEmbed,
        });
        // Update the document with the vector field
        await event.data.after.ref.update({
            embedding: firestore_2.FieldValue.vector(embedResponse),
        });
        console.log(`✅ Embedding saved for ${event.params.gemId}`);
    }
    catch (error) {
        console.error(`❌ Failed to generate embedding for ${event.params.gemId}:`, error);
    }
});
//# sourceMappingURL=generateEmbedding.js.map