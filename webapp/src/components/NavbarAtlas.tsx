"use client";

import Link from "next/link";

import { useAuth } from "~/context/AuthContext";

const NavbarAtlas = () => {
  const { user, isLoggedIn, logout } = useAuth();
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

        {/* Set a condition that if you are logged in, display name instead of logg inn */}
        <div className="mt-1 flex cursor-pointer items-center justify-end space-x-4">
          {isLoggedIn ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-700">{user?.email}</span>
              <button
                onClick={logout}
                className="text-md cursor-hover group relative flex flex-row items-center gap-2 px-2 py-2 text-secondary-black hover:text-red-600"
              >
                Logg ut
              </button>
            </div>
          ) : (
            <Link href="/atlas-app/LoggInn">Logg inn</Link>
          )}
        </div>
      </div>
    </nav>
  );
};
export default NavbarAtlas;
