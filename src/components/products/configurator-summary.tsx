"use client";

import { useRouter } from "next/navigation";
import { PRODUCT_CATEGORY_LABELS } from "@/lib/constants";
import type { ConfigStep } from "@/components/products/product-configurator";

type Props = {
  productSlug: string;
  productTitle: string;
  productCategory: string;
  config: Record<string, string>;
  steps: ConfigStep[];
  savedConfigurationId?: string | null;
  onEdit: () => void;
};

export function ConfiguratorSummary({
  productSlug,
  productTitle,
  productCategory,
  config,
  steps,
  savedConfigurationId,
  onEdit,
}: Props) {
  const router = useRouter();

  const buildInquiryUrl = () => {
    const params = new URLSearchParams({
      product: productSlug,
      configuration: JSON.stringify(config),
      service:
        PRODUCT_CATEGORY_LABELS[productCategory as keyof typeof PRODUCT_CATEGORY_LABELS] ?? "Інше",
    });

    if (savedConfigurationId) {
      params.set("configurationId", savedConfigurationId);
    }

    return `/contact?${params.toString()}`;
  };

  return (
    <div className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-white p-5">
      <h3 className="font-semibold text-[var(--color-text-primary)]">
        Ваша конфігурація: {productTitle}
      </h3>

      <dl className="space-y-2">
        {steps.map((step) => (
          <div key={step.id} className="flex justify-between gap-4 text-sm">
            <dt className="text-[var(--color-text-secondary)]">{step.label}</dt>
            <dd className="text-right font-medium text-[var(--color-text-primary)]">
              {step.options.find((option) => option.value === config[step.id])?.label ??
                config[step.id] ??
                "—"}
            </dd>
          </div>
        ))}
      </dl>

      <div className="flex gap-2 border-t border-[var(--color-border)] pt-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm"
        >
          Змінити
        </button>
        <button
          type="button"
          onClick={() => router.push(buildInquiryUrl())}
          className="flex-1 rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Надіслати заявку з цією конфігурацією
        </button>
      </div>
    </div>
  );
}
