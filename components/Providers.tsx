"use client";

import { CartProvider } from "./CartProvider";
import { CartDrawer } from "./CartDrawer";
import { StickyCartBar } from "./StickyCartBar";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <CartProvider>
        {children}
        <CartDrawer />
        <StickyCartBar />
      </CartProvider>
    </ThemeProvider>
  );
}
