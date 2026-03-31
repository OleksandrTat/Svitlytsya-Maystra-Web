"use client";

import { useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { subscribeToNewsletterAction } from "@/actions/newsletter";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "inline" | "card" | "footer";
  className?: string;
};

export function NewsletterForm({ variant = "inline", className }: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const fd = new FormData();
    fd.set("email", email);
    if (name) fd.set("name", name);

    const result = await subscribeToNewsletterAction(fd);

    setLoading(false);
    if (result.ok) {
      setSuccess(true);
      setMessage(result.message ?? "");
    } else {
      setError(result.message ?? "Сталась помилка.");
    }
  };

  if (success) {
    if (variant === "footer") {
      return (
        <div className={cn("flex items-center gap-2 text-sm text-emerald-400", className)}>
          <CheckCircle2 size={16} />
          <span>{message || "Підписку оформлено!"}</span>
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-col items-center gap-3 rounded-2xl p-6 text-center",
          variant === "card"
            ? "border border-emerald-200 bg-emerald-50"
            : "bg-emerald-50",
          className,
        )}
      >
        <CheckCircle2 size={32} className="text-emerald-500" />
        <p className="font-display text-lg font-semibold text-emerald-800">
          {message || "Підписку оформлено!"}
        </p>
      </div>
    );
  }

  if (variant === "footer") {
    return (
      <form onSubmit={(e) => void handleSubmit(e)} className={cn("space-y-2", className)}>
        <p className="text-xs text-white/60">Підписатись на новини</p>
        <div className="flex gap-2">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-9 flex-1 rounded-lg border border-white/20 bg-white/5 px-3 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="flex h-9 items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 text-xs font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : "OK"}
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </form>
    );
  }

  if (variant === "card") {
    return (
      <div
        className={cn(
          "rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-warm)] p-6 md:p-8",
          className,
        )}
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-section)]">
            <Mail size={20} className="text-[var(--color-primary)]" />
          </div>
          <h3 className="font-display text-xl font-semibold text-[var(--color-text-primary)]">
            Будьте в курсі новинок
          </h3>
          <p className="mt-2 max-w-md text-sm text-[var(--color-text-secondary)]">
            Корисні поради, огляди матеріалів та ексклюзивні пропозиції — раз на
            місяць.
          </p>
        </div>

        <form
          onSubmit={(e) => void handleSubmit(e)}
          className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-start"
        >
          <input
            type="text"
            placeholder="Ваше ім'я (необов'язково)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none sm:w-40"
          />
          <input
            type="email"
            required
            placeholder="Ваш email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              "Підписатись"
            )}
          </button>
        </form>
        {error && (
          <p className="mt-3 text-center text-sm text-red-600">{error}</p>
        )}
      </div>
    );
  }

  // inline variant
  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className={cn("flex gap-2", className)}
    >
      <input
        type="email"
        required
        placeholder="Ваш email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="h-11 flex-1 rounded-xl border border-[var(--color-border)] bg-white px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading}
        className="inline-flex h-11 items-center justify-center rounded-xl bg-[var(--color-primary)] px-6 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          "Підписатись"
        )}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </form>
  );
}
