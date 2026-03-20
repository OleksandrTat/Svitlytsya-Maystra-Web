"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, LogOut, Menu, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/auth/is-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

type HeaderUser = {
  id: string;
  displayName: string;
  isAdmin: boolean;
};

const links = [
  { href: "/catalog", label: "Каталог" },
  { href: "/products", label: "Продукти" },
  { href: "/services", label: "Послуги" },
  { href: "/contact", label: "Контакти" },
];

const primaryLinkClass =
  "inline-flex h-10 items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 text-xs font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-700)]";

const secondaryLinkClass =
  "inline-flex h-10 items-center justify-center rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<HeaderUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const profileLinks = useMemo(() => {
    if (!currentUser) {
      return [] as Array<{ href: string; label: string }>;
    }

    if (currentUser.isAdmin) {
      return [{ href: "/admin", label: "Адмін панель" }];
    }

    return [
      { href: "/profile", label: "Профіль" },
      { href: "/profile/orders", label: "Мої замовлення" },
      { href: "/profile/support", label: "Підтримка" },
    ];
  }, [currentUser]);

  useEffect(() => {
    let isMounted = true;
    const supabase = createSupabaseBrowserClient();

    const loadCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (!user) {
        setCurrentUser(null);
        return;
      }

      const displayNameFromMeta =
        typeof user.user_metadata?.display_name === "string" && user.user_metadata.display_name.trim()
          ? user.user_metadata.display_name.trim()
          : typeof user.user_metadata?.name === "string" && user.user_metadata.name.trim()
            ? user.user_metadata.name.trim()
            : "";

      let displayName = displayNameFromMeta;

      if (!displayName) {
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();

        if (!isMounted) {
          return;
        }

        if (typeof profile?.display_name === "string" && profile.display_name.trim()) {
          displayName = profile.display_name.trim();
        }
      }

      setCurrentUser({
        id: user.id,
        displayName: displayName || user.email?.split("@")[0] || "Профіль",
        isAdmin: isAdminUser(user),
      });
    };

    void loadCurrentUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void loadCurrentUser();
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const closeMenus = () => {
    setOpen(false);
    setProfileMenuOpen(false);
  };

  const handleSignOut = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setCurrentUser(null);
    closeMenus();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur transition-shadow duration-200",
        scrolled && "shadow-sm",
      )}
    >
      <div className="mx-auto flex h-18 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Image
            src="/logo.png"
            alt="Svitlytsya Maystra"
            width={36}
            height={36}
            className="rounded-lg object-contain"
          />
          <span className="font-display text-xl text-[var(--color-primary)]">
            Svitlytsya Maystra
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-[var(--color-surface)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-primary)]",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          {currentUser ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              >
                <UserCircle2 className="h-4 w-4" />
                <span>{currentUser.displayName}</span>
                <ChevronDown className="h-4 w-4" />
              </button>

              <div
                className={cn(
                  "absolute right-0 top-[calc(100%+8px)] min-w-[220px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-white shadow-lg",
                  profileMenuOpen ? "block" : "hidden",
                )}
              >
                <div className="border-b border-[var(--color-border)] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
                  {currentUser.displayName}
                </div>
                <div className="p-1">
                  {profileLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeMenus}
                      className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                    >
                      {item.label}
                    </Link>
                  ))}
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Вийти
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]"
            >
              Увійти
            </Link>
          )}

          <Link href="/contact" className={primaryLinkClass}>
            Отримати розрахунок
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-primary)] md:hidden"
          aria-label="Відкрити меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <div
        className={cn(
          "border-t border-[var(--color-border)] bg-[var(--color-background)] px-4 py-4 md:hidden",
          open ? "block" : "hidden",
        )}
      >
        <div className="flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]"
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 border-t border-[var(--color-border)] pt-4">
          {currentUser ? (
            <>
              {profileLinks.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeMenus}
                  className={cn("w-full", secondaryLinkClass)}
                >
                  {item.label}
                </Link>
              ))}
              <Button variant="danger" className="w-full" onClick={() => void handleSignOut()}>
                Вийти
              </Button>
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className={cn("w-full", secondaryLinkClass)}
            >
              Увійти
            </Link>
          )}
        </div>

        <Link href="/contact" onClick={() => setOpen(false)} className={cn("mt-2 w-full", primaryLinkClass)}>
          Отримати розрахунок
        </Link>
      </div>
    </header>
  );
}
