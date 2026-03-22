import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// ────────────────────────────────────────────────────────────────────────────
// AFFINITY TRACKER
// ────────────────────────────────────────────────────────────────────────────
// Trigger: whenever a like document is created at gems/{gemId}/likes/{userId}
//
// Logic:
//   1. Read the parent gem to discover the gem's authorId.
//   2. Check whether the liker FOLLOWS that author
//      (doc exists at social/{likerId}/following/{authorId}).
//   3. If the follow-edge exists, increment its `affinity` counter.
//      This powers the "Smart Following" feed that sorts followed
//      creators by engagement strength.
// ────────────────────────────────────────────────────────────────────────────

export const trackAffinity = onDocumentCreated(
  { document: "gems/{gemId}/likes/{userId}" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const likerId = event.params.userId;
    const gemId   = event.params.gemId;

    try {
      // 1. Fetch the liked gem to find its author
      const gemRef = admin.firestore().collection("gems").doc(gemId);
      const gemDoc = await gemRef.get();

      if (!gemDoc.exists) {
        console.log(`⏭️  Gem ${gemId} does not exist — skipping affinity.`);
        return;
      }

      const authorId: string = gemDoc.data()?.authorId;

      if (!authorId) {
        console.log(`⏭️  Gem ${gemId} has no authorId — skipping affinity.`);
        return;
      }

      // Don't track self-likes
      if (authorId === likerId) return;

      // 2. Check if the liker follows this author
      const followEdge = admin
        .firestore()
        .doc(`social/${likerId}/following/${authorId}`);

      const followSnap = await followEdge.get();

      if (!followSnap.exists) {
        console.log(
          `ℹ️  User ${likerId} does not follow author ${authorId} — no affinity bump.`
        );
        return;
      }

      // 3. Atomically increment the affinity score on the follow-edge
      await followEdge.update({
        affinity: admin.firestore.FieldValue.increment(1),
      });

      // Mirror the affinity bump on the reverse edge (followers sub-collection)
      // so queries from either direction are consistent.
      const reverseEdge = admin
        .firestore()
        .doc(`social/${authorId}/followers/${likerId}`);

      const reverseSnap = await reverseEdge.get();
      if (reverseSnap.exists) {
        await reverseEdge.update({
          affinity: admin.firestore.FieldValue.increment(1),
        });
      }

      console.log(
        `✅  Affinity +1 for ${likerId} → ${authorId} (gem: ${gemId})`
      );
    } catch (error) {
      console.error(
        `❌  Affinity tracking failed for gem ${gemId}, user ${likerId}:`,
        error
      );
    }
  }
);
