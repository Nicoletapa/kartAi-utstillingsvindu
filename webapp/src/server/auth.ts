import { PrismaAdapter } from "@auth/prisma-adapter";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import { type Adapter } from "next-auth/adapters";
import DiscordProvider from "next-auth/providers/discord";
import { env } from "process";


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
  callbacks: {
    session: ({ session, user }) => {
      // Type assertion to include our custom properties
      const typedUser = user as typeof user & {
        role?: string;
        gnr?: number;
        bnr?: number;
        fnr?: number;
        snr?: number;
        address?: string;
        postalCode?: string;
        postalArea?: string;
        phone?: string;
      };
      
      return {
        ...session,
        user: {
          ...session.user,
          id: typedUser.id,
          // Add custom fields from the database user object to the session
          gnr: typedUser.gnr,
          bnr: typedUser.bnr,
          fnr: typedUser.fnr,
          snr: typedUser.snr,
          address: typedUser.address,
          postalCode: typedUser.postalCode,
          postalArea: typedUser.postalArea,
          phone: typedUser.phone,
          role: typedUser.role,
        },
      };
    },
  },
  adapter: PrismaAdapter(db) as Adapter,
  providers: [
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID ?? "",
      clientSecret: env.DISCORD_CLIENT_SECRET ?? "",
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = () => getServerSession(authOptions);