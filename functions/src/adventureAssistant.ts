import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import * as geofire from "geofire-common";
import { FieldValue } from "firebase-admin/firestore";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Ensure admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

export const adventureAssistant = onCall(
  {
    secrets: [geminiApiKey],
    invoker: "public"
  },
  async (request) => {
    const { history = [], prompt, userLocation } = request.data;
    if (!prompt) {
      throw new HttpsError("invalid-argument", "Missing prompt");
    }

    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey.value() })],
      model: 'googleai/gemini-1.5-flash',
    });

    // 1. Tool: searchNearbyGems
    const searchNearbyGems = ai.defineTool(
      {
        name: "searchNearbyGems",
        description: "Searches for travel spots (gems) near the user's location, optionally filtering by categories.",
        inputSchema: z.object({
          radiusKm: z.number().default(50).describe("Radius in kilometers to search"),
          categories: z.array(z.string()).optional().describe("E.g., ['Nature', 'Urban', 'Food & Drink', 'hidden-gem']"),
        }),
        outputSchema: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            category: z.string(),
            distanceKm: z.number(),
          })
        ),
      },
      async (input) => {
        if (!userLocation) return [];
        const radiusInM = input.radiusKm * 1000;
        const center = [userLocation.lat, userLocation.lng] as [number, number];
        const bounds = geofire.geohashQueryBounds(center, radiusInM);

        const promises = [];
        for (const b of bounds) {
          let q = db.collection("gems").orderBy("geohash").startAt(b[0]).endAt(b[1]);
          promises.push(q.get());
        }

        const snapshots = await Promise.all(promises);
        const results: any[] = [];
        for (const snap of snapshots) {
          for (const doc of snap.docs) {
            const data = doc.data();
            if (input.categories && input.categories.length > 0) {
               if (!input.categories.includes(data.category)) continue;
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
      }
    );

    // 2. Tool: semanticSearchGems
    const semanticSearchGems = ai.defineTool(
      {
        name: "semanticSearchGems",
        description: "Finds gems (travel spots) based on an abstract 'vibe', feeling, or natural language description by performing a vector search in the database.",
        inputSchema: z.object({
          vibeQuery: z.string().describe("The feeling or vibe the user wants to experience."),
        }),
        outputSchema: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            distanceKm: z.number().optional(),
          })
        ),
      },
      async (input) => {
        // Generate embedding for the vibe query
        const embedResponse = await ai.embed({
          embedder: 'googleai/text-embedding-004',
          content: input.vibeQuery,
        });

        // Perform Firestore Vector Search
        const vectorQuery = db.collection("gems").findNearest("embedding", FieldValue.vector(embedResponse), {
          limit: 5,
          distanceMeasure: "COSINE"
        });

        const snap = await vectorQuery.get();
        return snap.docs.map(d => {
          const data = d.data();
          let distanceKm;
          if (userLocation && data.lat && data.lng) {
             const center = [userLocation.lat, userLocation.lng] as [number, number];
             distanceKm = geofire.distanceBetween([data.lat, data.lng], center);
          }
          return {
            id: d.id,
            title: data.title,
            description: data.description || "",
            distanceKm,
          };
        });
      }
    );

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
        } as any,
      });

      return {
        text: response.text,
      };
    } catch (error) {
      console.error("AI Error:", error);
      throw new HttpsError("internal", "Assistant failed to generate a response");
    }
  }
);
