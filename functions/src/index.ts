import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import * as admin from "firebase-admin";
import { genkit, z } from "genkit";
import { googleAI, gemini15Flash } from "@genkit-ai/googleai";

// Declare Secret Manager dependency mapping natively for Google Cloud
const geminiApiKey = defineSecret("GEMINI_API_KEY");

// Initialize Firebase Admin for database write access
admin.initializeApp();

// Zod Schema to strictly enforce the shape of the Gemini JSON output
const PopularitySchema = z.object({
  popularityScore: z.number().describe("0 to 100 integer score"),
  reasoning: z.string().describe("A brief 2 sentence reasoning for the score"),
  isTouristTrap: z.boolean().describe("True if highly commercialized and crowded"),
});

// A sample System Prompt (Extracted for readability)
const buildSystemPrompt = (title: string, desc: string) => `
You are an expert travel analyst. Analyze this travel spot named "${title}".
Description text: "${desc}"

Based on the attached image and text above, is this a globally famous tourist destination, or an unknown local secret?
Please evaluate the provided context and return a structured JSON response mapping exactly to our schema constraint.
Score 100 for famous landmarks (like the Eiffel Tower or Colosseum).
Score 1 for remote, completely unmarked territory that only locals know.
`;

// 2. CLOUD FUNCTION TRIGGER
export const analyzeGemPopularity = onDocumentCreated(
  {
    document: "gems/{gemId}",
    timeoutSeconds: 300,        // AI calls require expanded timeouts up to 5 minutes
    memory: "512MiB",           // Bump memory to process generative models
    secrets: [geminiApiKey],    // Mount the Cloud Secret locally to this specific container
  },
  async (event) => {
    
    // Genkit Initialization must exist *inside* the executing function to decrypt the Secret Manager value at runtime securely.
    const ai = genkit({
      plugins: [googleAI({ apiKey: geminiApiKey.value() })],
      model: gemini15Flash
    });
    const gemId = event.params.gemId;
    const snap = event.data;

    // Safety checks
    if (!snap) return;
    const data = snap.data();
    
    // Check if it already has been processed to prevent infinite looping
    if (data.popularityScore !== undefined) return;

    const mediaUrl = data.media && data.media[0] ? data.media[0] : "";
    const description = data.description || "";
    const title = data.title || "Unknown Spot";

    console.log(`Analyzing Gem ${gemId}...`);

    try {
      // Build dynamic multi-modal prompt
      const promptParts: any[] = [{ text: buildSystemPrompt(title, description) }];
      
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

      if (!result) throw new Error("Genkit did not return a valid schema match.");

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

    } catch (error) {
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
  }
);
