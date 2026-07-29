"use client";

import { KeyIcon, SpinnerGapIcon } from "@phosphor-icons/react";
import { useState, type FormEvent } from "react";

type AdminAccessGateProps = {
  onSuccess: () => void;
};

export function AdminAccessGate({ onSuccess }: AdminAccessGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ code }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        setError(payload?.error ?? "Invalid access code.");
        return;
      }

      onSuccess();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-white px-6 text-zinc-950">
      <form
        onSubmit={handleSubmit}
        className="flex w-full max-w-sm flex-col items-center gap-5 text-center"
      >
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            Enter access code
          </h1>
          <p className="text-sm leading-6 text-zinc-500">
            This admin workspace is private.
          </p>
        </div>

        <div className="relative w-full">
          <KeyIcon
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-zinc-400"
            weight="regular"
          />
          <input
            id="admin-access-code"
            name="code"
            type="password"
            autoComplete="off"
            required
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="Access code"
            className="h-12 w-full rounded-lg border border-zinc-200 bg-white pr-3 pl-10 text-center text-sm text-zinc-950 outline-none transition-[border-color,box-shadow] placeholder:text-zinc-400 focus-visible:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950/10"
          />
        </div>

        {error ? (
          <p
            role="alert"
            className="w-full rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition-[transform,opacity] hover:bg-zinc-800 active:translate-y-px disabled:pointer-events-none disabled:opacity-60"
        >
          {pending ? <SpinnerGapIcon className="size-4 animate-spin" /> : null}
          Continue
        </button>
      </form>
    </div>
  );
}
