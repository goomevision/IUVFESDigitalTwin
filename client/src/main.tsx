import { trpc } from "@/lib/trpc";
import { COOKIE_NAME, UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { startLogin } from "./const";
import "./index.css";

const queryClient = new QueryClient();

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  startLogin();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Production can run the complete IUVFES server (UI + tRPC) on one origin.
// GitHub Pages can alternatively point the static UI at an independently
// deployed backend by setting VITE_IUVFES_API_URL at build time.
//
// IMPORTANT: a malformed VITE_IUVFES_API_URL must never make the browser
// construct an invalid fetch URL. Local development must safely fall back to
// the same-origin /api/trpc endpoint.
const configuredApiUrl = import.meta.env.VITE_IUVFES_API_URL?.trim();
let trpcUrl = "/api/trpc";

if (configuredApiUrl) {
  try {
    const parsedApiUrl = new URL(configuredApiUrl, window.location.origin);
    const normalizedPath = parsedApiUrl.pathname.replace(/\/+$/, "");
    const apiPath = normalizedPath.endsWith("/api/trpc")
      ? normalizedPath
      : `${normalizedPath}/api/trpc`;

    trpcUrl = `${parsedApiUrl.origin}${apiPath}`;
  } catch (error) {
    console.warn(
      "[IUVFES] Invalid VITE_IUVFES_API_URL; falling back to same-origin /api/trpc.",
      configuredApiUrl,
      error,
    );
  }
}

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: trpcUrl,
      transformer: superjson,
      headers() {
        // Preview auto-login fallback: when the browser blocks iframe cookies
        // (Safari ITP / private browsing / WebView), the runtime mirrors the
        // session into sessionStorage so we can forward it as a Bearer token.
        // The regular OAuth cookie flow keeps working and takes priority server-side.
        try {
          const raw = sessionStorage.getItem("manus-cookie");
          if (raw) {
            const prefix = `${COOKIE_NAME}=`;
            const pair = raw.split(";").find(s => s.trim().startsWith(prefix));
            const token = pair?.trim().slice(prefix.length);
            if (token) {
              return { Authorization: `Bearer ${token}` };
            }
          }
        } catch {
          // sessionStorage unavailable
        }
        return {};
      },
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
