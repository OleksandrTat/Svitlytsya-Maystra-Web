import { Stars } from "@/components/ui/stars";
import type { Testimonial } from "@/lib/types";

type Props = {
  testimonials: Testimonial[];
  linkedCount: number;
};

export function ProductTestimonials({ testimonials, linkedCount }: Props) {
  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="mt-10 space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
          Відгуки клієнтів
        </h2>
        {linkedCount > 0 ? (
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            {linkedCount} про цей виріб
          </span>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((item) => (
          <article
            key={item.id}
            className="rounded-2xl border border-[var(--color-border)] bg-white p-5"
          >
            <Stars rating={item.rating} />
            <p className="mt-3 text-sm leading-6 text-[var(--color-text-secondary)]">
              &quot;{item.content}&quot;
            </p>
            <div className="mt-4 border-t border-[var(--color-border)] pt-3">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {item.author_name}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {item.author_location ?? "Україна"}
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
