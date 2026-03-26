"use client";

import { Eye } from "lucide-react";

export function BlogPostViews({ initialCount }: { initialCount: number }) {
  return (
    <span className="flex items-center gap-1">
      <Eye size={14} />
      {initialCount}
    </span>
  );
}
