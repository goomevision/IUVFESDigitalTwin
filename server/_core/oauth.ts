import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState, encodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { ENV } from "./env";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const DEFAULT_WEB_ORIGIN = "https://goomevision.github.io";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

function getAllowedWebOrigins(): string[] {
  const configuredOrigins = (process.env.IUVFES_WEB_ORIGINS ?? "")
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);
  return Array.from(new Set([DEFAULT_WEB_ORIGIN, ...configuredOrigins]));
}

export function isAllowedOAuthReturnTo(returnTo: string): boolean {
  try {
    const url = new URL(returnTo);
    if (url.protocol !== "https:") return false;
    if (url.username || url.password) return false;
    if (url.hash) return false;
    return getAllowedWebOrigins().includes(url.origin);
  } catch {
    return false;
  }
}

function getPublicRequestOrigin(req: Request): string {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const protocol = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto)
    ?.split(",")[0]
    ?.trim();
  const effectiveProtocol = protocol === "https" || protocol === "http" ? protocol : req.protocol;
  const forwardedHost = req.headers["x-forwarded-host"];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost)?.split(",")[0]?.trim() || req.get("host");
  return `${effectiveProtocol}://${host}`;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/login", (req: Request, res: Response) => {
    const returnTo = getQueryParam(req, "returnTo") ?? DEFAULT_WEB_ORIGIN;
    if (!isAllowedOAuthReturnTo(returnTo)) {
      res.status(400).json({ error: "invalid oauth return target" });
      return;
    }

    const callbackUri = `${getPublicRequestOrigin(req)}/api/oauth/callback`;
    const nonce = crypto.randomUUID();
    const state = encodeOAuthState({
      redirectUri: callbackUri,
      nonce,
      returnTo,
    });

    res.cookie(OAUTH_STATE_COOKIE, nonce, {
      path: "/",
      maxAge: 10 * 60 * 1000,
      sameSite: "none",
      secure: true,
      httpOnly: true,
    });

    const url = new URL(`${ENV.oAuthServerUrl}/app-auth`);
    url.searchParams.set("appId", ENV.appId);
    url.searchParams.set("redirectUri", callbackUri);
    url.searchParams.set("state", state);
    url.searchParams.set("type", "signIn");

    res.redirect(302, url.toString());
  });

  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // /api/oauth/login set on this API host. Keeping both endpoints on the
    // backend host preserves the __Host- cookie boundary.
    const { nonce, returnTo } = decodeOAuthState(state);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[OAUTH_STATE_COOKIE];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    if (!returnTo || !isAllowedOAuthReturnTo(returnTo)) {
      res.status(400).json({ error: "invalid oauth return target" });
      return;
    }
    res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "none" });

    try {
      const tokenResponse = await sdk.exchangeCodeForToken(code, state);
      const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

      if (!userInfo.openId) {
        res.status(400).json({ error: "openId missing from user info" });
        return;
      }

      await db.upsertUser({
        openId: userInfo.openId,
        name: userInfo.name || null,
        email: userInfo.email ?? null,
        loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
        lastSignedIn: new Date(),
      });

      const sessionToken = await sdk.createSessionToken(userInfo.openId, {
        name: userInfo.name || "",
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.redirect(302, returnTo);
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
