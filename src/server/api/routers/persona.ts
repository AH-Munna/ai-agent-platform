import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const personaRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    return ctx.db.userPersona.findMany({
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        bio: z.string().min(1),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPersona.create({
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
          userId: ctx.session.user.id!,
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1),
        bio: z.string().min(1),
        avatar: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPersona.update({
        where: { id: input.id, userId: ctx.session.user.id },
        data: {
          name: input.name,
          bio: input.bio,
          avatar: input.avatar,
        },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.userPersona.delete({
        where: { id: input.id, userId: ctx.session.user.id },
      });
    }),
});
