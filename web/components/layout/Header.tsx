"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/brand/Logo";
import { Mark } from "@/components/marks/Mark";
import { ButtonBody } from "@/components/ui/Button";
import { TLink, useTransitionNavigate } from "./PageTransition";
import { useLenis } from "./SmoothScroll";

type NavItem = { href: string; label: string };

const noopSubscribe = () => () => {};

export function Header({
  lang,
  homeHref,
  nav,
  labels,
  contacts,
  latest,
}: {
  lang: "it" | "en";
  homeHref: string;
  nav: NavItem[];
  labels: { menu: string; close: string; switchTo: string; switchToShort: string; skip: string; language: string; home: string; mainNav: string };
  contacts: { email: string; phones: { city: string; phone: string; href: string }[] };
  latest: { href: string; name: string; place: string; image: string; label: string };
}) {
  const pathname = usePathname();
  const lenis = useLenis();
  const navigate = useTransitionNavigate();
  const [dark, setDark] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [altHref, setAltHref] = useState(lang === "it" ? "/en" : "/");
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const firstLink = useRef<HTMLAnchorElement>(null);

  // alternate-language URL from <link rel="alternate" hreflang> set by each page's metadata
  useEffect(() => {
    const other = lang === "it" ? "en" : "it";
    // read after paint: route metadata may stream in after the page body
    const id = requestAnimationFrame(() => {
      const link = document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${other}"]`);
      setAltHref(link?.href ? new URL(link.href).pathname : other === "en" ? "/en" : "/");
    });
    return () => cancelAnimationFrame(id);
  }, [pathname, lang]);

  // theme under the header + hide on scroll down
  useEffect(() => {
    let last = window.scrollY;
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      const h = header.current?.offsetHeight ?? 72;
      const els = document.elementsFromPoint(window.innerWidth / 2, h / 2);
      const themed = els.find((el) => !header.current?.contains(el) && el.closest("[data-theme]"));
      const theme = themed?.closest<HTMLElement>("[data-theme]")?.dataset.theme;
      setDark(theme === "navy" || theme === "ink");
      if (!open) {
        if (y > 120 && y > last + 2) setHidden(true);
        else if (y < last - 2) setHidden(false);
      }
      last = y;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [pathname, open]);

  // menu: lock scroll, Esc to close, focus management
  useEffect(() => {
    if (!open) return;
    const button = menuButton.current;
    lenis?.stop();
    document.documentElement.style.overflow = "hidden";
    // preventScroll: the link is still inside its rising mask; a scrolling focus would offset it
    firstLink.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      lenis?.start();
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open, lenis]);

  // close the menu when the route changes (state adjusted during render, no effect)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  // The server renders this shell with the internal path (/it/news), the browser has the
  // public one (/news): mark the current page only once hydrated, so both renders match.
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
  const isActive = (href: string) => hydrated && href !== homeHref && pathname.startsWith(href);
  const onLatest = hydrated && pathname.startsWith(latest.href);
  const onDark = dark || open;

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:bg-white focus:px-4 focus:py-2 focus:text-navy"
      >
        {labels.skip}
      </a>
      <header
        ref={header}
        data-on={onDark ? "dark" : "light"}
        className="vp-header fixed inset-x-0 top-0 z-[80]"
        style={{
          // "none" when shown: any transform would make the header the containing block of the fixed menu
          transform: hidden && !open ? "translate3d(0,-110%,0)" : "none",
          transition: "transform 420ms var(--ease-move), color 220ms var(--ease-move)",
          color: onDark ? "var(--color-white)" : "var(--color-navy)",
        }}
      >
        <div className="container-x flex h-[var(--header-h)] items-center justify-between pt-[env(safe-area-inset-top,0px)]">
          <TLink href={homeHref} aria-label={`Vitruvius & Partners — ${labels.home}`} className="relative z-10 block py-3" transitionLabel="Vitruvius & Partners">
            <Logo variant={onDark ? "white" : "color"} className="h-auto w-[min(220px,58vw)]" decorative />
          </TLink>

          <nav aria-label={labels.mainNav} className="hidden items-center gap-8 lg:flex">
            {nav.map((item, i) => (
              <TLink
                key={item.href}
                href={item.href}
                transitionLabel={item.label}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={i === nav.length - 1 ? "vp-btn vp-btn--sm" : "vp-navlink t-small"}
              >
                {i === nav.length - 1 ? <ButtonBody arrow={false}>{item.label}</ButtonBody> : item.label}
              </TLink>
            ))}
            <span aria-hidden="true" className="h-4 w-px bg-current opacity-25" />
            <a
              href={altHref}
              hrefLang={lang === "it" ? "en" : "it"}
              lang={lang === "it" ? "en" : "it"}
              onClick={(e) => {
                if (!navigate) return;
                e.preventDefault();
                navigate(altHref, labels.switchTo);
              }}
              className="vp-navlink t-small"
              aria-label={`${labels.switchToShort}, ${labels.switchTo}`}
            >
              {labels.switchToShort}
            </a>
          </nav>

          <button
            ref={menuButton}
            type="button"
            className="vp-menubtn relative z-10 flex h-11 items-center gap-3 lg:hidden"
            aria-expanded={open}
            aria-controls="vp-menu"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="t-small">{open ? labels.close : labels.menu}</span>
            <span aria-hidden="true" className="relative block h-3 w-6">
              <span className="vp-bar absolute left-0 top-[3px] h-px w-6 bg-current" style={{ transform: open ? "translateY(3px) rotate(30deg)" : "none" }} />
              <span className="vp-bar absolute left-0 bottom-[3px] h-px w-6 bg-current" style={{ transform: open ? "translateY(-2px) rotate(-30deg)" : "none" }} />
            </span>
          </button>
        </div>

        <div
          id="vp-menu"
          data-theme="navy"
          hidden={!open}
          className="fixed inset-0 -z-0 flex flex-col justify-between pb-10 pt-[calc(var(--header-h)+3rem)] lg:hidden"
        >
          <nav aria-label={labels.menu} className="container-x">
            <ul className="flex flex-col gap-1">
              {nav.map((item, i) => (
                <li key={item.href} className="mask-line">
                  <TLink
                    ref={i === 0 ? firstLink : undefined}
                    href={item.href}
                    transitionLabel={item.label}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className="vp-menu-item t-l flex items-center gap-4 py-1"
                    style={{ animationDelay: `${80 + i * 50}ms` }}
                  >
                    {item.label}
                    {isActive(item.href) ? <Mark className="vp-menu-mark" /> : null}
                  </TLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="container-x grid gap-8 t-small">
            {onLatest ? null : (
              <TLink href={latest.href} transitionLabel={latest.name} className="vp-menu-latest group flex items-center gap-4">
                <span className="relative block aspect-[4/3] w-24 shrink-0 overflow-hidden bg-[var(--line)]">
                  <Image src={latest.image} alt="" fill sizes="96px" className="object-cover" />
                </span>
                <span className="grid gap-1">
                  <span className="t-label text-[var(--fg-2)]">{latest.label}</span>
                  <span className="t-body leading-tight">
                    <span className="vp-ulink">{latest.name}</span> →
                  </span>
                  <span className="text-[var(--fg-2)]">{latest.place}</span>
                </span>
              </TLink>
            )}
            <a href={altHref} hrefLang={lang === "it" ? "en" : "it"} className="underline decoration-1 underline-offset-4">
              {labels.switchTo}
            </a>
            <div className="grid gap-1 text-[var(--fg-2)]">
              <a href={`mailto:${contacts.email}`}>{contacts.email}</a>
              {contacts.phones.map((p) => (
                <a key={p.href} href={p.href}>
                  {p.city} · {p.phone}
                </a>
              ))}
            </div>
          </div>
        </div>
      </header>
      <style>{`
        /* the header changes colour with the section beneath it: focus follows the text, not the page theme */
        .vp-header :focus-visible { outline-color: currentColor; }
        .vp-navlink { position: relative; padding-block: 0.4rem; }
        .vp-navlink::after {
          content: ""; position: absolute; left: 0; right: 0; bottom: 0; height: 1px; background: currentColor;
          transform: scaleX(0); transform-origin: right; transition: transform 300ms var(--ease-move);
        }
        .vp-navlink:hover::after, .vp-navlink[aria-current="page"]::after { transform: scaleX(1); transform-origin: left; }
        .vp-bar { transition: transform 300ms var(--ease-move); }
        .vp-menu-item { animation: vp-rise 700ms var(--ease-enter) both; }
        @keyframes vp-rise { from { transform: translateY(150%); } to { transform: none; } }
        .vp-menu-mark { height: 0.42em; }
        .vp-menu-latest { animation: vp-fade 600ms var(--ease-enter) 320ms both; }
        @keyframes vp-fade { from { opacity: 0; transform: translateY(0.75rem); } to { opacity: 1; transform: none; } }
        /* the panel opens like the page transition: a plane whose leading edge follows the slope */
        @media (prefers-reduced-motion: no-preference) {
          #vp-menu:not([hidden]) {
            --ms: calc(100lvh * var(--slope));
            animation: vp-menu-open 520ms var(--ease-move) both;
          }
        }
        @keyframes vp-menu-open {
          from { clip-path: polygon(0 0, calc(0px - var(--ms)) 0, 0 100%, 0 100%); }
          to { clip-path: polygon(0 0, 100% 0, calc(100% + var(--ms)) 100%, 0 100%); }
        }
      `}</style>
    </>
  );
}
