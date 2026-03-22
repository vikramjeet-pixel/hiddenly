"use client";

import { useRouter } from "next/navigation";
import { Bell, Heart, MessageCircle, CheckCheck, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInAppNotifications, type AppNotification } from "@/hooks/useInAppNotifications";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

function timeAgo(ts: any): string {
  if (!ts) return "";
  try {
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return formatDistanceToNow(d, { addSuffix: true });
  } catch {
    return "";
  }
}

function NotifRow({ notif, onRead }: { notif: AppNotification; onRead: (id: string) => void }) {
  const isLike = notif.type === "like";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      onClick={() => !notif.read && onRead(notif.id)}
      className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors rounded-2xl
        ${notif.read
          ? "opacity-50"
          : "bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800/80 border border-neutral-100 dark:border-white/5 shadow-sm"
        }`}
    >
      {/* Icon */}
      <div className={`shrink-0 size-10 rounded-full flex items-center justify-center
        ${isLike ? "bg-rose-100 dark:bg-rose-950" : "bg-blue-100 dark:bg-blue-950"}`}
      >
        {isLike
          ? <Heart className="size-5 text-rose-500 fill-rose-500" />
          : <MessageCircle className="size-5 text-blue-500" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug text-neutral-800 dark:text-neutral-200">
          <span className="font-bold">{notif.fromUserName}</span>
          {isLike
            ? <span className="text-neutral-500 dark:text-neutral-400"> liked your gem </span>
            : <span className="text-neutral-500 dark:text-neutral-400"> commented on </span>
          }
          <span className="font-semibold text-primary">{notif.gemTitle}</span>
        </p>

        {/* Comment preview */}
        {!isLike && notif.text && (
          <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2 bg-neutral-100 dark:bg-white/5 px-3 py-1.5 rounded-lg italic">
            "{notif.text}"
          </p>
        )}

        <p className="text-[11px] text-neutral-400 dark:text-neutral-500 mt-1.5">
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Unread indicator */}
      {!notif.read && (
        <div className="shrink-0 mt-2 size-2.5 rounded-full bg-primary" />
      )}
    </motion.div>
  );
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markRead } = useInAppNotifications();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-[#0e0e0e]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-[#0e0e0e]/90 backdrop-blur-md border-b border-neutral-200 dark:border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="size-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <Bell className="size-5 text-neutral-700 dark:text-neutral-300" />
              <h1 className="text-lg font-bold tracking-tight">Notifications</h1>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {unreadCount} new
                </span>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/70 transition-colors"
            >
              <CheckCheck className="size-3.5" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {!user ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Bell className="size-7 text-neutral-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">Sign in to see notifications</p>
              <p className="text-sm text-neutral-400 mt-1">Log in to track likes and comments on your gems.</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-24">
            <div className="size-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="size-16 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Bell className="size-7 text-neutral-400" />
            </div>
            <div>
              <p className="text-base font-semibold text-neutral-700 dark:text-neutral-300">All quiet here</p>
              <p className="text-sm text-neutral-400 mt-1">You'll be notified when someone likes or comments on your gems.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {/* Unread section */}
            {notifications.some((n) => !n.read) && (
              <div className="flex flex-col gap-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1 pb-1">New</p>
                <AnimatePresence>
                  {notifications
                    .filter((n) => !n.read)
                    .map((n) => (
                      <NotifRow key={n.id} notif={n} onRead={markRead} />
                    ))}
                </AnimatePresence>
              </div>
            )}

            {/* Read section */}
            {notifications.some((n) => n.read) && (
              <div className="flex flex-col gap-2 mt-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1 pb-1">Earlier</p>
                <AnimatePresence>
                  {notifications
                    .filter((n) => n.read)
                    .map((n) => (
                      <NotifRow key={n.id} notif={n} onRead={markRead} />
                    ))}
                </AnimatePresence>
              </div>
            )}

            <p className="text-center text-[11px] text-neutral-400 mt-4">Showing last 30 notifications</p>
          </div>
        )}
      </div>
    </div>
  );
}
