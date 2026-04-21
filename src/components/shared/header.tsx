"use client";

import { usePathname, useRouter } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ChevronDown, LogOut, Menu, UserCircle2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { isAdminUser } from "@/lib/auth/is-admin";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { LanguageSwitcher } from "@/components/shared/language-switcher";

type HeaderUser = {
  id: string;
  displayName: string;
  isAdmin: boolean;
};

const NAV_HREFS = [
  { href: "/products" as const, key: "products" as const },
  { href: "/services" as const, key: "services" as const },
  { href: "/blog" as const, key: "blog" as const },
  { href: "/contact" as const, key: "contact" as const },
];

export function SiteHeader() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<HeaderUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  const isHomepage = pathname === "/";
  const isTransparent = isHomepage && !scrolled;
  const profileFallback = t("profileFallback");

  const links = NAV_HREFS.map((item) => ({ href: item.href, label: t(item.key) }));

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
      return [{ href: "/admin", label: t("adminPanel") }];
    }

    return [
      { href: "/profile", label: t("profile") },
      { href: "/profile/orders", label: t("orders") },
      { href: "/profile/support", label: t("support") },
    ];
  }, [currentUser, t]);

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
        displayName: displayName || user.email?.split("@")[0] || profileFallback,
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
  }, [profileFallback]);

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

  const primaryLinkClass = cn(
    "inline-flex h-10 items-center justify-center rounded-lg px-5 text-xs font-semibold transition",
    isTransparent
      ? "border border-white/40 bg-white/10 text-white hover:bg-white/20"
      : "border border-[var(--color-primary)] bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-700)]",
  );

  const secondaryLinkClass = cn(
    "inline-flex h-10 items-center justify-center rounded-lg border px-4 text-sm transition",
    isTransparent
      ? "border-white/30 text-white hover:bg-white/10"
      : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
  );

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300",
        isTransparent
          ? "border-b border-transparent bg-transparent"
          : "border-b border-[var(--color-border)] bg-[var(--color-bg)]/95 shadow-sm backdrop-blur",
      )}
    >
      <div className="mx-auto flex h-18 max-w-[1280px] items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.png"
            alt="Svitlytsya Maystra"
            width={36}
            height={36}
            className={cn(
              "rounded-lg object-contain transition",
              isTransparent && "brightness-0 invert",
            )}
          />
          <span
            className={cn(
              "font-display text-xl",
              isTransparent ? "text-white" : "text-[var(--color-primary)]",
            )}
          >
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
                  isTransparent
                    ? isActive
                      ? "text-white"
                      : "text-white/70 hover:text-white"
                    : isActive
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
          <LanguageSwitcher isTransparent={isTransparent} />

          {currentUser ? (
            <div ref={profileMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((value) => !value)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  isTransparent
                    ? "border-white/30 text-white hover:bg-white/10"
                    : "border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]",
                )}
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
                  {profileLinks.map((item) =>
                    item.href.startsWith("/admin") ? (
                      <a
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                      >
                        {item.label}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={closeMenus}
                        className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
                      >
                        {item.label}
                      </Link>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => void handleSignOut()}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("signOut")}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link
              href="/auth/login"
              className={cn(
                "text-sm transition",
                isTransparent
                  ? "text-white/70 hover:text-white"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary)]",
              )}
            >
              {t("login")}
            </Link>
          )}

          <Link href="/contact" className={primaryLinkClass}>
            {t("cta")}
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className={cn(
            "inline-flex h-10 w-10 items-center justify-center rounded-full border md:hidden",
            isTransparent
              ? "border-white/40 text-white"
              : "border-[var(--color-border)] text-[var(--color-primary)]",
          )}
          aria-label={t("openMenu")}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 top-[72px] z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Mobile menu */}
      <div
        className={cn(
          "fixed top-[72px] right-0 bottom-0 z-40 w-80 max-w-[85vw] bg-[var(--color-bg)] shadow-xl transition-transform duration-300 md:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex flex-col gap-1 p-4">
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

        <div className="grid grid-cols-1 gap-2 border-t border-[var(--color-border)] p-4">
          <LanguageSwitcher className="mb-1 self-start" />
          {currentUser ? (
            <>
              {profileLinks.map((item) =>
                item.href.startsWith("/admin") ? (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                  >
                    {item.label}
                  </a>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMenus}
                    className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
                  >
                    {item.label}
                  </Link>
                )
              )}
              <Button variant="danger" className="w-full" onClick={() => void handleSignOut()}>
                {t("signOut")}
              </Button>
            </>
          ) : (
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--color-border)] px-4 text-sm text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)]"
            >
              {t("login")}
            </Link>
          )}

          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-[var(--color-primary)] bg-[var(--color-primary)] px-5 text-xs font-semibold text-[var(--color-on-primary)] transition hover:bg-[var(--color-primary-700)]"
          >
            {t("cta")}
          </Link>
        </div>
      </div>
    </header>
  );
}
