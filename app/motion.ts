"use client";

import { useEffect } from "react";

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const HEADER_OFFSET = 72;

/** Scroll to an element id (or the top), respecting reduced motion. */
export function scrollToTarget(target: string, { immediate = false } = {}) {
  const behavior: ScrollBehavior = immediate || prefersReducedMotion() ? "auto" : "smooth";
  if (target === "top") {
    window.scrollTo({ top: 0, behavior });
    return;
  }
  const element = document.getElementById(target);
  if (!element) return;
  const top = element.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
  window.scrollTo({ top: Math.max(top, 0), behavior });
}

let scrollLocks = 0;

/** Reference-counted page scroll lock for the menu and the case-study dialog. */
export function setScrollLock(locked: boolean) {
  scrollLocks = Math.max(0, scrollLocks + (locked ? 1 : -1));
  document.documentElement.classList.toggle("is-locked", scrollLocks > 0);
}

/**
 * Quiet entrance motion: [data-reveal] elements fade up once as they enter the
 * viewport. Content is visible by default; the effect only applies after the
 * script marks the document, so crawlers and no-JS readers see everything.
 */
export function useReveal(key: string, onScrolledChange?: (scrolled: boolean) => void) {
  useEffect(() => {
    const root = document.documentElement;
    const onScroll = () => onScrolledChange?.(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
      return () => window.removeEventListener("scroll", onScroll);
    }
    root.classList.add("has-reveal");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    document.querySelectorAll("[data-reveal]:not(.is-visible)").forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, [key, onScrolledChange]);
}
