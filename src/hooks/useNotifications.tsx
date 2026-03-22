import { useEffect, useState } from "react";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { app, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export function useNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const router = useRouter();

  useEffect(() => {
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    
    setPermission(Notification.permission);
  }, []);

  const requestNotificationPermission = async () => {
    if (permission === "unsupported") return;
    
    try {
      // 1. Ask user for prompt
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted" && user) {
        // 2. Load the native messaging instance gracefully ensuring the UI thread doesn't lock
        const messaging = getMessaging(app);
        
        // 3. Issue VAPID key exchange to the Firebase Service Worker backend
        const currentToken = await getToken(messaging, {
          // NOTE: You MUST replace this with your actual Web Push generated VAPID key string heavily secured in your Firebase Console
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "YOUR_PUBLIC_VAPID_KEY",
        });

        if (currentToken) {
          // 4. Update Firestore with atomic union ensuring no overlapping push-tokens are wiped
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(currentToken)
          });
          toast.success("Successfully enabled Push Notifications!");
        } else {
          toast.error("Failed generating Push Registration.");
        }
      }
    } catch (error) {
      console.error("Critical error capturing FCM tokens:", error);
    }
  };

  useEffect(() => {
    // Graceful binding initializing foreground listener dynamically resolving data payloads
    if (typeof window !== "undefined" && "serviceWorker" in navigator && permission === "granted") {
      try {
        const messaging = getMessaging(app);
        const unsubscribe = onMessage(messaging, (payload) => {
          // Extract mapped payload
          const title = payload.notification?.title || "New Message";
          const body = payload.notification?.body || "You have a new update";
          const deepLinkUrl = payload.data?.url;

          // Push the alert gracefully up to the Active Client viewport via React Toast
          toast((t) => (
            <div 
              className="flex flex-col gap-1 cursor-pointer"
              onClick={() => {
                toast.dismiss(t.id);
                if (deepLinkUrl) router.push(deepLinkUrl);
              }}
            >
              <h4 className="font-bold text-sm">{title}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-300">{body}</p>
            </div>
          ), { duration: 5000 });
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error("Messaging module not active:", err);
      }
    }
  }, [permission, router]);

  return { permission, requestNotificationPermission };
}
