import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start OAuth through the configured backend. The backend owns nonce creation
// and the callback so the __Host- OAuth state cookie is created and validated
// on the same host. `returnTo` is validated server-side against the configured
// web origins; the client never supplies a callback URI to the provider.
export const startLogin = () => {
  const configuredApiUrl = import.meta.env.VITE_IUVFES_API_URL?.trim().replace(/\/$/, "");
  const loginUrl = `${configuredApiUrl ? configuredApiUrl : ""}/api/oauth/login?returnTo=${encodeURIComponent(window.location.origin)}`;
  window.location.href = loginUrl;
};
