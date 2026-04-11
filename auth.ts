// auth.ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const {
  handlers,
  auth, // <-- we’ll use this on the server to read the session
} = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // optional: add Drive scope if you haven't already
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

  callbacks: {
    async jwt({ token, account }) {
      // On first login, grab provider access token
      if (account?.access_token) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      // Expose accessToken to the client + server
      (session as any).accessToken = token.accessToken;
      return session;
    },
  },
});

export { auth };

// keep your existing style for the auth route
export const { GET, POST } = handlers;
