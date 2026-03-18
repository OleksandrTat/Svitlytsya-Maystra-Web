"use client";

import { useState } from "react";
import { requestContentAssist } from "@/lib/admin/request-content-assist";

type SeoAssistResult = {
  seoTitle: string;
  seoDescription: string;
  slug: string;
};

type Options = {
  title: string;
  description: string;
  category?: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\u0400-\u04ff]+/gi, "-")
    .replace(/^-+|-+$/g, "");
}

function buildAssistContent({ title, description, category }: Options) {
  return [
    `Назва: ${title || "Без назви"}`,
    `Категорія: ${category || "не вказано"}`,
    `Опис: ${description || "Опис поки що короткий, але сторінка стосується каталогу виробів з індивідуальним виготовленням."}`,
    "Сторінка призначена для SEO-опису каталожного елемента в адміністративній панелі.",
    `Ключова назва: ${title || "Без назви"}`,
    `Деталі: ${description || title || "Індивідуальний виріб"}`,
  ].join("\n");
}

export function useAiSeoAssist() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async (options: Options): Promise<SeoAssistResult | null> => {
    if (!options.title.trim() && !options.description.trim()) {
      setError("Вкажіть назву або опис для генерації.");
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await requestContentAssist({
        title: options.title.trim(),
        content: buildAssistContent(options),
      });

      return {
        seoTitle: result.seoTitle,
        seoDescription: result.seoDescription,
        slug: slugify(options.title),
      };
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Не вдалося згенерувати SEO поля.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    generate,
    loading,
    error,
    clearError: () => setError(null),
  };
}
