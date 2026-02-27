import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export function HomeHeroSection() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image
        src="https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1920&q=80"
        alt="Майстерня з дерев'яними виробами"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(12,10,9,0.92),rgba(12,10,9,0.58))]" />

      <Container className="relative z-10 py-24 md:py-32">
        <div className="max-w-3xl animate-[fadeIn_0.8s_ease_forwards] opacity-0">
          <h1 className="font-display text-4xl leading-tight text-white md:text-6xl">
            Ваші двері, меблі та вікна під ключ. Спокійно.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Svitlytsya Maystra — сімейна майстерня з 26+ роками досвіду та понад 20 000 реалізованих проєктів. Працюємо уважно до деталей і термінів.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/catalog">
              <Button className="h-12 px-7">Переглянути роботи</Button>
            </Link>
            <Link href="/contact">
              <Button variant="secondary" className="h-12 border-white/70 text-white hover:bg-white/10">
                Отримати розрахунок
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}

