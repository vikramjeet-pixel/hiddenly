import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";

// ────────────────────────────────────────────────────────
// TRIGGER 1: New Comment → Notify Gem Author
// ────────────────────────────────────────────────────────
export const sendCommentNotification = onDocumentCreated(
  { document: "gems/{gemId}/comments/{commentId}" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const commentData = snap.data();
    const commentAuthorId: string = commentData.authorId;
    const commentAuthorName: string = commentData.authorName || "Someone";
    const commentAuthorAvatar: string = commentData.authorAvatar || "";
    const commentText: string = commentData.text || "";
    const gemId: string = event.params.gemId;

    try {
      // 1. Get parent gem to find its owner & title
      const gemRef = admin.firestore().collection("gems").doc(gemId);
      const gemDoc = await gemRef.get();
      if (!gemDoc.exists) return;

      const gemData = gemDoc.data()!;
      const gemAuthorId: string = gemData.authorId;
      const gemTitle: string = gemData.title || "your gem";

      // Don't notify when authors comment on their own post
      if (!gemAuthorId || gemAuthorId === commentAuthorId) return;

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
      if (!userDoc.exists) return;

      const tokens: string[] = userDoc.data()?.fcmTokens || [];
      if (tokens.length === 0) return;

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
    } catch (error) {
      console.error(`❌ Error sending comment notification for gem ${gemId}:`, error);
    }
  }
);

// ────────────────────────────────────────────────────────
// TRIGGER 2: User likes a gem → Notify Gem Author
// We detect this by watching the gem document for likesCount increment,
// BUT a cleaner pattern is watching the user doc for arrayUnion on likedSpots.
// Best approach: a dedicated "likes/{likeId}" collection written from client.
// For now, we hook into a special "gem_likes" sub-collection written from the client.
// ────────────────────────────────────────────────────────
export const sendLikeNotification = onDocumentCreated(
  { document: "gems/{gemId}/likes/{userId}" },
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const likeData = snap.data();
    const likerId: string = event.params.userId;
    const likerName: string = likeData.fromUserName || "Someone";
    const likerAvatar: string = likeData.fromUserAvatar || "";
    const gemId: string = event.params.gemId;

    try {
      const gemRef = admin.firestore().collection("gems").doc(gemId);
      const gemDoc = await gemRef.get();
      if (!gemDoc.exists) return;

      const gemData = gemDoc.data()!;
      const gemAuthorId: string = gemData.authorId;
      const gemTitle: string = gemData.title || "your gem";

      // Don't notify when author likes their own gem
      if (!gemAuthorId || gemAuthorId === likerId) return;

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
      if (!userDoc.exists) return;

      const tokens: string[] = userDoc.data()?.fcmTokens || [];
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
    } catch (error) {
      console.error(`❌ Error sending like notification for gem ${gemId}:`, error);
    }
  }
);
