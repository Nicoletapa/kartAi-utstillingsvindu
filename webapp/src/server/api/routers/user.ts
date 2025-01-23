import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  login: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const user = await ctx.db.user.findUnique({
        where: { email: input.email },
      });

      if (user) {
        // Store in session storage
        if (typeof window !== "undefined") {
          sessionStorage.setItem("userEmail", user.email);
          sessionStorage.setItem("userId", user.id);
          sessionStorage.setItem("userRole", user.role);
        }
      }
      return user;
    }),

  checkAuth: publicProcedure.query(async () => {
    // Check if user email exists in session storage
    const userEmail =
      typeof window !== "undefined"
        ? sessionStorage.getItem("userEmail")
        : null;

    return {
      isLoggedIn: Boolean(userEmail),
      userName: userEmail || "",
    };
  }),
  logout: publicProcedure.mutation(async () => {
    return { success: true };
  }),
});
