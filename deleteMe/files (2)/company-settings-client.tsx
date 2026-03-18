"use client";

import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import {
  Building2, Check, Clock, Globe, Instagram,
  Mail, MapPin, Pencil, Phone, Save, Users, Youtube, X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type CompanyInfo = {
  id: string;
  name: string;
  tagline?: string | null;
  description?: string | null;
  founded_year?: number | null;
  email?: string | null;
  phone?: string | null;
  phone_secondary?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  working_hours?: string | null;
  social_facebook?: string | null;
  social_instagram?: string | null;
  social_youtube?: string | null;
  social_tiktok?: string | null;
};

type TeamMember = {
  id: string;
  name: string;
  role: string;
  photo_url?: string | null;
};

type Props = {
  company: CompanyInfo;
  team?: TeamMember[];
};

/* ─── Editable field ─────────────────────────────────────────────────────── */
function EditableField({
  label, value, onChange, multiline = false, type = "text",
}: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; type?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(value);

  const commit = () => { onChange(local); setEditing(false); };
  const cancel = () => { setLocal(value); setEditing(false); };

  if (editing) {
    return (
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</label>
        <div className="flex items-start gap-2">
          {multiline ? (
            <textarea
              autoFocus value={local} onChange={(e) => setLocal(e.target.value)} rows={3}
              className="flex-1 resize-none rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-sm outline-none" />
          ) : (
            <input
              autoFocus type={type} value={local} onChange={(e) => setLocal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
              className="flex-1 rounded-xl border-2 border-[var(--color-primary)] px-3 py-2 text-sm outline-none" />
          )}
          <div className="flex flex-col gap-1 pt-1">
            <button type="button" onClick={commit} className="rounded-lg bg-[var(--color-primary)] p-1.5 text-white hover:bg-[var(--color-primary-700)]">
              <Check size={13} />
            </button>
            <button type="button" onClick={cancel} className="rounded-lg border border-[var(--color-border)] p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]">
              <X size={13} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group space-y-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">{label}</label>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
          {value || <span className="italic text-[var(--color-text-secondary)]">Не вказано</span>}
        </p>
        <button type="button" onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg p-1 text-[var(--color-text-secondary)] opacity-0 transition group-hover:opacity-100 hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]">
          <Pencil size={12} />
        </button>
      </div>
    </div>
  );
}

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, icon, children, accent = false }: {
  title: string; icon: React.ReactNode; children: React.ReactNode; accent?: boolean;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-white">
      <div className={cn("flex items-center gap-2.5 border-b border-[var(--color-border)] px-5 py-3.5",
        accent ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface)]")}>
        <div className={cn("flex h-7 w-7 items-center justify-center rounded-lg",
          accent ? "bg-white/20" : "bg-[var(--color-primary-100)]")}>
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

/* ─── Main ────────────────────────────────────────────────────────────────── */
export function CompanySettingsClient({ company: init, team: initTeam = [] }: Props) {
  const [data, setData] = useState(init);
  const [team, setTeam] = useState(initTeam);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();

  const set = (key: keyof CompanyInfo, val: string) => {
    setData((prev) => ({ ...prev, [key]: val || null }));
    setDirty(true);
  };

  const save = async () => {
    setSaving(true);
    startTransition(async () => {
      try {
        // const fd = new FormData();
        // Object.entries(data).forEach(([k, v]) => v && fd.set(k, String(v)));
        // await upsertCompanyInfoAction(fd);
        await new Promise((r) => setTimeout(r, 600)); // placeholder
        toast.success("Збережено!");
        setDirty(false);
      } catch {
        toast.error("Помилка збереження");
      } finally {
        setSaving(false);
      }
    });
  };

  return (
    <div className="space-y-5">
      {/* save banner */}
      <AnimatePresence>
        {dirty && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center justify-between rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3">
            <p className="text-sm font-medium text-amber-800">Є незбережені зміни</p>
            <button type="button" onClick={save} disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
              <Save size={14} />
              {saving ? "Збереження..." : "Зберегти"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="space-y-5">
          {/* Identity */}
          <Section title="Ідентичність бренду" icon={<Building2 size={15} />} accent>
            <div className="space-y-4">
              <EditableField label="Назва компанії" value={data.name} onChange={(v) => set("name", v)} />
              <EditableField label="Слоган" value={data.tagline ?? ""} onChange={(v) => set("tagline", v)} />
              <EditableField label="Опис" value={data.description ?? ""} onChange={(v) => set("description", v)} multiline />
              <EditableField label="Рік заснування" value={String(data.founded_year ?? "")} type="number" onChange={(v) => set("founded_year" as any, v)} />
            </div>
          </Section>

          {/* Contacts */}
          <Section title="Контакти" icon={<Phone size={15} />}>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Phone size={14} className="shrink-0 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField label="Телефон" value={data.phone ?? ""} onChange={(v) => set("phone", v)} type="tel" />
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Phone size={14} className="shrink-0 text-[var(--color-text-secondary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField label="Телефон 2" value={data.phone_secondary ?? ""} onChange={(v) => set("phone_secondary", v)} type="tel" />
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3">
                  <Mail size={14} className="shrink-0 text-[var(--color-primary)]" />
                  <div className="min-w-0 flex-1">
                    <EditableField label="Email" value={data.email ?? ""} onChange={(v) => set("email", v)} type="email" />
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Location & hours */}
          <Section title="Розташування та графік" icon={<MapPin size={15} />}>
            <div className="space-y-3">
              <EditableField label="Адреса" value={data.address ?? ""} onChange={(v) => set("address", v)} />
              <div className="grid grid-cols-2 gap-3">
                <EditableField label="Місто" value={data.city ?? ""} onChange={(v) => set("city", v)} />
                <EditableField label="Країна" value={data.country ?? ""} onChange={(v) => set("country", v)} />
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
                <Clock size={14} className="shrink-0 text-[var(--color-primary)]" />
                <div className="flex-1">
                  <EditableField label="Графік роботи" value={data.working_hours ?? ""} onChange={(v) => set("working_hours", v)} />
                </div>
              </div>
            </div>
          </Section>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Social media */}
          <Section title="Соціальні мережі" icon={<Globe size={15} />}>
            <div className="space-y-3">
              {[
                { key: "social_instagram", label: "Instagram", icon: <Instagram size={16} className="text-pink-600" />, placeholder: "https://instagram.com/..." },
                { key: "social_youtube",   label: "YouTube",   icon: <Youtube size={16} className="text-red-600" />,    placeholder: "https://youtube.com/..." },
                { key: "social_tiktok",    label: "TikTok",    icon: <span className="text-sm font-bold">TT</span>,     placeholder: "https://tiktok.com/@..." },
                { key: "social_facebook",  label: "Facebook",  icon: <Globe size={16} className="text-sky-700" />,      placeholder: "https://facebook.com/..." },
              ].map((social) => (
                <div key={social.key} className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)]">
                    {social.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <EditableField
                      label={social.label}
                      value={data[social.key as keyof CompanyInfo] as string ?? ""}
                      onChange={(v) => set(social.key as keyof CompanyInfo, v)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* Team preview */}
          <Section title={`Команда (${team.length})`} icon={<Users size={15} />}>
            {team.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-6 text-center">
                <Users size={24} className="text-[var(--color-border)]" />
                <p className="text-sm text-[var(--color-text-secondary)]">Члени команди ще не додані</p>
              </div>
            ) : (
              <div className="space-y-2">
                {team.slice(0, 5).map((member) => (
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

          {/* Quick save button */}
          {dirty && (
            <button type="button" onClick={save} disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--color-primary)] py-3 text-sm font-semibold text-white disabled:opacity-60 transition hover:bg-[var(--color-primary-700)]">
              <Save size={16} />
              {saving ? "Збереження..." : "Зберегти всі зміни"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
