import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

function getOAuthStateCookieName(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const secure = req.protocol === "https" ||
    (typeof forwardedProto === "string" && forwardedProto.split(",").some(p => p.trim().toLowerCase() === "https"));
  if (!secure && LOCAL_HOSTS.has(req.hostname)) return "oauth_state";
  return OAUTH_STATE_COOKIE;
}

function getOAuthStateCookieOptions(req: Request) {
  const secure = req.protocol === "https" ||
    (typeof req.headers["x-forwarded-proto"] === "string" && req.headers["x-forwarded-proto"].split(",").some(p => p.trim().toLowerCase() === "https"));
  return secure
    ? { path: "/", secure: true, sameSite: "none" as const }
    : { path: "/", secure: false, sameSite: "lax" as const };
}

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", async (req: Request, res: Response) => {
    const code = getQueryParam(req, "code");
    const state = getQueryParam(req, "state");

    if (!code || !state) {
      res.status(400).json({ error: "code and state are required" });
      return;
    }

    // CSRF guard: the nonce in `state` must match the one-time cookie that
    // startLogin set in the browser that began this login. Local HTTP uses a
    // non-__Host cookie because browsers reject Secure/__Host cookies on HTTP.
    const { nonce } = decodeOAuthState(state);
    const stateCookieName = getOAuthStateCookieName(req);
    const expectedNonce = parseCookieHeader(req.headers.cookie ?? "")[stateCookieName];
    if (!nonce || nonce !== expectedNonce) {
      res.status(403).json({ error: "invalid oauth state" });
      return;
    }
    res.clearCookie(stateCookieName, getOAuthStateCookieOptions(req));

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

      res.redirect(302, "/");
    } catch (error) {
      console.error("[OAuth] Callback failed", error);
      res.status(500).json({ error: "OAuth callback failed" });
    }
  });
}
