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
exports.trackAffinity = exports.sendLikeNotification = exports.sendCommentNotification = exports.analyzeGemPopularity = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
// Declare Secret Manager dependency mapping natively for Google Cloud
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
// Initialize Firebase Admin for database write access
admin.initializeApp();
// Zod Schema to strictly enforce the shape of the Gemini JSON output
const PopularitySchema = genkit_1.z.object({
    popularityScore: genkit_1.z.number().describe("0 to 100 integer score"),
    reasoning: genkit_1.z.string().describe("A brief 2 sentence reasoning for the score"),
    isTouristTrap: genkit_1.z.boolean().describe("True if highly commercialized and crowded"),
});
// A sample System Prompt (Extracted for readability)
const buildSystemPrompt = (title, desc) => `
You are an expert travel analyst. Analyze this travel spot named "${title}".
Description text: "${desc}"

Based on the attached image and text above, is this a globally famous tourist destination, or an unknown local secret?
Please evaluate the provided context and return a structured JSON response mapping exactly to our schema constraint.
Score 100 for famous landmarks (like the Eiffel Tower or Colosseum).
Score 1 for remote, completely unmarked territory that only locals know.
`;
// 2. CLOUD FUNCTION TRIGGER
exports.analyzeGemPopularity = (0, firestore_1.onDocumentCreated)({
    document: "gems/{gemId}",
    timeoutSeconds: 300, // AI calls require expanded timeouts up to 5 minutes
    memory: "512MiB", // Bump memory to process generative models
    secrets: [geminiApiKey], // Mount the Cloud Secret locally to this specific container
}, async (event) => {
    // Genkit Initialization must exist *inside* the executing function to decrypt the Secret Manager value at runtime securely.
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)({ apiKey: geminiApiKey.value() })],
        model: googleai_1.gemini15Flash
    });
    const gemId = event.params.gemId;
    const snap = event.data;
    // Safety checks
    if (!snap)
        return;
    const data = snap.data();
    // Check if it already has been processed to prevent infinite looping
    if (data.popularityScore !== undefined)
        return;
    const mediaUrl = data.media && data.media[0] ? data.media[0] : "";
    const description = data.description || "";
    const title = data.title || "Unknown Spot";
    console.log(`Analyzing Gem ${gemId}...`);
    try {
        // Build dynamic multi-modal prompt
        const promptParts = [{ text: buildSystemPrompt(title, description) }];
        // Genkit can natively pipe image URLs straight into Gemini!
        if (mediaUrl) {
            promptParts.push({ media: { url: mediaUrl } });
        }
        // Execute Gemini Analysis with forced structured object return
        const response = await ai.generate({
            prompt: promptParts,
            output: { schema: PopularitySchema }
        });
        const result = response.output;
        if (!result)
            throw new Error("Genkit did not return a valid schema match.");
        // 3. FIRESTORE UPDATE
        // Branch logic directly dictated by the AI's numerical judgment
        const category = result.popularityScore > 80 ? "mainstream" : "hidden-gem";
        await snap.ref.update({
            popularityScore: result.popularityScore,
            reasoning: result.reasoning,
            isTouristTrap: result.isTouristTrap,
            category: category,
            aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Success for ${gemId}: Scored ${result.popularityScore} [${category}]`);
    }
    catch (error) {
        console.error(`❌ AI Analysis Failed for Gem ${gemId}:`, error);
        // 4. SECURITY & ERROR HANDLING
        // Prevent function from crashing perpetually by assigning a manual fallback resolution
        await snap.ref.update({
            popularityScore: -1,
            reasoning: "AI Timeout or Generation Failure. Could not assess popularity.",
            category: "unverified",
            aiAnalyzedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
// Notification Cloud Functions (comment + like triggers)
var notifications_1 = require("./notifications");
Object.defineProperty(exports, "sendCommentNotification", { enumerable: true, get: function () { return notifications_1.sendCommentNotification; } });
Object.defineProperty(exports, "sendLikeNotification", { enumerable: true, get: function () { return notifications_1.sendLikeNotification; } });
// Affinity Tracker (smart following feed)
var affinityTracker_1 = require("./affinityTracker");
Object.defineProperty(exports, "trackAffinity", { enumerable: true, get: function () { return affinityTracker_1.trackAffinity; } });
//# sourceMappingURL=index.js.map