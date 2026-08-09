import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import appCss from "~/styles/app.css?url";
import { CartProvider } from "~/context/CartContext";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "GreenExpress — Premium Cannabis Delivery" },
      { name: "description", content: "Premium cannabis delivery from your local dispensaries" },
      // PWA meta tags
      { name: "theme-color", content: "#0D2818" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "black-translucent" },
      { name: "apple-mobile-web-app-title", content: "GreenExpress" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "application-name", content: "GreenExpress" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap",
      },
      // PWA manifest
      { rel: "manifest", href: "/manifest.json" },
      // iOS home screen icon
      { rel: "apple-touch-icon", href: "/icons/icon-192.svg", sizes: "192x192" },
      { rel: "apple-touch-icon", href: "/icons/icon-512.svg", sizes: "512x512" },
    ],
  }),
  notFoundComponent: () => (
    <div className="flex min-h-dvh items-center justify-center">
      <div className="text-center px-6">
        <h1 className="font-[var(--font-heading)] text-4xl font-bold text-[var(--color-neutral-800)]">404</h1>
        <p className="mt-2 text-[var(--color-neutral-500)]">Page not found</p>
        <a href="/" className="mt-4 inline-block text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)]">
          Go home
        </a>
      </div>
    </div>
  ),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
        {/* Service Worker Registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then(
      (reg) => console.log('SW registered:', reg.scope),
      (err) => console.warn('SW registration failed:', err)
    );
  });
}
            `.trim(),
          }}
        />
      </body>
    </html>
  );
}