"use client";

import { useState, useTransition, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  Check,
  Clock,
  Globe,
  Instagram,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Save,
  Users,
  Youtube,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { upsertCompanyInfoAction } from "@/actions/admin";
import type { CompanyInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

type CompanySettingsClientProps = {
  company: CompanyInfo;
};

type EditableFieldProps = {
  label: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  type?: string;
  value: string;
};

function EditableField({
  label,
  multiline = false,
  onChange,
  type = "text",
  value,
}: EditableFieldProps) {
  const [editing, setEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const commit = () => {
    onChange(localValue);
    setEditing(false);
  };

  const cancel = () => {
    setLocalValue(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
          {label}
        </label>
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              autoFocus
              value={localValue}
              onChange={(event) => setLocalValue(event.target.value)}
              rows={3}
              className="flex-1 resize-none rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-sm outline-none"
            />
          ) : (
            <input
              autoFocus
              type={type}
              value={localValue}
              onChange={(event) => setLocalValue(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  commit();
                }
                if (event.key === "Escape") {
                  cancel();
                }
              }}
              className="flex-1 rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-sm outline-none"
            />
          )}
          <div className="flex flex-col gap-1 pt-1">
            <button
              type="button"
              onClick={commit}
              className="rounded-lg bg-[var(--color-primary)] p-1.5 text-white hover:bg-[var(--color-primary-700)]"
            >
              <Check size={13} />
            </button>
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
        {label}
      </label>
      <div className="flex items-start justify-between gap-2">
        <p className="leading-relaxed text-sm text-[var(--color-text-primary)]">
          {value || <span className="italic text-[var(--color-text-secondary)]">Не вказано</span>}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg p-1 text-[var(--color-text-secondary)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]"
        >
          <Pencil size={12} />
        </button>
      </div>
    </div>
  );
}

function Section({
  accent = false,
  children,
  icon,
  title,
}: {
  accent?: boolean;
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white"
    >
      <div
        className={cn(
          "flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-3.5",
          accent ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)]",
        )}
      >
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            accent ? "bg-white/20" : "bg-[var(--color-primary-100)]",
          )}
        >
          <span className={accent ? "text-white" : "text-[var(--color-primary)]"}>{icon}</span>
        </div>
        <h3 className={cn("text-sm font-semibold", accent ? "text-white" : "text-[var(--color-text-primary)]")}>
          {title}
        </h3>
      </div>
      <div className="p-5">{children}</div>
    </motion.div>
  );
}

export function CompanySettingsClient({ company }: CompanySettingsClientProps) {
  const [data, setData] = useState(company);
  const [dirty, setDirty] = useState(false);
  const [saving, startTransition] = useTransition();

  const setField = <K extends keyof CompanyInfo>(key: K, value: CompanyInfo[K]) => {
    setData((current) => ({ ...current, [key]: value }));
    setDirty(true);
  };

  const save = () => {
    const formData = new FormData();
    formData.set("id", data.id);
    formData.set("name", data.name);

    const stringFields: Array<keyof CompanyInfo> = [
      "tagline",
      "description",
      "email",
      "phone",
      "phone_secondary",
      "address",
      "city",
      "country",
      "working_hours",
      "social_facebook",
      "social_instagram",
      "social_youtube",
      "social_tiktok",
    ];

    for (const field of stringFields) {
      const value = data[field];
      if (typeof value === "string" && value.trim()) {
        formData.set(field, value);
      }
    }

    if (typeof data.founded_year === "number" && Number.isFinite(data.founded_year)) {
      formData.set("founded_year", String(data.founded_year));
    }

    startTransition(async () => {
      try {
        const result = await upsertCompanyInfoAction(formData);
        if (!result.ok) {
          toast.error(result.message);
          return;
        }

        setDirty(false);
        toast.success("Дані компанії збережено");
      } catch {
        toast.error("Не вдалося зберегти дані компанії");
      }
    });
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {dirty ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3"
          >
            <p className="text-sm font-medium text-amber-800">Є незбережені зміни</p>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save size={14} />
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Section title="Ідентичність бренду" icon={<Building2 size={15} />} accent>
            <div className="space-y-4">
              <EditableField label="Назва компанії" value={data.name} onChange={(value) => setField("name", value)} />
              <EditableField
                label="Слоган"
                value={data.tagline ?? ""}
                onChange={(value) => setField("tagline", value || null)}
              />
              <EditableField
                label="Опис"
                value={data.description ?? ""}
                multiline
                onChange={(value) => setField("description", value || null)}
              />
              <EditableField
                label="Рік заснування"
                value={data.founded_year ? String(data.founded_year) : ""}
                type="number"
                onChange={(value) =>
                  setField("founded_year", value.trim() ? Number.parseInt(value, 10) || null : null)
                }
              />
            </div>
          </Section>

          <Section title="Контакти" icon={<Phone size={15} />}>
            <div className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Phone size={14} className="shrink-0 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField
                      label="Телефон"
                      value={data.phone ?? ""}
                      type="tel"
                      onChange={(value) => setField("phone", value || null)}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Phone size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField
                      label="Телефон 2"
                      value={data.phone_secondary ?? ""}
                      type="tel"
                      onChange={(value) => setField("phone_secondary", value || null)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Mail size={14} className="shrink-0 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField
                      label="Email"
                      value={data.email ?? ""}
                      type="email"
                      onChange={(value) => setField("email", value || null)}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Розташування та графік" icon={<MapPin size={15} />}>
            <div className="space-y-3">
              <EditableField
                label="Адреса"
                value={data.address ?? ""}
                onChange={(value) => setField("address", value || null)}
              />
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <EditableField
                  label="Місто"
                  value={data.city ?? ""}
                  onChange={(value) => setField("city", value || null)}
                />
                <EditableField
                  label="Країна"
                  value={data.country ?? ""}
                  onChange={(value) => setField("country", value || null)}
                />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <Clock size={14} className="shrink-0 text-[var(--color-primary)]" />
                <div className="flex-1">
                  <EditableField
                    label="Графік роботи"
                    value={data.working_hours ?? ""}
                    onChange={(value) => setField("working_hours", value || null)}
                  />
                </div>
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Соціальні мережі" icon={<Globe size={15} />}>
            <div className="space-y-3">
              {[
                {
                  key: "social_instagram",
                  label: "Instagram",
                  icon: <Instagram size={16} className="text-pink-600" />,
                },
                {
                  key: "social_youtube",
                  label: "YouTube",
                  icon: <Youtube size={16} className="text-red-600" />,
                },
                {
                  key: "social_tiktok",
                  label: "TikTok",
                  icon: <span className="text-sm font-bold">TT</span>,
                },
                {
                  key: "social_facebook",
                  label: "Facebook",
                  icon: <Globe size={16} className="text-sky-700" />,
                },
              ].map((social) => (
                <div
                  key={social.key}
                  className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] p-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)]">
                    {social.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <EditableField
                      label={social.label}
                      value={(data[social.key as keyof CompanyInfo] as string | null) ?? ""}
                      onChange={(value) =>
                        setField(social.key as keyof CompanyInfo, (value || null) as CompanyInfo[keyof CompanyInfo])
                      }
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <Section title={`Команда (${data.team_members.length})`} icon={<Users size={15} />}>
            {data.team_members.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Users size={24} className="text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Члени команди ще не додані
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.team_members.slice(0, 5).map((member) => (
                  <div key={member.id} className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] p-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary-100)] text-xs font-bold text-[var(--color-primary)]">
                      {member.name.slice(0, 1)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">{member.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">{member.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {dirty ? (
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-700)] disabled:opacity-60"
            >
              <Save size={16} />
              {saving ? "Збереження..." : "Зберегти всі зміни"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
