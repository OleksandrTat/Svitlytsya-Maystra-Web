"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/utils";

const categories = ["Всі", "Двері", "Меблі", "Вікна"] as const;

const portfolioItems = [
  {
    id: 1,
    title: "Вхідні двері з масиву дуба",
    category: "Двері",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=600&q=80",
    tall: true,
  },
  {
    id: 2,
    title: "Дизайнерський диван",
    category: "Меблі",
    image: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    id: 3,
    title: "Панорамне вікно",
    category: "Вікна",
    image: "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    id: 4,
    title: "Кухня з натурального дерева",
    category: "Меблі",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=600&q=80",
    tall: true,
  },
  {
    id: 5,
    title: "Міжкімнатні двері",
    category: "Двері",
    image: "https://images.unsplash.com/photo-1536376072261-38c75010e6c9?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    id: 6,
    title: "Арочне вікно з різьбленням",
    category: "Вікна",
    image: "https://images.unsplash.com/photo-1560185007-c5ca9d2c014d?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
  {
    id: 7,
    title: "Стелаж із ясеня",
    category: "Меблі",
    image: "https://images.unsplash.com/photo-1493476523860-a6de6ce1b0c3?auto=format&fit=crop&w=600&q=80",
    tall: true,
  },
  {
    id: 8,
    title: "Спальня з масиву",
    category: "Меблі",
    image: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=600&q=80",
    tall: false,
  },
];

export function PortfolioSection() {
  const [active, setActive] = useState<(typeof categories)[number]>("Всі");

  const filtered =
    active === "Всі"
      ? portfolioItems
      : portfolioItems.filter((item) => item.category === active);

  return (
    <section className="section-padding">
      <Container>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              Портфоліо
            </p>
            <h2 className="heading-h1 text-[var(--color-text-primary)]">
              Роботи, що залишаються
              <br className="hidden md:block" /> на десятиліття
            </h2>
          </div>

          <div className="flex gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={cn(
                  "rounded-lg px-4 py-2 text-sm font-medium transition",
                  active === cat
                    ? "bg-[var(--color-primary)] text-white"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-section)] hover:text-[var(--color-text-primary)]",
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid auto-rows-[200px] grid-cols-2 gap-4 md:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  "group relative overflow-hidden rounded-2xl",
                  item.tall && "row-span-2",
                )}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100">
                  <div className="p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-accent-light)]">
                      {item.category}
                    </p>
                    <p className="mt-1 font-display text-lg text-white">
                      {item.title}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-primary)] transition hover:gap-3"
          >
            Переглянути всі роботи
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Container>
    </section>
  );
}
