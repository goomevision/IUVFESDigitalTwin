import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

async function getLocalDevelopmentUser(): Promise<User | null> {
  if (process.env.NODE_ENV === "production") return null;
  if (process.env.LOCAL_DEV_AUTH !== "true") return null;

  const configuredId = Number.parseInt(process.env.LOCAL_DEV_USER_ID ?? "1", 10);
  const userId = Number.isInteger(configuredId) && configuredId > 0 ? configuredId : 1;
  const user = await db.getUserById(userId);

  if (!user) {
    console.warn(`[Auth] LOCAL_DEV_AUTH user ${userId} was not found in the database`);
    return null;
  }

  console.log(`[Auth] Local development user enabled: id=${user.id}, name=${user.name ?? "unknown"}`);
  return user;
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const localDevelopmentUser = await getLocalDevelopmentUser();
  if (localDevelopmentUser) {
    return {
      req: opts.req,
      res: opts.res,
      user: localDevelopmentUser,
    };
  }

  let user: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
