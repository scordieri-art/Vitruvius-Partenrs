"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "./Button";

/**
 * Phones and tablets: the page's main action kept at hand in a bar at the foot of the screen,
 * once the opening has been scrolled past, and put away again as soon as the place it leads to
 * (`until`: the contact band, the application form) comes into view. Hidden, it is out of the
 * way of the keyboard and of screen readers too.
 */
export function StickyAction({ href, until, children }: { href: string; until: string; children: ReactNode }) {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const target = document.querySelector(until);
    let past = false;
    let near = false;
    const update = () => setOn(past && !near);
    const onScroll = () => {
      past = window.scrollY > window.innerHeight * 0.8;
      update();
    };
    const io = target
      ? new IntersectionObserver(([e]) => {
          near = e.isIntersecting;
          update();
        })
      : null;
    if (target) io?.observe(target);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    return () => {
      removeEventListener("scroll", onScroll);
      io?.disconnect();
    };
  }, [until]);

  return (
    <div className="vp-stickyact" data-on={on ? "" : undefined}>
      <Button href={href}>{children}</Button>
    </div>
  );
}
