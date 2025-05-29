import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role?: string;
      gnr?: number;
      bnr?: number;
      fnr?: number;
      snr?: number;
      address?: string;
      postalCode?: string;
      postalArea?: string;
      phone?: string;
    } & DefaultSession["user"];
  }

  // Define custom User interface with our properties
  interface User {
    role?: string;
    gnr?: number;
    bnr?: number;
    fnr?: number;
    snr?: number;
    address?: string;
    postalCode?: string;
    postalArea?: string;
    phone?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  // Add this to use JWT instead of database sessions
  session: {
    strategy: "jwt",
  },

  callbacks: {
    // Update the session callback to handle JWT
    session: ({ session, token }) => {
      console.log("Session callback - token:", token);
      console.log("Session callback - session before:", session);

      const updatedSession = {
        ...session,
        user: {
          ...session.user,
          id: token.sub!, // This should be the database user ID
          gnr: token.gnr as number,
          bnr: token.bnr as number,
          fnr: token.fnr as number,
          snr: token.snr as number,
          address: token.address as string,
          postalCode: token.postalCode as string,
          postalArea: token.postalArea as string,
          phone: token.phone as string,
          role: token.role as string,
        },
      };

      console.log("Session callback - session after:", updatedSession);
      return updatedSession;
    },

    // Add JWT callback to store user data in token
    jwt: ({ token, user }) => {
      console.log("JWT callback - user:", user);
      console.log("JWT callback - token before:", token);

      if (user) {
        // Make sure we're storing the actual database user ID
        token.sub = user.id; // This should be the database user ID
        token.gnr = user.gnr;
        token.bnr = user.bnr;
        token.fnr = user.fnr;
        token.snr = user.snr;
        token.address = user.address;
        token.postalCode = user.postalCode;
        token.postalArea = user.postalArea;
        token.phone = user.phone;
        token.role = user.role;
      }

      console.log("JWT callback - token after:", token);
      return token;
    },
  },

  // Remove the adapter for credentials-only authentication
  // adapter: PrismaAdapter(db) as Adapter,

  providers: [
    // Keep your Discord provider if needed, but it won't work without the adapter
    // DiscordProvider({
    //   clientId: env.DISCORD_CLIENT_ID ?? "",
    //   clientSecret: env.DISCORD_CLIENT_SECRET ?? "",
    // }),

    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const { username, password } = credentials ?? {};

        if (username === "user" && password === "user") {
          const dbUser = await db.user.findUnique({
            where: { email: "user@gmail.com" },
          });

          console.log("Found user in DB:", dbUser);

          if (dbUser) {
            return {
              id: dbUser.id, // This was returning the wrong ID - make sure it's the actual DB ID
              name: dbUser.name ?? undefined,
              email: dbUser.email ?? undefined,
              role: dbUser.role ?? undefined,
              gnr: dbUser.gnr ?? undefined,
              bnr: dbUser.bnr ?? undefined,
              fnr: dbUser.fnr ?? undefined,
              snr: dbUser.snr ?? undefined,
              address: dbUser.address ?? undefined,
              postalCode: dbUser.postalCode ?? undefined,
              postalArea: dbUser.postalArea ?? undefined,
              phone: dbUser.phone ?? undefined,
            };
          }
        }

        return null;
      },
    }),
  ],

  /**
   * ...add more providers here.
   *
   * Most other providers require a bit more work than the Discord provider. For example, the
   * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
   * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
   *
   * @see https://next-auth.js.org/providers/github
   */
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);
