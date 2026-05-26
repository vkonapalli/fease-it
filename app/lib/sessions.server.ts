import { createCookieSessionStorage } from "react-router";

export type SessionData = {
  sub: string;
  email?: string;
};

type SessionFlashData = {
  error: string;
};

// Default to a fallback secret if COOKIE_SECRET isn't provided in dev
const cookieSecret = process.env.COOKIE_SECRET || "fallback-secret-for-development";

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: "__session",
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
    sameSite: "lax",
    secrets: [cookieSecret],
    secure: import.meta.env.PROD,
    isSigned: true,
  },
});

export { getSession, commitSession, destroySession };
