"use client";

import { useActionState, useEffect, useMemo, useState, type BaseSyntheticEvent } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { submitInquiryAction } from "@/actions/inquiries";
import { SERVICE_TYPES } from "@/lib/constants";
import { capturePosthogEvent } from "@/lib/posthog/client";
import { inquirySchema, type InquirySchema } from "@/lib/validation/inquiry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const initialState = {
  success: false,
  message: "",
};

type Props = {
  projectRefId?: string;
  configuration?: Record<string, unknown> | null;
  defaultServiceType?: InquirySchema["service_type"];
  className?: string;
  compact?: boolean;
};

export function InquiryForm({
  projectRefId,
  configuration,
  defaultServiceType = "Двері",
  className,
  compact = false,
}: Props) {
  const pathname = usePathname();
  const [lastSubmitted, setLastSubmitted] = useState<InquirySchema | null>(null);
  const [state, submit, isPending] = useActionState(submitInquiryAction, initialState);
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const serializedConfiguration = useMemo(
    () => (configuration ? JSON.stringify(configuration) : ""),
    [configuration],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquirySchema>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service_type: defaultServiceType,
      message: "",
      source_page: pathname,
      project_ref_id: projectRefId ?? "",
      configuration: serializedConfiguration,
      honeypot: "",
      turnstile_token: "",
    },
  });

  useEffect(() => {
    if (!state.success) {
      return;
    }

    reset({
      name: "",
      phone: "",
      email: "",
      service_type: defaultServiceType,
      message: "",
      source_page: pathname,
      project_ref_id: projectRefId ?? "",
      configuration: serializedConfiguration,
      honeypot: "",
      turnstile_token: "",
    });
  }, [
    state.success,
    reset,
    pathname,
    projectRefId,
    defaultServiceType,
    serializedConfiguration,
  ]);

  useEffect(() => {
    if (!state.success || !lastSubmitted) {
      return;
    }

    capturePosthogEvent("inquiry_submitted", {
      service_type: lastSubmitted.service_type,
      source_page: lastSubmitted.source_page || pathname,
      has_project_ref: Boolean(lastSubmitted.project_ref_id || projectRefId),
    });
  }, [lastSubmitted, pathname, projectRefId, state.success]);

  const onSubmit = handleSubmit(async (values: InquirySchema, event?: BaseSyntheticEvent) => {
    const formTarget = event?.target;
    const formData =
      formTarget instanceof HTMLFormElement ? new FormData(formTarget) : new FormData();

    const payload: InquirySchema = {
      ...values,
      source_page: pathname,
      service_type: values.service_type || defaultServiceType,
      project_ref_id: projectRefId ?? values.project_ref_id ?? "",
      configuration: serializedConfiguration || values.configuration || "",
    };

    setLastSubmitted(payload);

    Object.entries(payload).forEach(([key, value]) => {
      formData.set(key, value ?? "");
    });

    await submit(formData);
  });

  return (
    <form onSubmit={onSubmit} className={cn("space-y-4", className)} noValidate>
      <div className={compact ? "grid gap-4" : "grid gap-4 md:grid-cols-2"}>
        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Імʼя *</span>
          <Input {...register("name")} placeholder="Ваше імʼя" />
          {errors.name ? <p className="text-xs text-red-600">{errors.name.message}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Телефон</span>
          <Input {...register("phone")} type="tel" placeholder="+380XXXXXXXXX" />
          {errors.phone ? <p className="text-xs text-red-600">{errors.phone.message}</p> : null}
        </label>

        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Email</span>
          <Input {...register("email")} type="email" placeholder="name@email.com" />
          {errors.email ? <p className="text-xs text-red-600">{errors.email.message}</p> : null}
        </label>

        <p className="text-xs text-[var(--color-text-secondary)] md:col-span-2">Вкажіть телефон або email</p>

        <label className="space-y-2">
          <span className="text-sm text-[var(--color-text-secondary)]">Тип послуги *</span>
          <Select {...register("service_type")}>
            {SERVICE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
          {errors.service_type ? (
            <p className="text-xs text-red-600">{errors.service_type.message}</p>
          ) : null}
        </label>
      </div>

      <label className="space-y-2">
        <span className="text-sm text-[var(--color-text-secondary)]">Повідомлення</span>
        <Textarea
          {...register("message")}
          rows={4}
          placeholder="Коротко опишіть задачу"
        />
        {errors.message ? <p className="text-xs text-red-600">{errors.message.message}</p> : null}
      </label>

      <input {...register("source_page")} type="hidden" value={pathname} />
      <input {...register("project_ref_id")} type="hidden" value={projectRefId ?? ""} />
      <input
        {...register("configuration")}
        type="hidden"
        value={serializedConfiguration}
      />
      <input {...register("turnstile_token")} type="hidden" defaultValue="" />

      <div className="hidden" aria-hidden>
        <label htmlFor="website">Website</label>
        <input id="website" {...register("honeypot")} autoComplete="off" tabIndex={-1} />
      </div>

      {turnstileSiteKey ? (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js"
            strategy="lazyOnload"
          />
          <div className="cf-turnstile" data-sitekey={turnstileSiteKey} />
        </>
      ) : null}

      {state.message ? (
        <p
          className={cn(
            "text-sm",
            state.success ? "text-emerald-700" : "text-red-600",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Надсилаємо..." : "Відправити"}
      </Button>
    </form>
  );
}
