import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { JWT } from "next-auth/jwt";

const GOOGLE_TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

async function refreshGoogleAccessToken(token: JWT): Promise<JWT> {
  if (!token.refreshToken) {
    return {
      ...token,
      error: "MissingRefreshToken",
    };
  }

  try {
    const response = await fetch(GOOGLE_TOKEN_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID ?? "",
        client_secret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        grant_type: "refresh_token",
        refresh_token: token.refreshToken,
      }),
    });

    const refreshed = (await response.json().catch(() => null)) as
      | {
          access_token?: string;
          expires_in?: number;
          refresh_token?: string;
          error?: string;
          error_description?: string;
        }
      | null;

    if (!response.ok || !refreshed?.access_token) {
      throw new Error(
        refreshed?.error_description ||
          refreshed?.error ||
          `Google token refresh failed with status ${response.status}`,
      );
    }

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires:
        Date.now() + Math.max((refreshed.expires_in ?? 3600) - 60, 0) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
      error: undefined,
    };
  } catch (error) {
    console.error("Failed to refresh Google access token:", error);
    return {
      ...token,
      error: "RefreshAccessTokenError",
    };
  }
}

const {
  handlers,
  auth,
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: [
            "openid",
            "email",
            "profile",
            "https://www.googleapis.com/auth/drive.file",
          ].join(" "),
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token ?? token.refreshToken,
          accessTokenExpires:
            Date.now() + Math.max((account.expires_in ?? 3600) - 60, 0) * 1000,
          userId: profile?.email ?? token.userId ?? token.email,
          email: profile?.email ?? token.email,
          error: undefined,
        };
      }

      if (
        typeof token.accessTokenExpires === "number" &&
        Date.now() < token.accessTokenExpires
      ) {
        return token;
      }

      return refreshGoogleAccessToken(token);
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).userId = token.userId ?? token.email ?? null;
      (session as any).tokenError = token.error;

      if (session.user) {
        session.user.email = token.email ?? session.user.email ?? null;
      }

      return session;
    },
  },
});

export { auth };
export const { GET, POST } = handlers;
