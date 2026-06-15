"use client";

import { useEffect, useState } from "react";

/**
 * Returns true after the component has hydrated on the client. Useful for
 * deferring SSR-incompatible work — most notably Recharts' ResponsiveContainer,
 * which measures parent dimensions and emits "width(-1) and height(-1)"
 * console warnings when it runs without a DOM during server-side rendering.
 *
 * Use by short-circuiting return: `if (!useIsMounted()) return <placeholder/>;`
 */
export function useIsMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
