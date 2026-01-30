import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const characterRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().min(1),
        avatar: z.string().optional(),
        greeting: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let userId = ctx.session?.user?.id;
      if (!userId) {
        const firstUser = await ctx.db.user.findFirst();
        if (firstUser) userId = firstUser.id;
      }

      return ctx.db.character.create({
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
          greeting: input.greeting,
          userId: userId, // Link to current user
        },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    let userId = ctx.session?.user?.id;
    if (!userId) {
      const firstUser = await ctx.db.user.findFirst();
      if (firstUser) userId = firstUser.id;
      else return [];
    }

    return ctx.db.character.findMany({
      where: { userId }, // Filter by current user
      orderBy: { createdAt: "desc" },
    });
  }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.character.delete({
        where: { id: input.id },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        bio: z.string().min(1).optional(),
        avatar: z.string().optional(),
        greeting: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.character.update({
        where: { id: input.id },
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
          greeting: input.greeting,
        },
      });
    }),
});
