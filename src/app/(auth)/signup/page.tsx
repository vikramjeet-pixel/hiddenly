"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  signUpWithEmail,
  signInWithGoogle,
  getFirebaseErrorMessage,
} from "@/lib/firebase";

// ─── Validation Schema ──────────────────────────────────────
const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [firebaseError, setFirebaseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    setFirebaseError(null);
    try {
      await signUpWithEmail(data.email, data.password, data.fullName);
      router.push("/");
    } catch (error: any) {
      setFirebaseError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setFirebaseError(null);
    try {
      await signInWithGoogle();
      router.push("/");
    } catch (error: any) {
      setFirebaseError(getFirebaseErrorMessage(error.code));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-black">
      {/* Background Image */}
      <Image
        src="/auth-bg.png"
        alt="Dark nature background"
        fill
        className="object-cover brightness-50"
        priority
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl tracking-tighter text-white font-bold mb-3" style={{ fontFamily: "var(--font-serif)" }}>
            NomadSecret
          </h1>
          <p className="text-[10px] tracking-[0.3em] text-white/60 uppercase font-light">
            An Anthology of Rare Destinations
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="space-y-6">
            {/* Full Name Input */}
            <div className="group relative">
              <label className="block text-[10px] tracking-[0.2em] text-white/50 mb-2 group-focus-within:text-white transition-colors uppercase">
                Full Name
              </label>
              <input
                {...register("fullName")}
                className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 focus:ring-0 focus:border-white text-white text-sm tracking-wide placeholder:text-white/20 transition-all outline-none"
                placeholder="ALEXANDER VANE"
                type="text"
                disabled={isLoading}
              />
              {errors.fullName && (
                <p className="text-red-400 text-xs mt-1 absolute -bottom-5">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email Input */}
            <div className="group relative">
              <label className="block text-[10px] tracking-[0.2em] text-white/50 mb-2 group-focus-within:text-white transition-colors uppercase">
                Email Address
              </label>
              <input
                {...register("email")}
                className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 focus:ring-0 focus:border-white text-white text-sm tracking-wide placeholder:text-white/20 transition-all outline-none uppercase"
                placeholder="CURATOR@NOMADSECRET.COM"
                type="email"
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1 absolute -bottom-5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="group relative">
              <label className="block text-[10px] tracking-[0.2em] text-white/50 mb-2 group-focus-within:text-white transition-colors uppercase">
                Password
              </label>
              <input
                {...register("password")}
                className="w-full bg-transparent border-0 border-b border-white/20 py-3 px-0 focus:ring-0 focus:border-white text-white text-sm tracking-wide placeholder:text-white/20 transition-all outline-none"
                placeholder="••••••••••••"
                type="password"
                disabled={isLoading}
              />
              {errors.password && (
                <p className="text-red-400 text-xs mt-1 absolute -bottom-5">
                  {errors.password.message}
                </p>
              )}
            </div>
          </div>

          {firebaseError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-xs text-center border-l-2 border-red-500 pl-2">
                {firebaseError}
              </p>
            </div>
          )}

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-white text-black py-4 rounded-full text-xs tracking-[0.2em] font-bold hover:bg-white/90 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:active:scale-100"
            >
              {isLoading ? "CREATING PROFILE..." : "JOIN THE JOURNEY"}
              {!isLoading && <span className="material-symbols-outlined text-sm">arrow_forward</span>}
            </button>
          </div>
        </form>

        <div className="space-y-6 pt-8">
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-white/10" />
            <span className="text-[9px] tracking-[0.2em] text-white/30 uppercase">
              Authenticate with
            </span>
            <div className="h-[1px] flex-1 bg-white/10" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 py-4 border border-white/20 rounded-full hover:bg-white/5 active:scale-95 transition-all text-white disabled:opacity-50 disabled:active:scale-100"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="currentColor"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="currentColor"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                fill="currentColor"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="currentColor"
              />
            </svg>
            <span className="text-[10px] tracking-[0.15em] font-bold">GOOGLE</span>
          </button>
        </div>

        <div className="text-center pt-8">
          <Link
            href="/login"
            className="text-[10px] tracking-[0.2em] text-white/50 hover:text-white transition-colors uppercase underline-offset-8 hover:underline decoration-white/20"
          >
            Already a traveler? Log In
          </Link>
        </div>
      </div>
    </main>
  );
}
