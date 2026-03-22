import { useEffect, useState } from "react";
import { collection, query, orderBy, onSnapshot, doc, writeBatch, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";

export interface AppNotification {
  id: string;
  type: "like" | "comment";
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  gemId: string;
  gemTitle: string;
  text?: string; // for comments
  createdAt: any;
  read: boolean;
}

export function useInAppNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const notifRef = collection(db, "users", user.uid, "notifications");
    const q = query(notifRef, orderBy("createdAt", "desc"), limit(30));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      })) as AppNotification[];
      setNotifications(fetched);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Mark all as read
  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications
      .filter((n) => !n.read)
      .forEach((n) => {
        const ref = doc(db, "users", user.uid, "notifications", n.id);
        batch.update(ref, { read: true });
      });
    await batch.commit();
  };

  // Mark single as read
  const markRead = async (notifId: string) => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "notifications", notifId);
    const batch = writeBatch(db);
    batch.update(ref, { read: true });
    await batch.commit();
  };

  return { notifications, unreadCount, loading, markAllRead, markRead };
}
