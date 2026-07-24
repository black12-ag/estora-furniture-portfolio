import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import notFoundIllustration from "@/assets/404-illustration.png";

function NotFoundComponent() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <img src={notFoundIllustration} alt="Page not found" width={280} height={280} className="mb-6" />
      <h1 className="text-3xl font-extrabold text-foreground md:text-4xl">Oops! Something went wrong.</h1>
      <p className="mt-3 text-sm text-muted-foreground">The page you're looking for has been moved or doesn't exist anymore.</p>
      <Link to="/" className="btn-primary mt-8">Back to Homepage</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CartProvider } from "../lib/cart-store";
import { CartDrawer } from "../components/CartDrawer";
import { Toaster } from "../components/ui/sonner";
import { EmailVerificationBanner } from "../components/EmailVerificationBanner";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Estora — Modern Furniture & Home Decor" },
      { name: "description", content: "Estora is a modern furniture store offering premium sofas, chairs, lighting and home décor with free shipping over $200." },
      { property: "og:title", content: "Estora — Modern Furniture & Home Decor" },
      { property: "og:description", content: "Premium sofas, chairs, lighting and home décor. Free shipping over $200." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Estora" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F5EFE7", media: "(prefers-color-scheme: light)" },
      { name: "theme-color", content: "#1B2233", media: "(prefers-color-scheme: dark)" },
      { property: "og:image", content: "/og-image.jpg" },
      { name: "twitter:image", content: "/og-image.jpg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      // Light-mode PNG icons (default)
      { rel: "icon", type: "image/png", sizes: "16x16", href: "/icon-16.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "48x48", href: "/icon-48.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-512.png", media: "(prefers-color-scheme: light)" },
      // Dark-mode icon (used where supported)
      { rel: "icon", type: "image/png", sizes: "512x512", href: "/icon-dark-512.png", media: "(prefers-color-scheme: dark)" },
      { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
      // Safari pinned-tab (monochrome SVG mask)
      { rel: "mask-icon", href: "/safari-pinned-tab.svg", color: "#B67B5E" },
      { rel: "manifest", href: "/manifest.webmanifest" },
    ],

    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Estora",
          url: "/",
          logo: "/icon-512.png",
          sameAs: [],
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="flex min-h-screen flex-col">
          <EmailVerificationBanner />
          <Header />
          <main className="flex-1">
            <Outlet />
          </main>
          <Footer />
        </div>
        <CartDrawer />
        <Toaster richColors position="top-right" />
      </CartProvider>
    </QueryClientProvider>
  );
}

