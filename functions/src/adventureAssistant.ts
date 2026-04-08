import { onCall, HttpsError } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI } from "@genkit-ai/googleai";
import * as geofire from "geofire-common";
import { FieldValue } from "firebase-admin/firestore";

const geminiApiKey = defineSecret("GEMINI_API_KEY");

if (!admin.apps.length) admin.initializeApp();
const db = admin.firestore();

export const adventureAssistant = onCall(
  { secrets: [geminiApiKey], invoker: "public" },
  async (request) => {
    const { history = [], prompt, userLocation } = request.data;
    if (!prompt) throw new HttpsError("invalid-argument", "Missing prompt");

    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey.value() })],
      model: "googleai/gemini-1.5-flash",
    });

    // Collected gem IDs across tool calls (shared state)
    const collectedGemIds: string[] = [];

    // ── Tool 1: Nearby geo search ──────────────────────────────────────────
    const searchNearbyGems = ai.defineTool(
      {
        name: "searchNearbyGems",
        description:
          "Searches for hidden gems near the user's location. Use for 'near me', 'nearby', or location-specific queries. Optionally filter by category.",
        inputSchema: z.object({
          radiusKm: z.number().default(50).describe("Radius in km"),
          categories: z
            .array(z.string())
            .optional()
            .describe("e.g. ['Nature','Urban','Food & Drink']"),
          maxResults: z.number().default(6).describe("Max gems to return"),
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
        const center: [number, number] = [userLocation.lat, userLocation.lng];
        const bounds = geofire.geohashQueryBounds(center, radiusInM);

        const promises = bounds.map((b: any) =>
          db.collection("gems").orderBy("geohash").startAt(b[0]).endAt(b[1]).get()
        );
        const snapshots = await Promise.all(promises);

        const results: any[] = [];
        for (const snap of snapshots) {
          for (const docSnap of snap.docs) {
            const data = docSnap.data();
            if (
              input.categories &&
              input.categories.length > 0 &&
              !input.categories.includes(data.type || data.category || "")
            )
              continue;
            if (data.lat && data.lng) {
              const distanceKm = geofire.distanceBetween(
                [data.lat, data.lng],
                center
              );
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
        sorted.forEach((r: any) => {
          if (!collectedGemIds.includes(r.id)) collectedGemIds.push(r.id);
        });

        return sorted;
      }
    );

    // ── Tool 2: Semantic vibe search ───────────────────────────────────────
    const searchGemsByVibe = ai.defineTool(
      {
        name: "searchGemsByVibe",
        description:
          "Finds gems based on a vibe, feeling, mood, or abstract description using AI vector search. Use when the user mentions feelings, aesthetics, or vibes like 'peaceful', 'romantic', 'moody', 'hidden', 'adventurous'. Also use for follow-up refinements like 'more hidden' or 'quieter places'.",
        inputSchema: z.object({
          vibeQuery: z
            .string()
            .describe(
              "Full natural-language description of the vibe. Include ALL context from conversation history — e.g. if user said 'show waterfalls' then 'make them more hidden', the vibeQuery should be 'hidden secluded waterfalls with low foot traffic'."
            ),
          limit: z
            .number()
            .default(5)
            .describe("Number of results (max 8)"),
          preferLowViewCount: z
            .boolean()
            .optional()
            .describe("If true, prefer gems with fewer views (more hidden)"),
        }),
        outputSchema: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            category: z.string().optional(),
            distanceKm: z.number().optional(),
          })
        ),
      },
      async (input) => {
        // Embed the full vibe query
        const embedResponse = await ai.embed({
          embedder: "googleai/text-embedding-004",
          content: input.vibeQuery,
        });

        const vectorQuery = db
          .collection("gems")
          .findNearest("embedding", FieldValue.vector(embedResponse), {
            limit: Math.min(input.limit * 2, 16), // over-fetch so we can filter
            distanceMeasure: "COSINE",
          });

        const snap = await vectorQuery.get();

        let docs = snap.docs.map((d) => {
          const data = d.data();
          let distanceKm: number | undefined;
          if (userLocation && data.lat && data.lng) {
            distanceKm = geofire.distanceBetween(
              [data.lat, data.lng],
              [userLocation.lat, userLocation.lng]
            );
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
          if (!collectedGemIds.includes(r.id)) collectedGemIds.push(r.id);
        });

        return results.map(({ viewCount: _vc, ...rest }) => rest);
      }
    );

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
        config: { temperature: 0.7 } as any,
      });

      return {
        text: response.text,
        gemIds: collectedGemIds,
      };
    } catch (error) {
      console.error("AI Error:", error);
      throw new HttpsError("internal", "Assistant failed to respond");
    }
  }
);
