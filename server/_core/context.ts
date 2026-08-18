import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { getUserById } from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // External OAuth is optional during local development.
    user = null;
  }

  /*
   * LOCAL DEVELOPMENT ONLY.
   *
   * Never activate this fallback in production.
   * The configured local database user is used only when
   * external OAuth authentication did not produce a user.
   */
  if (
    !user &&
    process.env.NODE_ENV !== "production" &&
    process.env.LOCAL_DEV_AUTH === "true"
  ) {
    const localUserId = Number(process.env.LOCAL_DEV_USER_ID ?? "1");

    if (Number.isInteger(localUserId) && localUserId > 0) {
      const localUser = await getUserById(localUserId);

      if (localUser) {
        user = localUser;
        console.log(
          `[Auth] Local development user activated: ${localUser.id} (${localUser.name ?? "unnamed"})`
        );
      }
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
