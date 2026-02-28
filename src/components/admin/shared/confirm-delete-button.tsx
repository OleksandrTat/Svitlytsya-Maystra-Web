"use client";

import { MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

type ConfirmDeleteButtonProps = {
  label?: string;
  pendingLabel?: string;
  confirmMessage?: string;
  className?: string;
};

export function ConfirmDeleteButton({
  label = "Видалити",
  pendingLabel = "Видалення...",
  confirmMessage = "Ви впевнені, що хочете видалити цей запис?",
  className,
}: ConfirmDeleteButtonProps) {
  const { pending } = useFormStatus();

  const onClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (pending) {
      return;
    }

    const approved = window.confirm(confirmMessage);
    if (!approved) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={pending}
      className={cn("text-xs text-red-600 disabled:opacity-60", className)}
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

