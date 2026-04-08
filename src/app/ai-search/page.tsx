"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { httpsCallable } from "firebase/functions";
import { functions, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useLocation } from "@/context/LocationContext";
import { useAIMapBridge, BridgeGem } from "@/context/AIMapBridgeContext";
import { toggleSaveSpot } from "@/lib/vault-service";
import { doc, getDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import {
  Sparkles, Send, MapPin, Bookmark, BookmarkCheck,
  Bot, User as UserIcon, Loader2, Compass, Zap, Mountain, Coffee,
  ChevronRight, RotateCcw, Star, Map
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface GemResult {
  id: string;
  title: string;
  description: string;
  category?: string;
  imageUrl?: string;
  lat?: number;
  lng?: number;
  distanceKm?: number;
}

type MessageRole = "user" | "assistant";

interface Message {
  role: MessageRole;
  content: string;
  gems?: GemResult[];
  isLoading?: boolean;
}

interface HistoryMessage {
  role: "user" | "model";
  content: [{ text: string }];
}

// ── Suggestion chips ──────────────────────────────────────────────────────────
const SUGGESTIONS = [
  { icon: Mountain, label: "Hidden waterfalls near me" },
  { icon: Coffee,   label: "Cozy secret cafés" },
  { icon: Zap,      label: "Adventurous sunset spots" },
  { icon: Compass,  label: "Off-the-beaten-path gems" },
];

// ── Gem Card ──────────────────────────────────────────────────────────────────
function GemCard({ gem, savedSpots, userId }: {
  gem: GemResult;
  savedSpots: string[];
  userId?: string;
}) {
  const isSaved = savedSpots.includes(gem.id);
  const [saving, setSaving] = useState(false);

  const handleVault = async () => {
    if (!userId) { toast.error("Sign in to save spots"); return; }
    setSaving(true);
    try {
      await toggleSaveSpot(userId, gem.id, isSaved);
      toast.success(isSaved ? "Removed from Vault" : "Added to Vault! 🔒");
    } catch {
      toast.error("Could not update vault");
    } finally {
      setSaving(false);
    }
  };

  const categoryColors: Record<string, string> = {
    Nature: "bg-emerald-100 text-emerald-700",
    Urban: "bg-blue-100 text-blue-700",
    "Food & Drink": "bg-amber-100 text-amber-700",
    Adventure: "bg-red-100 text-red-700",
    Historical: "bg-purple-100 text-purple-700",
    Beach: "bg-cyan-100 text-cyan-700",
  };
  const catStyle = categoryColors[gem.category || ""] || "bg-gray-100 text-gray-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex-shrink-0 w-64 rounded-2xl overflow-hidden border border-black/8 bg-white shadow-sm hover:shadow-md transition-all duration-300"
    >
      <div className="relative h-36 bg-gradient-to-br from-orange-100 via-amber-50 to-white overflow-hidden">
        {gem.imageUrl ? (
          <img src={gem.imageUrl} alt={gem.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Compass className="w-10 h-10 text-orange-300" />
          </div>
        )}
        {gem.category && (
          <span className={`absolute top-3 left-3 text-xs font-semibold px-2 py-0.5 rounded-full ${catStyle}`}>
            {gem.category}
          </span>
        )}
        <button onClick={handleVault} disabled={saving}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm
            ${isSaved ? "bg-orange-500 text-white" : "bg-white/90 text-gray-500 hover:bg-orange-500 hover:text-white"}`}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
        </button>
      </div>

      <div className="p-3">
        <h3 className="font-semibold text-sm text-zinc-900 line-clamp-1 mb-1">{gem.title}</h3>
        <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">{gem.description}</p>
        {gem.distanceKm !== undefined && (
          <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
            <MapPin className="w-3 h-3" /><span>{gem.distanceKm.toFixed(1)} km away</span>
          </div>
        )}
        {gem.lat && (
          <div className="flex items-center gap-1 mt-0.5 text-[10px] text-emerald-500">
            <Map className="w-2.5 h-2.5" /><span>Has location · shows on map</span>
          </div>
        )}
      </div>

      <div className="px-3 pb-3">
        <button onClick={handleVault} disabled={saving}
          className={`w-full py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5
            ${isSaved ? "bg-orange-50 text-orange-600 border border-orange-200" : "bg-zinc-900 text-white hover:bg-orange-500"}`}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : isSaved ? <><BookmarkCheck className="w-3 h-3" /> Saved to Vault</> : <><Bookmark className="w-3 h-3" /> Add to Vault</>}
        </button>
      </div>
    </motion.div>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────────
function MessageBubble({ msg, savedSpots, userId, onSendToMap }: {
  msg: Message;
  savedSpots: string[];
  userId?: string;
  onSendToMap?: (gems: GemResult[], label: string) => void;
}) {
  const isUser = msg.role === "user";
  const hasGems = msg.gems && msg.gems.length > 0;
  const gemsWithLocation = msg.gems?.filter(g => g.lat && g.lng) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm
        ${isUser ? "bg-zinc-900" : "bg-gradient-to-br from-orange-400 to-orange-600"}`}
      >
        {isUser ? <UserIcon className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
      </div>

      <div className={`flex flex-col gap-2 max-w-[78%] ${isUser ? "items-end" : "items-start"}`}>
        {msg.isLoading ? (
          <div className="bg-white border border-black/8 rounded-2xl px-4 py-3 shadow-sm">
            <div className="flex gap-1 items-center">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        ) : (
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm
            ${isUser ? "bg-zinc-900 text-white rounded-tr-sm" : "bg-white border border-black/8 text-zinc-800 rounded-tl-sm"}`}
          >
            {msg.content}
          </div>
        )}

        {/* Gems gallery */}
        {hasGems && (
          <div className="w-full">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-zinc-400 flex items-center gap-1">
                <Star className="w-3 h-3 text-orange-400" />
                {msg.gems!.length} curated spots found
              </p>
              {/* Update Map button */}
              {onSendToMap && gemsWithLocation.length > 0 && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => onSendToMap(msg.gems!, msg.content.slice(0, 40) + "…")}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-sm hover:from-orange-600 hover:to-orange-700 transition-all duration-200 hover:shadow-md hover:scale-105"
                >
                  <Map className="w-3 h-3" />
                  Update Map
                </motion.button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {msg.gems!.map((gem) => (
                <GemCard key={gem.id} gem={gem} savedSpots={savedSpots} userId={userId} />
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function AISearchPage() {
  const { user, savedSpots } = useAuth();
  const { coords: userLocation } = useLocation();
  const bridge = useAIMapBridge();
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    content: "Hey! I'm your Adventure Assistant ✨ Tell me what kind of experience you're looking for — a vibe, a feeling, or a place — and I'll find hidden gems that match.",
  }]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<HistoryMessage[]>([]);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  // Enrich gem IDs → full objects including lat/lng for map
  const enrichGems = useCallback(async (gemIds: string[]): Promise<GemResult[]> => {
    if (!gemIds?.length) return [];
    const results = await Promise.all(
      gemIds.map(async (id) => {
        try {
          const snap = await getDoc(doc(db, "gems", id));
          if (!snap.exists()) return null;
          const d = snap.data();
          return {
            id: snap.id,
            title: d.title || "Hidden Gem",
            description: d.description || "",
            category: d.type || d.category,
            imageUrl: d.imageUrl || (d.media && d.media[0]),
            lat: d.lat || d.latitude ? parseFloat(d.lat || d.latitude) : undefined,
            lng: d.lng || d.longitude ? parseFloat(d.lng || d.longitude) : undefined,
            distanceKm: d._distanceKm,
          } as GemResult;
        } catch {
          return null;
        }
      })
    );
    return results.filter(Boolean) as GemResult[];
  }, []);

  // Push gems to Map Bridge + navigate to home
  const handleSendToMap = useCallback((gems: GemResult[], label: string) => {
    // Set scanning briefly for drama
    bridge.setScanning(true);
    const bridgeGems: BridgeGem[] = gems.map((g) => ({
      id: g.id,
      title: g.title,
      description: g.description,
      category: g.category,
      imageUrl: g.imageUrl,
      lat: g.lat,
      lng: g.lng,
      distanceKm: g.distanceKm,
    }));

    setTimeout(() => {
      bridge.pushGems(bridgeGems, label);
      router.push("/");
    }, 800);

    toast.success("Opening on map! ✨");
  }, [bridge, router]);

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", isLoading: true },
    ]);
    setInput("");
    setIsLoading(true);
    if (inputRef.current) inputRef.current.style.height = "auto";

    // Show scanning on map while thinking
    bridge.setScanning(true);

    try {
      const callAssistant = httpsCallable(functions, "adventureAssistant");
      const result = await callAssistant({
        prompt: text,
        history,
        userLocation: userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined,
      });

      const data = result.data as { text: string; gemIds?: string[] };
      const gems = data.gemIds ? await enrichGems(data.gemIds) : [];

      setHistory((prev) => [
        ...prev,
        { role: "user", content: [{ text }] },
        { role: "model", content: [{ text: data.text }] },
      ]);

      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: data.text, gems };
        return updated;
      });
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Sorry, I couldn't reach the assistant right now. Please try again in a moment.",
        };
        return updated;
      });
      toast.error("Assistant unavailable");
    } finally {
      setIsLoading(false);
      bridge.setScanning(false);
    }
  }, [history, isLoading, userLocation, enrichGems, bridge]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  const handleReset = () => {
    setMessages([{ role: "assistant", content: "Fresh start! Tell me what kind of hidden gem you're searching for ✨" }]);
    setHistory([]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] max-w-3xl mx-auto px-4">

      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-black/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-zinc-900 text-base">Adventure Assistant</h1>
            <p className="text-xs text-zinc-400">AI-powered gem discovery</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/")}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            <Map className="w-3.5 h-3.5" /> View Map
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-zinc-100"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 scrollbar-hide">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              savedSpots={savedSpots}
              userId={user?.uid}
              onSendToMap={handleSendToMap}
            />
          ))}
        </AnimatePresence>

        {messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pl-11 flex flex-wrap gap-2"
          >
            {SUGGESTIONS.map(({ icon: Icon, label }) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl border border-black/10 bg-white hover:bg-orange-50 hover:border-orange-300 hover:text-orange-600 transition-all duration-200 shadow-sm"
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="flex-shrink-0 pb-4">
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-2 px-1">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Conversation context active — I remember what we discussed
            <ChevronRight className="w-3 h-3" />
          </div>
        )}

        <div className="flex gap-3 items-end bg-white border border-black/10 rounded-2xl p-3 shadow-sm focus-within:border-orange-400 focus-within:shadow-md transition-all duration-200">
          <textarea
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Describe a vibe, feeling, or place…"
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-transparent text-sm text-zinc-900 placeholder:text-zinc-400 outline-none leading-relaxed max-h-[120px] disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            className="flex-shrink-0 w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-orange-500 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-center text-xs text-zinc-300 mt-2">
          Powered by Gemini AI · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
