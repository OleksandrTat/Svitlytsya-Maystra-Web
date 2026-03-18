"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { exportMyDataAction } from "@/actions/profile-data";

export function ExportMyDataButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onExport = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await exportMyDataAction();

      if (!result.ok || !result.data) {
        setError(result.message);
        return;
      }

      const json = JSON.stringify(result.data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `my-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Не вдалося завантажити дані.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={onExport}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        <Download size={16} />
        {loading ? "Завантаження..." : "Завантажити мої дані (JSON)"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
