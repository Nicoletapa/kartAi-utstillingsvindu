/**
 * This file is used in Utstillingsvindu 2.0
 *
 * @description
 * A navbar component for the Atlas application.
 * It includes a link to the Atlas app and a sign-in/sign-out button.
 *
 * @features
 * - Displays the Atlas app link
 * - Displays the user's email if logged in
 * - Sign-in and sign-out functionality
 *
 * @props
 * - `className` (string): Additional CSS classes for styling.
 *
 * @note
 * - This component is designed to be used in a client-side context.
 * - It uses NextAuth for authentication.
 *
 * @usage
 * <NavbarAtlas />
 */

"use client";

import Link from "next/link";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

const NavbarAtlas = () => {
  const { data: session } = useSession();

  // Add debugging
  useEffect(() => {
    console.log("Navbar session:", session);
  }, [session]);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <nav className="h-16 w-full bg-white shadow-sm" />;
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-gray-800">
      <div className="mx-auto flex h-16 max-w-screen-xl items-center justify-between px-4">
        <div className="flex items-center">
          <Link
            href={"/atlas-app"}
            className="ml-2 text-xl font-semibold text-gray-800 dark:text-white"
          >
            Atlas
          </Link>
        </div>

        <div className="mt-1 flex cursor-pointer items-center justify-end space-x-4">
          {session ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">
                {session.user.email}
              </span>
              <button
                className="text-md cursor-hover group relative flex flex-row items-center gap-2 px-2 py-2 text-secondary-black hover:text-red-600"
                onClick={() => signOut()}
              >
                Logg ut
              </button>
            </div>
          ) : (
            <button onClick={() => signIn()}>Sign in</button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default NavbarAtlas;
