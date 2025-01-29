"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import { useAuth } from "~/context/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const { setUser, user } = useAuth();

  const login = api.user.login.useMutation({
    onSuccess: (data) => {
      if (data) {
        setUser(data);
        router.push("/atlas-app");
      }
    },
    onError: () => {
      setError("User not found");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate({ email });
  };

  if (user) {
    router.push("/atlas-app");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow">
        <h2 className="text-center text-3xl font-bold">Logg inn</h2>
        {error && <div className="text-center text-red-500">{error}</div>}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-md bg-kartAI-blue px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-kartAI-blue/80"
          >
            Logg inn
          </button>
        </form>
      </div>
    </div>
  );
}
