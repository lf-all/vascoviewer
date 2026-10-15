"use client";

import { FormEvent, useState } from "react";
import ProfileHeader from "@/components/ProfileHeader";
import PhotoGrid from "@/components/PhotoGrid";
import type { VscoProfile } from "@/lib/scraper";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "done"; profile: VscoProfile };

/** Aceita "nome", "@nome" ou "https://vsco.co/nome/gallery". */
function parseUsername(value: string) {
  return value
    .trim()
    .replace(/^https?:\/\/(www\.)?vsco\.co\//i, "")
    .replace(/^@/, "")
    .split(/[/?#]/)[0];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const username = parseUsername(input);
    if (!username) return;

    setState({ status: "loading" });
    try {
      const res = await fetch(`/api/vsco?username=${encodeURIComponent(username)}`, {
        signal: AbortSignal.timeout(60_000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Erro ao carregar o perfil.");
      setState({ status: "done", profile: data });
    } catch (err) {
      const message =
        err instanceof DOMException && err.name === "TimeoutError"
          ? "A busca demorou demais. Tente novamente."
          : err instanceof Error
            ? err.message
            : "Erro ao carregar o perfil.";
      setState({ status: "error", message });
    }
  }

  const idle = state.status === "idle";

  return (
    <main className="min-h-screen">
      <form
        onSubmit={onSubmit}
        className={`mx-auto flex w-full max-w-md items-center gap-2 px-6 ${idle ? "pt-[32vh]" : "pt-8"}`}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="username do VSCO"
          aria-label="Username do VSCO"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className="min-w-0 flex-1 border-b border-line bg-transparent py-2 text-base outline-none transition-colors placeholder:text-mute focus:border-ink"
        />
        <button
          type="submit"
          disabled={state.status === "loading"}
          className="border border-ink px-4 py-2 text-sm transition-colors hover:bg-ink hover:text-paper disabled:opacity-40"
        >
          Ver perfil
        </button>
      </form>

      {state.status === "loading" && <p className="animate-pulse py-16 text-center text-sm text-mute">Carregando…</p>}

      {state.status === "error" && (
        <p role="alert" className="mx-auto max-w-md px-6 py-16 text-center text-sm text-mute">
          {state.message}
        </p>
      )}

      {state.status === "done" && (
        <>
          <ProfileHeader profile={state.profile} />
          <PhotoGrid photos={state.profile.photos} username={state.profile.username} />
        </>
      )}
    </main>
  );
}
