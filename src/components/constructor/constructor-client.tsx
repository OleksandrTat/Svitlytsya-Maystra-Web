"use client";

import Image from "next/image";
import { useCallback, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { SERVICE_TYPES } from "@/lib/constants";

type StepOption = {
  value: string;
  label: string;
};

type ConstructorStep = {
  key: string;
  label: string;
  options: StepOption[];
};

type ConstructorClientProps = {
  productType: "door" | "furniture" | "window";
  steps: ConstructorStep[];
  photoMap: Record<string, string>;
  initialConfig: Record<string, string>;
};

type ServiceType = (typeof SERVICE_TYPES)[number];

const PRODUCT_LABELS: Record<ConstructorClientProps["productType"], string> = {
  door: "Двері",
  furniture: "Меблі",
  window: "Вікна",
};

const PRODUCT_SERVICE_MAP: Record<ConstructorClientProps["productType"], ServiceType> = {
  door: "Двері",
  furniture: "Меблі",
  window: "Вікна",
};

function buildConfigurationKey(steps: ConstructorStep[], config: Record<string, string>) {
  return steps.map((step) => config[step.key] || "").join("_");
}

function findConfigurationPhoto(
  steps: ConstructorStep[],
  config: Record<string, string>,
  photoMap: Record<string, string>,
) {
  const exactKey = buildConfigurationKey(steps, config);
  if (photoMap[exactKey]) {
    return { image: photoMap[exactKey], key: exactKey };
  }

  const firstThree = steps
    .slice(0, 3)
    .map((step) => config[step.key] || "")
    .join("_");
  const firstThreeMatch = Object.entries(photoMap).find(([key]) => key.startsWith(firstThree));
  if (firstThreeMatch) {
    return { image: firstThreeMatch[1], key: firstThreeMatch[0] };
  }

  const fallback = Object.entries(photoMap)[0];
  if (fallback) {
    return { image: fallback[1], key: fallback[0] };
  }

  return { image: "/window.svg", key: "fallback" };
}

function serviceTypeByProduct(productType: ConstructorClientProps["productType"]) {
  return PRODUCT_SERVICE_MAP[productType];
}

export function ConstructorClient({
  productType,
  steps,
  photoMap,
  initialConfig,
}: ConstructorClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [config, setConfig] = useState<Record<string, string>>(initialConfig);
  const [showInquiryForm, setShowInquiryForm] = useState(false);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = useMemo(
    () => findConfigurationPhoto(steps, config, photoMap),
    [steps, config, photoMap],
  );

  const updateParam = useCallback(
    (key: string, value: string) => {
      const next = { ...config, [key]: value };
      setConfig(next);

      const params = new URLSearchParams();
      steps.forEach((step) => {
        params.set(step.key, next[step.key] || "");
      });

      startTransition(() => {
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [config, pathname, router, steps],
  );

  const saveConfiguration = () => {
    const storageKey = `sm-constructor-${productType}`;
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        productType,
        key: selected.key,
        config,
        savedAt: new Date().toISOString(),
      }),
    );
    setSavedMessage("Конфігурацію збережено в цьому браузері.");
    setTimeout(() => setSavedMessage(null), 2500);
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setSavedMessage("Посилання скопійовано.");
    setTimeout(() => setSavedMessage(null), 2500);
  };

  return (
    <section className="py-10 md:py-14">
      <div className="mx-auto grid max-w-[1280px] gap-8 px-4 md:px-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-6">
          <h1 className="font-display text-4xl text-[var(--color-text-primary)]">
            Конструктор: {PRODUCT_LABELS[productType]}
          </h1>

          <div className="space-y-5 rounded-3xl border border-[var(--color-border)] bg-white p-5">
            {steps.map((step, index) => (
              <div key={step.key} className="space-y-2">
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {index + 1}. {step.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {step.options.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateParam(step.key, option.value)}
                      className={`rounded-full border px-3 py-1.5 text-sm transition ${
                        config[step.key] === option.value
                          ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white"
                          : "border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setShowInquiryForm((current) => !current)}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
            >
              Замовити цю конфігурацію
            </button>
            <button
              type="button"
              onClick={saveConfiguration}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
            >
              Зберегти
            </button>
            <button
              type="button"
              onClick={() => void copyLink()}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
            >
              Копіювати посилання
            </button>
          </div>

          {savedMessage ? <p className="text-sm text-emerald-700">{savedMessage}</p> : null}

          {showInquiryForm ? (
            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-5">
              <InquiryForm
                defaultServiceType={serviceTypeByProduct(productType)}
                configuration={{
                  product_type: productType,
                  configuration_key: selected.key,
                  ...config,
                }}
              />
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <Image
              key={selected.image}
              src={selected.image}
              alt="Прев'ю конфігурації"
              fill
              className="object-cover transition-opacity duration-300"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {isPending ? (
              <div className="absolute inset-0 grid place-items-center bg-white/40">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-primary)] border-t-transparent" />
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4 text-sm">
            <p className="font-semibold text-[var(--color-text-primary)]">Ключ конфігурації</p>
            <p className="mt-1 break-all text-[var(--color-text-secondary)]">{selected.key}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
