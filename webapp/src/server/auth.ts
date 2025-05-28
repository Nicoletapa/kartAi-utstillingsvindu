import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

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
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub!,
          // Add custom fields from the token
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
    },

    // Add JWT callback to store user data in token
    jwt: ({ token, user }) => {
      if (user) {
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
          return {
            id: "1",
            name: "user",
            email: "user@gmail.com",
            role: "USER",
            gnr: 152,
            bnr: 850,
            address: "Marcus Thranes gate 14",
            postalCode: "4630",
            postalArea: "Kristiansand",
            phone: "12345678",
          };
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
