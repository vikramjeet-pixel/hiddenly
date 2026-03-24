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
// Ensure admin is initialized
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
exports.adventureAssistant = (0, https_1.onCall)({
    secrets: [geminiApiKey],
    invoker: "public"
}, async (request) => {
    const { history = [], prompt, userLocation } = request.data;
    if (!prompt) {
        throw new https_1.HttpsError("invalid-argument", "Missing prompt");
    }
    const ai = (0, genkit_1.genkit)({
        plugins: [(0, googleai_1.googleAI)({ apiKey: geminiApiKey.value() })],
        model: 'googleai/gemini-1.5-flash',
    });
    // 1. Tool: searchNearbyGems
    const searchNearbyGems = ai.defineTool({
        name: "searchNearbyGems",
        description: "Searches for travel spots (gems) near the user's location, optionally filtering by categories.",
        inputSchema: genkit_1.z.object({
            radiusKm: genkit_1.z.number().default(50).describe("Radius in kilometers to search"),
            categories: genkit_1.z.array(genkit_1.z.string()).optional().describe("E.g., ['Nature', 'Urban', 'Food & Drink', 'hidden-gem']"),
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
        const promises = [];
        for (const b of bounds) {
            let q = db.collection("gems").orderBy("geohash").startAt(b[0]).endAt(b[1]);
            promises.push(q.get());
        }
        const snapshots = await Promise.all(promises);
        const results = [];
        for (const snap of snapshots) {
            for (const doc of snap.docs) {
                const data = doc.data();
                if (input.categories && input.categories.length > 0) {
                    if (!input.categories.includes(data.category))
                        continue;
                }
                if (data.lat && data.lng) {
                    const distanceInKm = geofire.distanceBetween([data.lat, data.lng], center);
                    if (distanceInKm <= input.radiusKm) {
                        results.push({
                            id: doc.id,
                            title: data.title,
                            description: data.description || "",
                            category: data.category,
                            distanceKm: distanceInKm,
                        });
                    }
                }
            }
        }
        return results.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10);
    });
    // 2. Tool: semanticSearchGems
    const semanticSearchGems = ai.defineTool({
        name: "semanticSearchGems",
        description: "Finds gems (travel spots) based on an abstract 'vibe', feeling, or natural language description by performing a vector search in the database.",
        inputSchema: genkit_1.z.object({
            vibeQuery: genkit_1.z.string().describe("The feeling or vibe the user wants to experience."),
        }),
        outputSchema: genkit_1.z.array(genkit_1.z.object({
            id: genkit_1.z.string(),
            title: genkit_1.z.string(),
            description: genkit_1.z.string(),
            distanceKm: genkit_1.z.number().optional(),
        })),
    }, async (input) => {
        // Generate embedding for the vibe query
        const embedResponse = await ai.embed({
            embedder: 'googleai/text-embedding-004',
            content: input.vibeQuery,
        });
        // Perform Firestore Vector Search
        const vectorQuery = db.collection("gems").findNearest("embedding", firestore_1.FieldValue.vector(embedResponse), {
            limit: 5,
            distanceMeasure: "COSINE"
        });
        const snap = await vectorQuery.get();
        return snap.docs.map(d => {
            const data = d.data();
            let distanceKm;
            if (userLocation && data.lat && data.lng) {
                const center = [userLocation.lat, userLocation.lng];
                distanceKm = geofire.distanceBetween([data.lat, data.lng], center);
            }
            return {
                id: d.id,
                title: data.title,
                description: data.description || "",
                distanceKm,
            };
        });
    });
    try {
        // Execute the chat request
        const response = await ai.generate({
            messages: [...history, { role: "user", content: [{ text: prompt }] }],
            tools: [searchNearbyGems, semanticSearchGems],
            system: `You are the Adventure Assistant for the Hidden Gems app. 
You help users find amazing travel spots using our database of gems.
Always be friendly, concise, and adventurous.
If the user asks for places nearby or specific categories (like 'parks near me'), use searchNearbyGems.
If the user asks for a specific vibe or feeling (like 'moody and quiet' or 'sunset views'), use semanticSearchGems.
If the user's location is provided, you can mention distances.
If they ask for extra context, use your built-in Google Search grounding to provide real-world insights code (like opening hours, busyness, or weather).`,
            config: {
                temperature: 0.7,
            },
        });
        return {
            text: response.text,
        };
    }
    catch (error) {
        console.error("AI Error:", error);
        throw new https_1.HttpsError("internal", "Assistant failed to generate a response");
    }
});
//# sourceMappingURL=adventureAssistant.js.map