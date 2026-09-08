"use client";

import { useEffect } from "react";

/**
 * Registers the service worker (public/sw.js) once the page has loaded.
 *
 * Renders nothing. Only runs in production, because a service worker in local
 * development gets in the way of hot reload and can serve stale build assets.
 * updateViaCache "none" means the browser always revalidates the worker script
 * itself, so a new deploy takes over promptly instead of being pinned by HTTP
 * caching. Failures are swallowed on purpose: the site works fine without it,
 * the worker only adds installability and an offline fallback on top.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .catch(() => {});
    };

    if (document.readyState === "complete") {
      register();
      return;
    }
    window.addEventListener("load", register);
    return () => window.removeEventListener("load", register);
  }, []);

  return null;
}
