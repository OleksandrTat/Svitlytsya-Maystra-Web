import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CatalogFiltersPanel } from "@/components/catalog/catalog-filters-panel";
import { ProjectCard } from "@/components/catalog/project-card";
import { FinalCtaSection } from "@/components/sections/final-cta";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { getCatalogProjects, parseCatalogFilters } from "@/lib/data/queries";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "РљР°С‚Р°Р»РѕРі СЂРѕР±С–С‚",
  description:
    "РљР°С‚Р°Р»РѕРі СЂРµР°Р»С–Р·РѕРІР°РЅРёС… РїСЂРѕС”РєС‚С–РІ: РґРІРµСЂС–, РјРµР±Р»С– С‚Р° РІС–РєРЅР°. Р¤С–Р»СЊС‚СЂСѓР№С‚Рµ Р·Р° РєР°С‚РµРіРѕСЂС–СЏРјРё, СЃС‚РёР»СЏРјРё С‚Р° РјР°С‚РµСЂС–Р°Р»Р°РјРё.",
};

type SearchParams = Record<string, string | string[] | undefined>;

function CatalogFiltersFallback() {
  return (
    <aside className="space-y-4 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="h-5 w-24 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-20 animate-pulse rounded-full bg-[var(--color-border)]"
          />
        ))}
      </div>
      <div className="h-5 w-20 animate-pulse rounded-full bg-[var(--color-border)]" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-8 w-24 animate-pulse rounded-full bg-[var(--color-border)]"
          />
        ))}
      </div>
    </aside>
  );
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const filters = parseCatalogFilters(params);
  const { items, total } = await getCatalogProjects(filters);

  const hasMore = filters.page * filters.pageSize < total;
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (typeof value === "string") {
      nextParams.set(key, value);
    }
  });

  nextParams.set("page", String(filters.page + 1));

  return (
    <>
      <section className="py-14 md:py-20">
        <Container>
          <SectionHeading
            eyebrow="РљР°С‚Р°Р»РѕРі"
            title="Р РµР°Р»С–Р·РѕРІР°РЅС– РїСЂРѕС”РєС‚Рё РјР°Р№СЃС‚РµСЂРЅС–"
            description="Р’РёРєРѕСЂРёСЃС‚РѕРІСѓР№С‚Рµ С„С–Р»СЊС‚СЂРё, С‰РѕР± Р·РЅР°Р№С‚Рё РїСЂРёРєР»Р°РґРё СЂРѕР±С–С‚ Р·Р° РєР°С‚РµРіРѕСЂС–С”СЋ, СЃС‚РёР»РµРј С‚Р° РјР°С‚РµСЂС–Р°Р»Р°РјРё."
          />

          <div className="mt-10 grid gap-6 lg:grid-cols-[280px_1fr]">
            <Suspense fallback={<CatalogFiltersFallback />}>
              <CatalogFiltersPanel filters={filters} />
            </Suspense>

            <div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {items.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>

              {items.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-[var(--color-border)] p-8 text-center text-sm text-[var(--color-text-secondary)]">
                  Р—Р° РѕР±СЂР°РЅРёРјРё С„С–Р»СЊС‚СЂР°РјРё РїРѕРєРё РЅРµРјР°С” СЂРѕР±С–С‚.
                </p>
              ) : null}

              {hasMore ? (
                <div className="mt-8 flex justify-center">
                  <Link
                    href={`/catalog?${nextParams.toString()}`}
                    className="rounded-full border border-[var(--color-border)] px-6 py-3 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
                  >
                    РџРѕРєР°Р·Р°С‚Рё Р±С–Р»СЊС€Рµ
                  </Link>
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </section>

      <FinalCtaSection />
    </>
  );
}
