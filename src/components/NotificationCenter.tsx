"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Heart, MessageCircle, Check, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useInAppNotifications, type AppNotification } from "@/hooks/useInAppNotifications";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

function timeAgo(timestamp: any): string {
  if (!timestamp) return "";
  try {
    const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return "";
  }
}

function NotifItem({ notif, onRead }: { notif: AppNotification; onRead: (id: string) => void }) {
  const isLike = notif.type === "like";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 10 }}
      onClick={() => !notif.read && onRead(notif.id)}
      className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors rounded-xl
        ${notif.read
          ? "opacity-60"
          : "bg-primary/5 hover:bg-primary/10"
        }`}
    >
      {/* Icon Badge */}
      <div className={`shrink-0 size-8 rounded-full flex items-center justify-center
        ${isLike ? "bg-rose-100" : "bg-blue-100"}`}
      >
        {isLike
          ? <Heart className="size-4 text-rose-500 fill-rose-500" />
          : <MessageCircle className="size-4 text-blue-500 fill-blue-100" />
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] leading-snug text-neutral-800">
          <span className="font-semibold">{notif.fromUserName}</span>
          {isLike
            ? <span className="text-neutral-500"> liked your gem </span>
            : <span className="text-neutral-500"> commented on </span>
          }
          <span className="font-medium text-primary">{notif.gemTitle}</span>
          {!isLike && notif.text && (
            <span className="block text-neutral-400 text-xs mt-0.5 truncate">
              "{notif.text}"
            </span>
          )}
        </p>
        <p className="text-[11px] text-neutral-400 mt-0.5">
          {timeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Unread dot */}
      {!notif.read && (
        <div className="shrink-0 mt-1.5 size-2 rounded-full bg-primary" />
      )}
    </motion.div>
  );
}

export default function NotificationCenter() {
  const { user } = useAuth();
  const { notifications, unreadCount, loading, markAllRead, markRead } = useInAppNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center size-9 rounded-xl bg-neutral-100 hover:bg-neutral-200 transition-colors"
      >
        <Bell className="size-4 text-neutral-600" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center leading-none"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Notification Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            id="notification-panel"
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 top-12 w-[340px] rounded-2xl bg-white border border-neutral-200 shadow-2xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Bell className="size-4 text-neutral-500" />
                <h3 className="text-sm font-bold tracking-tight">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-600 text-[10px] font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  <CheckCheck className="size-3" />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[420px] overflow-y-auto overscroll-contain py-2">
              {loading ? (
                <div className="flex justify-center py-10">
                  <div className="size-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center px-6">
                  <div className="size-12 rounded-2xl bg-neutral-100 flex items-center justify-center">
                    <Bell className="size-5 text-neutral-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-700">All quiet here</p>
                    <p className="text-xs text-neutral-400 mt-0.5">You'll be notified when someone likes or comments on your gems.</p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n) => (
                    <NotifItem key={n.id} notif={n} onRead={markRead} />
                  ))}
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-neutral-100 flex justify-center">
                <p className="text-[11px] text-neutral-400">Showing last 30 notifications</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
