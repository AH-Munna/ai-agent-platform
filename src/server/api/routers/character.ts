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
      // TODO: Link to ctx.session.user.id when auth is fully integrated in TRPC context
      // For now, creating without user link or using a placeholder if strictly required, 
      // but schema says userId is optional for Character.
      return ctx.db.character.create({
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
          greeting: input.greeting,
        },
      });
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.character.findMany({
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
