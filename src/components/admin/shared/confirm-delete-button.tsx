"use client";

import { MouseEvent } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";
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

    event.preventDefault();
    event.stopPropagation();

    const form = event.currentTarget.form;
    toast.warning(confirmMessage, {
      duration: 6000,
      action: {
        label: "Підтвердити",
        onClick: () => {
          form?.requestSubmit();
        },
      },
    });
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
