"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { updateAdminNotificationSettingsAction } from "@/actions/admin/settings";
import type {
  AdminNotificationSettingsPayload,
  NotificationChannel,
  NotificationEventKey,
} from "@/lib/admin/config";

const EVENTS: { key: NotificationEventKey; label: string }[] = [
  { key: "new_inquiry", label: "Нова заявка" },
  { key: "new_message", label: "Нове повідомлення" },
  { key: "status_change", label: "Зміна статусу" },
  { key: "new_comment", label: "Новий коментар" },
  { key: "deadline", label: "Дедлайн < 24 год" },
];

const CHANNELS: NotificationChannel[] = ["email", "sound", "push"];

export function NotificationSettings({
  initial,
}: {
  initial: AdminNotificationSettingsPayload;
}) {
  const [state, setState] = useState(initial);
  const [pending, startTransition] = useTransition();

  const save = (next: AdminNotificationSettingsPayload) => {
    setState(next);
    startTransition(() => {
      updateAdminNotificationSettingsAction(next).then((result) => {
        if (!result.ok) {
          toast.error(result.message);
          return;
        }
        toast.success("Налаштування сповіщень оновлено.");
      });
    });
  };

  const toggle = (eventKey: NotificationEventKey, channel: NotificationChannel) => {
    const next: AdminNotificationSettingsPayload = {
      ...state,
      settings: {
        ...state.settings,
        [eventKey]: {
          ...state.settings[eventKey],
          [channel]: !state.settings[eventKey][channel],
        },
      },
    };
    save(next);
  };

  const saveEmailAddress = () => {
    save(state);
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Сповіщення адміністратора</h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Налаштуйте, які події надсилаються в email, звук або браузерний push.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-left text-[var(--color-text-secondary)]">
              <th className="px-2 py-2">Подія</th>
              {CHANNELS.map((channel) => (
                <th key={channel} className="px-2 py-2 text-center uppercase">
                  {channel}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {EVENTS.map((eventItem) => (
              <tr key={eventItem.key} className="border-b border-[var(--color-border)]/60">
                <td className="px-2 py-3 font-medium text-[var(--color-text-primary)]">{eventItem.label}</td>
                {CHANNELS.map((channel) => (
                  <td key={channel} className="px-2 py-3 text-center">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => toggle(eventItem.key, channel)}
                      className={`h-6 w-11 rounded-full border transition ${
                        state.settings[eventItem.key][channel]
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)]"
                          : "border-[var(--color-border)] bg-white"
                      }`}
                    >
                      <span
                        className={`block h-5 w-5 rounded-full bg-white shadow transition ${
                          state.settings[eventItem.key][channel] ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex flex-wrap items-end gap-2">
        <div className="min-w-[260px] flex-1">
          <label className="mb-1 block text-xs text-[var(--color-text-secondary)]">
            Email для системних подій
          </label>
          <input
            type="email"
            value={state.emailAddress ?? ""}
            onChange={(event) =>
              setState((current) => ({ ...current, emailAddress: event.target.value || null }))
            }
            placeholder="owner@example.com"
            className="h-10 w-full rounded-lg border border-[var(--color-border)] px-3 text-sm"
          />
        </div>
        <button
          type="button"
          onClick={saveEmailAddress}
          disabled={pending}
          className="h-10 rounded-lg bg-[var(--color-primary)] px-4 text-sm font-medium text-white disabled:opacity-60"
        >
          Зберегти email
        </button>
      </div>
    </section>
  );
}
