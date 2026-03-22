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
exports.trackAffinity = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
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
exports.trackAffinity = (0, firestore_1.onDocumentCreated)({ document: "gems/{gemId}/likes/{userId}" }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const likerId = event.params.userId;
    const gemId = event.params.gemId;
    try {
        // 1. Fetch the liked gem to find its author
        const gemRef = admin.firestore().collection("gems").doc(gemId);
        const gemDoc = await gemRef.get();
        if (!gemDoc.exists) {
            console.log(`⏭️  Gem ${gemId} does not exist — skipping affinity.`);
            return;
        }
        const authorId = gemDoc.data()?.authorId;
        if (!authorId) {
            console.log(`⏭️  Gem ${gemId} has no authorId — skipping affinity.`);
            return;
        }
        // Don't track self-likes
        if (authorId === likerId)
            return;
        // 2. Check if the liker follows this author
        const followEdge = admin
            .firestore()
            .doc(`social/${likerId}/following/${authorId}`);
        const followSnap = await followEdge.get();
        if (!followSnap.exists) {
            console.log(`ℹ️  User ${likerId} does not follow author ${authorId} — no affinity bump.`);
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
        console.log(`✅  Affinity +1 for ${likerId} → ${authorId} (gem: ${gemId})`);
    }
    catch (error) {
        console.error(`❌  Affinity tracking failed for gem ${gemId}, user ${likerId}:`, error);
    }
});
//# sourceMappingURL=affinityTracker.js.map