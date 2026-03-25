import Image from "next/image";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Container } from "@/components/ui/container";
import type { ReactNode } from "react";

type Crumb = {
  label: string;
  href?: string;
};

type Props = {
  title: string;
  subtitle?: string;
  imageUrl?: string;
  breadcrumbs?: Crumb[];
  children?: ReactNode;
  height?: string;
};

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1541123437800-1bb1317badc2?auto=format&fit=crop&w=1920&q=80";

export function PageHero({
  title,
  subtitle,
  imageUrl,
  breadcrumbs,
  children,
  height = "h-[280px]",
}: Props) {
  return (
    <section className={`relative flex items-end overflow-hidden ${height}`}>
      <Image
        src={imageUrl ?? DEFAULT_IMAGE}
        alt=""
        fill
        priority
        className="object-cover"
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(26,10,10,0.92) 40%, rgba(92,26,26,0.60) 100%)",
        }}
      />
      <Container className="relative z-10 pb-10">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <Breadcrumbs
            items={breadcrumbs}
            className="text-white/60 [&_a]:text-white/60 [&_a:hover]:text-white [&_span]:text-white/80"
          />
        )}
        <h1 className="mt-3 font-display text-4xl font-bold text-white md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-xl text-base text-white/75">{subtitle}</p>
        )}
        {children}
      </Container>
    </section>
  );
}
