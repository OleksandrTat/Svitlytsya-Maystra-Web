import type { Metadata } from "next";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { InquiryForm } from "@/components/shared/inquiry-form";
import { Container } from "@/components/ui/container";
import { PageHero } from "@/components/ui/page-hero";
import { PRODUCT_CATEGORY_LABELS, SERVICE_TYPES } from "@/lib/constants";
import { getContactSettings, getProductBySlug } from "@/lib/data/queries";
import { WORKSHOP_MAP_EMBED_SRC } from "@/lib/maps";
import type { InquirySchema } from "@/lib/validation/inquiry";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("contactPage");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

function normalizeProductLabel(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseConfigurationParam(value?: string) {
  if (!value) return null;
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

  const [contacts, product, t, tCommon, tFooter] = await Promise.all([
    getContactSettings(),
    productSlug ? getProductBySlug(productSlug) : Promise.resolve(null),
    getTranslations("contactPage"),
    getTranslations("common"),
    getTranslations("footer"),
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
  const productLabel =
    product?.title ?? (productSlug ? normalizeProductLabel(productSlug) : undefined);
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
  const mapSrc = WORKSHOP_MAP_EMBED_SRC;

  const CONTACT_BLOCKS = [
    {
      icon: Phone,
      label: t("phone"),
      content: contacts.phone,
      href: contacts.phone ? `tel:${contacts.phone.replace(/\s/g, "")}` : undefined,
    },
    {
      icon: Mail,
      label: t("email"),
      content: contacts.email,
      href: contacts.email ? `mailto:${contacts.email}` : undefined,
    },
    {
      icon: MapPin,
      label: t("address"),
      content: contacts.address,
    },
    {
      icon: Clock,
      label: t("hours"),
      content: tFooter("schedule"),
    },
  ];

  return (
    <>
      <PageHero
        title={t("heroTitle")}
        subtitle={t("heroSubtitle")}
        breadcrumbs={[
          { label: tCommon("home"), href: "/" },
          { label: t("heroTitle") },
        ]}
        height="h-[220px]"
      />

      <section className="py-10 md:py-14">
        <Container>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Left — Contacts + Map */}
            <div className="space-y-6">
              <div className="space-y-3">
                {CONTACT_BLOCKS.map((block) => {
                  const Wrapper = block.href ? "a" : "div";
                  return (
                    <Wrapper
                      key={block.label}
                      {...(block.href ? { href: block.href } : {})}
                      className="flex gap-4 rounded-xl p-4 transition-colors hover:bg-[var(--color-bg-warm)]"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-100)] text-[var(--color-primary)]">
                        <block.icon size={18} />
                      </span>
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
                          {block.label}
                        </p>
                        <p className="mt-0.5 font-medium text-[var(--color-text-primary)]">
                          {block.content}
                        </p>
                      </div>
                    </Wrapper>
                  );
                })}
              </div>

              <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
                <iframe
                  title="Карта майстерні"
                  src={mapSrc}
                  width="100%"
                  height="300"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  style={{ border: 0 }}
                />
              </div>
            </div>

            {/* Right — Form */}
            <div className="rounded-2xl border border-[var(--color-border)] bg-white p-8 shadow-sm">
              <h2 className="font-display text-2xl font-semibold text-[var(--color-text-primary)]">
                {t("formTitle")}
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {t("formSubtitle")}
              </p>
              {productLabel && (
                <div className="mt-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  {t("formContext")}{" "}
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {productLabel}
                  </span>
                </div>
              )}
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
