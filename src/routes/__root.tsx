import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 64, margin: 0 }}>404</h1>
        <p style={{ marginTop: 8 }}>Page not found.</p>
        <a href="/" style={{ color: "#26221B", textDecoration: "underline" }}>Go home</a>
      </div>
    </div>
  );
}

function ErrorComponentUI({ reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: 20 }}>Something went wrong.</h1>
        <button onClick={reset} style={{ marginTop: 12, padding: "10px 16px", background: "#26221B", color: "#F1E7D0", border: "none", borderRadius: 8 }}>
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#F1E7D0" },
      { title: "Spelling Blocks — the daily word packing puzzle" },
      {
        name: "description",
        content: "Twelve letter blocks. Use every one. A free daily puzzle.",
      },
      { property: "og:site_name", content: "Spelling Blocks" },
      { property: "og:title", content: "Spelling Blocks — the daily word packing puzzle" },
      { property: "og:description", content: "Twelve letter blocks. Use every one. A free daily puzzle." },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e2ce1b4a-ad74-4f0b-8e11-5399fc956092" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Spelling Blocks — the daily word packing puzzle" },
      { name: "twitter:description", content: "Twelve letter blocks. Use every one. A free daily puzzle." },
      { name: "twitter:image", content: "https://storage.googleapis.com/gpt-engineer-file-uploads/attachments/og-images/e2ce1b4a-ad74-4f0b-8e11-5399fc956092" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Schibsted+Grotesk:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponentUI,
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
      <Outlet />
    </QueryClientProvider>
  );
}
