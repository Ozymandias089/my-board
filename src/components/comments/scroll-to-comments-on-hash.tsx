// src/components/comments/scroll-to-comments-on-hash.tsx
"use client";

import { useEffect } from "react";

export function ScrollToCommentsOnHash() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.location.hash === "#comments") {
      const el = document.getElementById("comments");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return null;
}
