"use client";

import {
  AtIcon,
  CaretLeftIcon,
  LockSimpleIcon,
  PencilSimpleIcon,
  SpinnerGapIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { useQuery } from "convex/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import { api } from "../../../convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type AdminAuthScreenProps = {
  homeHref: string;
  onAuthenticated: () => void;
};

type SubmitState = "idle" | "loading" | "success";

const authSuccessDisplayMs = 650;

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function AdminAuthScreen({
  homeHref,
  onAuthenticated,
}: AdminAuthScreenProps) {
  const [email, setEmail] = useState("");
  const [debouncedEmail, setDebouncedEmail] = useState("");
  const [emailLocked, setEmailLocked] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (emailLocked) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setDebouncedEmail(email.trim().toLowerCase());
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [email, emailLocked]);

  const lookup = useQuery(
    api.auth.emailExists,
    !emailLocked && isValidEmail(debouncedEmail)
      ? { email: debouncedEmail }
      : "skip",
  );

  useEffect(() => {
    if (emailLocked || lookup === undefined) {
      return;
    }

    const current = email.trim().toLowerCase();
    if (!isValidEmail(current) || current !== debouncedEmail) {
      return;
    }

    setExists(lookup.exists);
    setEmailLocked(true);
    setPassword("");
    setName("");
    setError(null);
  }, [lookup, debouncedEmail, email, emailLocked]);

  const lookingUp =
    !emailLocked &&
    isValidEmail(debouncedEmail) &&
    email.trim().toLowerCase() === debouncedEmail &&
    lookup === undefined;

  function unlockEmail() {
    setEmail("");
    setEmailLocked(false);
    setExists(null);
    setPassword("");
    setName("");
    setError(null);
    setDebouncedEmail("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!emailLocked || exists === null) {
      return;
    }

    setSubmitState("loading");

    try {
      if (exists) {
        // No callbackURL: Better Auth's default redirect plugin would answer it
        // with window.location.href, and a full page load kills the slide-up
        // transition. The caller navigates client-side instead.
        const { error: signInError } = await authClient.signIn.email({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInError) {
          setError(signInError.message ?? "Unable to sign in.");
          setSubmitState("idle");
          return;
        }
      } else {
        const { error: signUpError } = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || email.trim().split("@")[0] || "Admin",
        });

        if (signUpError) {
          setError(signUpError.message ?? "Unable to create your account.");
          setSubmitState("idle");
          return;
        }
      }

      setSubmitState("success");
      await new Promise<void>((resolve) => {
        window.setTimeout(resolve, authSuccessDisplayMs);
      });
      onAuthenticated();
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitState("idle");
    }
  }

  return (
    <div className="grid min-h-svh bg-white text-zinc-950 lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden lg:block">
        <Image
          src="/optimized/auth-dithered.png"
          alt=""
          fill
          priority
          sizes="50vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/35" />
        <div className="absolute inset-x-0 top-0 p-8 xl:p-10">
          <Image
            src="/mrmpl-full-white.svg"
            alt="Mayank Raw Mint Pvt. Ltd."
            width={180}
            height={40}
            priority
            className="h-9 w-auto"
          />
        </div>
      </aside>

      <main className="relative flex min-h-svh flex-col px-6 py-6 sm:px-10 lg:px-14 lg:py-8 xl:px-20 xl:py-10">
        <div className="flex h-9 items-center justify-between gap-4 lg:justify-end">
          <Link
            href={homeHref}
            className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-950"
          >
            <CaretLeftIcon className="size-3.5" weight="bold" />
            Home
          </Link>
          <Image
            src="/mrmpl-full-green.svg"
            alt="Mayank Raw Mint Pvt. Ltd."
            width={140}
            height={32}
            className="h-7 w-auto lg:hidden"
          />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <div className="flex flex-col gap-8">
            <h1 className="font-heading text-center text-[2rem] leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              Sign In or Create an Account
            </h1>

            <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
              <div className="relative w-full">
                <label htmlFor="admin-email" className="sr-only">
                  Email address
                </label>
                <AtIcon
                  className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
                  weight="regular"
                />
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  readOnly={emailLocked}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="your.email@example.com"
                  className={cn(
                    authFieldClassName,
                    emailLocked ? "pr-11" : "pr-3",
                    lookingUp && "pr-11",
                  )}
                />
                {lookingUp ? (
                  <SpinnerGapIcon className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-zinc-400" />
                ) : null}
                {emailLocked ? (
                  <button
                    type="button"
                    onClick={unlockEmail}
                    aria-label="Edit email"
                    className="absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-950"
                  >
                    <PencilSimpleIcon className="size-4" weight="regular" />
                  </button>
                ) : null}
              </div>

              <AnimatePresence initial={false} mode="popLayout">
                {emailLocked && exists === false ? (
                  <motion.div
                    key="name-field"
                    initial={{ height: 0, opacity: 0, y: -8 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -8 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1">
                      <div className="relative w-full">
                        <label htmlFor="admin-name" className="sr-only">
                          Full name
                        </label>
                        <UserIcon
                          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
                          weight="regular"
                        />
                        <input
                          id="admin-name"
                          name="name"
                          type="text"
                          autoComplete="name"
                          required
                          value={name}
                          onChange={(event) => setName(event.target.value)}
                          placeholder="Full name"
                          className={authFieldClassName}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : null}

                {emailLocked && exists !== null ? (
                  <motion.div
                    key="password-field"
                    initial={{ height: 0, opacity: 0, y: -8 }}
                    animate={{ height: "auto", opacity: 1, y: 0 }}
                    exit={{ height: 0, opacity: 0, y: -8 }}
                    transition={{
                      duration: 0.35,
                      ease: [0.22, 1, 0.36, 1],
                      delay: exists === false ? 0.05 : 0,
                    }}
                    className="overflow-hidden"
                  >
                    <div className="pt-1">
                      <div className="relative w-full">
                        <label htmlFor="admin-password" className="sr-only">
                          Password
                        </label>
                        <LockSimpleIcon
                          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
                          weight="regular"
                        />
                        <input
                          id="admin-password"
                          name="password"
                          type="password"
                          autoComplete={
                            exists ? "current-password" : "new-password"
                          }
                          required
                          minLength={8}
                          value={password}
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Enter your password"
                          className={authFieldClassName}
                        />
                      </div>
                    </div>
                  </motion.div>
                ) : null}
              </AnimatePresence>

              {error ? <AuthError message={error} /> : null}

              <AnimatePresence initial={false}>
                {emailLocked && exists !== null ? (
                  <motion.div
                    key="submit"
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.25 }}
                  >
                    <button
                      type="submit"
                      disabled={submitState !== "idle"}
                      aria-busy={submitState === "loading"}
                      className={cn(
                        authPrimaryButtonClassName,
                        submitState === "success"
                          ? "bg-green-500 text-black hover:bg-green-500 disabled:opacity-100"
                          : "bg-zinc-950 text-white hover:bg-zinc-800",
                      )}
                    >
                      <AnimatePresence initial={false} mode="wait">
                        <motion.span
                          key={submitState}
                          initial={
                            reducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: 4, filter: "blur(2px)" }
                          }
                          animate={{
                            opacity: 1,
                            y: 0,
                            filter: "blur(0px)",
                          }}
                          exit={
                            reducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, y: -4, filter: "blur(2px)" }
                          }
                          transition={{
                            duration: reducedMotion ? 0.1 : 0.18,
                            ease: [0.23, 1, 0.32, 1],
                          }}
                          className="inline-flex items-center justify-center gap-2"
                        >
                          {submitState === "loading" ? (
                            <SpinnerGapIcon className="size-4 animate-spin motion-reduce:animate-none" />
                          ) : null}
                          {submitState === "success"
                            ? "Welcome!"
                            : exists
                              ? "Sign In"
                              : "Create Account"}
                        </motion.span>
                      </AnimatePresence>
                    </button>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
    >
      {message}
    </p>
  );
}

const authFieldClassName =
  "h-12 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-10 text-left text-sm text-zinc-950 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 read-only:bg-zinc-50 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950/10";

const authPrimaryButtonClassName =
  "inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-lg text-sm font-semibold transition-[background-color,color,transform,opacity] duration-200 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-60 motion-reduce:transition-none";
