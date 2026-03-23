import type { Metadata } from "next";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { PRODUCT_CATEGORY_LABELS, SERVICE_TYPES } from "@/lib/constants";
import { getContactSettings, getProductBySlug } from "@/lib/data/queries";
import type { InquirySchema } from "@/lib/validation/inquiry";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Зв'яжіться з майстернею Svitlytsya Maystra: консультація, прорахунок і старт проєкту.",
};

function normalizeProductLabel(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseConfigurationParam(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const productSlug = typeof params.product === "string" ? params.product : undefined;
  const serviceTypeParam = typeof params.service === "string" ? params.service : undefined;
  const configurationParam =
    typeof params.configuration === "string" ? params.configuration : undefined;
  const configurationId =
    typeof params.configurationId === "string" ? params.configurationId : undefined;

  const [contacts, product] = await Promise.all([
    getContactSettings(),
    productSlug ? getProductBySlug(productSlug) : Promise.resolve(null),
  ]);

  const derivedServiceType = product
    ? (PRODUCT_CATEGORY_LABELS[
        product.category as keyof typeof PRODUCT_CATEGORY_LABELS
      ] as InquirySchema["service_type"])
    : undefined;
  const serviceType = SERVICE_TYPES.includes(serviceTypeParam as InquirySchema["service_type"])
    ? (serviceTypeParam as InquirySchema["service_type"])
    : SERVICE_TYPES.includes(derivedServiceType as InquirySchema["service_type"])
      ? derivedServiceType
      : undefined;
  const productLabel = product?.title ?? (productSlug ? normalizeProductLabel(productSlug) : undefined);
  const parsedConfiguration = parseConfigurationParam(configurationParam);
  const configuration =
    productSlug || parsedConfiguration || configurationId
      ? {
          ...(productSlug
            ? {
                product_slug: productSlug,
                product_title: product?.title ?? null,
                product_category: product?.category ?? null,
              }
            : {}),
          ...(parsedConfiguration ? { selections: parsedConfiguration } : {}),
          ...(configurationId ? { saved_configuration_id: configurationId } : {}),
        }
      : null;
  const fallbackAddress =
    "Вул. Сонячна, 22, Слобідка, Тернопільська область, Україна, 47632";
  const mapAddress =
    typeof contacts.address === "string" && contacts.address.trim().length > 0
      ? contacts.address
      : fallbackAddress;
  const mapSrc = `https://www.google.com/maps?output=embed&q=${encodeURIComponent(mapAddress)}`;

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-8">
              <SectionHeading
                eyebrow="Контакти"
                title="Розкажіть про задачу і ми підготуємо рішення"
                description="Відповідаємо у робочий час. Якщо потрібно, погодимо виїзд на замір або консультацію на об’єкті."
              />

              <dl className="grid gap-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm text-[var(--color-text-secondary)]">
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Телефон</dt>
                  <dd>{contacts.phone}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Email</dt>
                  <dd>{contacts.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Адреса майстерні</dt>
                  <dd>{contacts.address}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-[var(--color-text-primary)]">Графік</dt>
                  <dd>{contacts.hours}</dd>
                </div>
              </dl>

              <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-white">
                <iframe
                  title="Карта майстерні"
                  src={mapSrc}
                  width="100%"
                  height="280"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--color-border)] bg-white p-6">
              <h2 className="font-display text-2xl text-[var(--color-text-primary)]">
                Форма заявки
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Заповніть коротку форму, і ми зв’яжемось найближчим часом.
              </p>
              {productLabel ? (
                <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  Контекст заявки:{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {productLabel}
                  </span>
                </div>
              ) : null}
              <InquiryForm
                className="mt-6"
                compact
                configuration={configuration}
                defaultServiceType={serviceType}
              />
            </div>
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </>
  );
}
