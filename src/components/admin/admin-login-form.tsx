"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      router.push("/admin");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Не вдалося виконати вхід.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-white p-6">
      <label className="space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
        <Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Пароль</span>
        <Input value={password} onChange={(event) => setPassword(event.target.value)} type="password" required />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Вхід..." : "Увійти"}
      </Button>
    </form>
  );
}

