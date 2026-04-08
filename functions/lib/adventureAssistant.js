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
exports.adventureAssistant = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const genkit_1 = require("genkit");
const googleai_1 = require("@genkit-ai/googleai");
const geofire = __importStar(require("geofire-common"));
const firestore_1 = require("firebase-admin/firestore");
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
if (!admin.apps.length)
    admin.initializeApp();
const db = admin.firestore();
exports.adventureAssistant = (0, https_1.onCall)({ secrets: [geminiApiKey], invoker: "public" }, async (request) => {
    const { history = [], prompt, userLocation } = request.data;
    if (!prompt)
        throw new https_1.HttpsError("invalid-argument", "Missing prompt");
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)({ apiKey: geminiApiKey.value() })],
        model: "googleai/gemini-1.5-flash",
    });
    // Collected gem IDs across tool calls (shared state)
    const collectedGemIds = [];
    // ── Tool 1: Nearby geo search ──────────────────────────────────────────
    const searchNearbyGems = ai.defineTool({
        name: "searchNearbyGems",
        description: "Searches for hidden gems near the user's location. Use for 'near me', 'nearby', or location-specific queries. Optionally filter by category.",
        inputSchema: genkit_1.z.object({
            radiusKm: genkit_1.z.number().default(50).describe("Radius in km"),
            categories: genkit_1.z
                .array(genkit_1.z.string())
                .optional()
                .describe("e.g. ['Nature','Urban','Food & Drink']"),
            maxResults: genkit_1.z.number().default(6).describe("Max gems to return"),
        }),
        outputSchema: genkit_1.z.array(genkit_1.z.object({
            id: genkit_1.z.string(),
            title: genkit_1.z.string(),
            description: genkit_1.z.string(),
            category: genkit_1.z.string(),
            distanceKm: genkit_1.z.number(),
        })),
    }, async (input) => {
        if (!userLocation)
            return [];
        const radiusInM = input.radiusKm * 1000;
        const center = [userLocation.lat, userLocation.lng];
        const bounds = geofire.geohashQueryBounds(center, radiusInM);
        const promises = bounds.map((b) => db.collection("gems").orderBy("geohash").startAt(b[0]).endAt(b[1]).get());
        const snapshots = await Promise.all(promises);
        const results = [];
        for (const snap of snapshots) {
            for (const docSnap of snap.docs) {
                const data = docSnap.data();
                if (input.categories &&
                    input.categories.length > 0 &&
                    !input.categories.includes(data.type || data.category || ""))
                    continue;
                if (data.lat && data.lng) {
                    const distanceKm = geofire.distanceBetween([data.lat, data.lng], center);
                    if (distanceKm <= input.radiusKm) {
                        results.push({
                            id: docSnap.id,
                            title: data.title,
                            description: data.description || "",
                            category: data.type || data.category || "",
                            distanceKm,
                        });
                    }
                }
            }
        }
        const sorted = results
            .sort((a, b) => a.distanceKm - b.distanceKm)
            .slice(0, input.maxResults);
        // Track IDs for the response envelope
        sorted.forEach((r) => {
            if (!collectedGemIds.includes(r.id))
                collectedGemIds.push(r.id);
        });
        return sorted;
    });
    // ── Tool 2: Semantic vibe search ───────────────────────────────────────
    const searchGemsByVibe = ai.defineTool({
        name: "searchGemsByVibe",
        description: "Finds gems based on a vibe, feeling, mood, or abstract description using AI vector search. Use when the user mentions feelings, aesthetics, or vibes like 'peaceful', 'romantic', 'moody', 'hidden', 'adventurous'. Also use for follow-up refinements like 'more hidden' or 'quieter places'.",
        inputSchema: genkit_1.z.object({
            vibeQuery: genkit_1.z
                .string()
                .describe("Full natural-language description of the vibe. Include ALL context from conversation history — e.g. if user said 'show waterfalls' then 'make them more hidden', the vibeQuery should be 'hidden secluded waterfalls with low foot traffic'."),
            limit: genkit_1.z
                .number()
                .default(5)
                .describe("Number of results (max 8)"),
            preferLowViewCount: genkit_1.z
                .boolean()
                .optional()
                .describe("If true, prefer gems with fewer views (more hidden)"),
        }),
        outputSchema: genkit_1.z.array(genkit_1.z.object({
            id: genkit_1.z.string(),
            title: genkit_1.z.string(),
            description: genkit_1.z.string(),
            category: genkit_1.z.string().optional(),
            distanceKm: genkit_1.z.number().optional(),
        })),
    }, async (input) => {
        // Embed the full vibe query
        const embedResponse = await ai.embed({
            embedder: "googleai/text-embedding-004",
            content: input.vibeQuery,
        });
        const vectorQuery = db
            .collection("gems")
            .findNearest("embedding", firestore_1.FieldValue.vector(embedResponse), {
            limit: Math.min(input.limit * 2, 16), // over-fetch so we can filter
            distanceMeasure: "COSINE",
        });
        const snap = await vectorQuery.get();
        let docs = snap.docs.map((d) => {
            const data = d.data();
            let distanceKm;
            if (userLocation && data.lat && data.lng) {
                distanceKm = geofire.distanceBetween([data.lat, data.lng], [userLocation.lat, userLocation.lng]);
            }
            return {
                id: d.id,
                title: data.title || "Hidden Gem",
                description: data.description || "",
                category: data.type || data.category,
                distanceKm,
                viewCount: data.viewCount || 0,
            };
        });
        // Optional: re-rank by low view count for "more hidden" requests
        if (input.preferLowViewCount) {
            docs.sort((a, b) => (a.viewCount || 0) - (b.viewCount || 0));
        }
        const results = docs.slice(0, input.limit);
        // Track IDs
        results.forEach((r) => {
            if (!collectedGemIds.includes(r.id))
                collectedGemIds.push(r.id);
        });
        return results.map(({ viewCount: _vc, ...rest }) => rest);
    });
    // ── Run the agentic loop ───────────────────────────────────────────────
    try {
        const response = await ai.generate({
            messages: [...history, { role: "user", content: [{ text: prompt }] }],
            tools: [searchNearbyGems, searchGemsByVibe],
            system: `You are the Adventure Assistant for Hiddenly — a social travel app for discovering hidden gems.
Your personality: warm, curious, adventurous, and concise.

TOOLS:
- Use searchGemsByVibe for any vibe/feeling/mood query or follow-up refinement.
- Use searchNearbyGems when the user explicitly says "near me" or mentions a location radius.
- You MUST call a tool whenever you could search for gems — never just make up gem names.

CONVERSATION CONTEXT:
- You have full conversation history. When a user refines a query ("make them more hidden", "quieter ones"), synthesize the ENTIRE context into a single vibeQuery for the tool. Never lose context.
- If 'preferLowViewCount' should be true: when user asks for "more hidden", "fewer people", "less touristy", "secret".

RESPONSE FORMAT:
- Keep text responses SHORT (2-4 sentences max).
- After calling a tool, describe what you found enthusiastically but briefly.
- Never list gem names in text — the UI shows cards automatically.
- If no gems are found, suggest the user try a different vibe or check back as more gems are added.`,
            config: { temperature: 0.7 },
        });
        return {
            text: response.text,
            gemIds: collectedGemIds,
        };
    }
    catch (error) {
        console.error("AI Error:", error);
        throw new https_1.HttpsError("internal", "Assistant failed to respond");
    }
});
//# sourceMappingURL=adventureAssistant.js.map