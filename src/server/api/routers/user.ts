import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const userRouter = createTRPCRouter({
  getSettings: protectedProcedure.query(async ({ ctx }) => {
    const user = await ctx.db.user.findUnique({
      where: { id: ctx.session.user.id },
      select: { globalSettings: true },
    });
    return (user?.globalSettings as any) || {};
  }),

  updateSettings: protectedProcedure
    .input(
      z.object({
        apiKey: z.string().optional(),
        baseUrl: z.string().optional(),
        systemPrompt: z.string().optional(),
        defaultModel: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.user.update({
        where: { id: ctx.session.user.id },
        data: {
          globalSettings: input,
        },
      });
    }),
});
