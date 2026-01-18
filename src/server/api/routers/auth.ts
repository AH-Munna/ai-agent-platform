import bcrypt from "bcryptjs";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const authRouter = createTRPCRouter({
  register: publicProcedure
    .input(z.object({ username: z.string().min(3), password: z.string().min(6) }))
    .mutation(async ({ ctx, input }) => {
      const exists = await ctx.db.user.findUnique({
        where: { username: input.username },
      });

      if (exists) {
        throw new Error("Username already taken");
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      return ctx.db.user.create({
        data: {
          username: input.username,
          password: hashedPassword,
        },
      });
    }),
});
