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
exports.sendLikeNotification = exports.sendCommentNotification = void 0;
const admin = __importStar(require("firebase-admin"));
const firestore_1 = require("firebase-functions/v2/firestore");
// ────────────────────────────────────────────────────────
// TRIGGER 1: New Comment → Notify Gem Author
// ────────────────────────────────────────────────────────
exports.sendCommentNotification = (0, firestore_1.onDocumentCreated)({ document: "gems/{gemId}/comments/{commentId}" }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const commentData = snap.data();
    const commentAuthorId = commentData.authorId;
    const commentAuthorName = commentData.authorName || "Someone";
    const commentAuthorAvatar = commentData.authorAvatar || "";
    const commentText = commentData.text || "";
    const gemId = event.params.gemId;
    try {
        // 1. Get parent gem to find its owner & title
        const gemRef = admin.firestore().collection("gems").doc(gemId);
        const gemDoc = await gemRef.get();
        if (!gemDoc.exists)
            return;
        const gemData = gemDoc.data();
        const gemAuthorId = gemData.authorId;
        const gemTitle = gemData.title || "your gem";
        // Don't notify when authors comment on their own post
        if (!gemAuthorId || gemAuthorId === commentAuthorId)
            return;
        // 2. Write in-app notification to users/{authorId}/notifications
        const notifRef = admin.firestore()
            .collection("users")
            .doc(gemAuthorId)
            .collection("notifications")
            .doc(); // auto-id
        await notifRef.set({
            type: "comment",
            fromUserId: commentAuthorId,
            fromUserName: commentAuthorName,
            fromUserAvatar: commentAuthorAvatar,
            gemId,
            gemTitle,
            text: commentText,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // 3. Also send FCM push to all registered devices (existing logic)
        const userRef = admin.firestore().collection("users").doc(gemAuthorId);
        const userDoc = await userRef.get();
        if (!userDoc.exists)
            return;
        const tokens = userDoc.data()?.fcmTokens || [];
        if (tokens.length === 0)
            return;
        await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: "New Comment on your Gem!",
                body: `${commentAuthorName} just shared their thoughts.`,
            },
            data: {
                gemId,
                url: `/#post-${gemId}`,
            },
        });
        console.log(`✅ Comment notification sent for gem ${gemId}`);
    }
    catch (error) {
        console.error(`❌ Error sending comment notification for gem ${gemId}:`, error);
    }
});
// ────────────────────────────────────────────────────────
// TRIGGER 2: User likes a gem → Notify Gem Author
// We detect this by watching the gem document for likesCount increment,
// BUT a cleaner pattern is watching the user doc for arrayUnion on likedSpots.
// Best approach: a dedicated "likes/{likeId}" collection written from client.
// For now, we hook into a special "gem_likes" sub-collection written from the client.
// ────────────────────────────────────────────────────────
exports.sendLikeNotification = (0, firestore_1.onDocumentCreated)({ document: "gems/{gemId}/likes/{userId}" }, async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const likeData = snap.data();
    const likerId = event.params.userId;
    const likerName = likeData.fromUserName || "Someone";
    const likerAvatar = likeData.fromUserAvatar || "";
    const gemId = event.params.gemId;
    try {
        const gemRef = admin.firestore().collection("gems").doc(gemId);
        const gemDoc = await gemRef.get();
        if (!gemDoc.exists)
            return;
        const gemData = gemDoc.data();
        const gemAuthorId = gemData.authorId;
        const gemTitle = gemData.title || "your gem";
        // Don't notify when author likes their own gem
        if (!gemAuthorId || gemAuthorId === likerId)
            return;
        // Write in-app notification
        const notifRef = admin.firestore()
            .collection("users")
            .doc(gemAuthorId)
            .collection("notifications")
            .doc();
        await notifRef.set({
            type: "like",
            fromUserId: likerId,
            fromUserName: likerName,
            fromUserAvatar: likerAvatar,
            gemId,
            gemTitle,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // FCM Push for likes
        const userRef = admin.firestore().collection("users").doc(gemAuthorId);
        const userDoc = await userRef.get();
        if (!userDoc.exists)
            return;
        const tokens = userDoc.data()?.fcmTokens || [];
        if (tokens.length > 0) {
            await admin.messaging().sendEachForMulticast({
                tokens,
                notification: {
                    title: "Someone liked your Gem! ❤️",
                    body: `${likerName} liked "${gemTitle}"`,
                },
                data: { gemId, url: `/#post-${gemId}` },
            });
        }
        console.log(`✅ Like notification sent for gem ${gemId} by ${likerId}`);
    }
    catch (error) {
        console.error(`❌ Error sending like notification for gem ${gemId}:`, error);
    }
});
//# sourceMappingURL=notifications.js.map