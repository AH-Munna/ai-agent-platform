import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const sessionRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        scenario: z.string().optional(),
        characterId: z.string().min(1), // Require a character to start a chat
        userPersonaId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
       let userId = ctx.session?.user?.id;
       if (!userId) {
           const firstUser = await ctx.db.user.findFirst();
           if (firstUser) userId = firstUser.id;
           else throw new Error("No user found. Please register first.");
       }

      const session = await ctx.db.chatSession.create({
        data: {
          name: input.name,
          scenario: input.scenario,
          userId: userId!,
          userPersonaId: input.userPersonaId,
          participants: {
              connect: { id: input.characterId }
          }
        },
      });

      // Fetch the character to get the greeting
      const character = await ctx.db.character.findUnique({
          where: { id: input.characterId }
      });

      if (character && character.greeting) {
          await ctx.db.message.create({
              data: {
                  content: character.greeting,
                  role: "assistant",
                  sessionId: session.id,
                  characterId: character.id
              }
          });
      }

      return session;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.chatSession.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        participants: true // Character[]
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.chatSession.findUnique({
        where: { id: input.id },
        include: {
          participants: true,
          userPersona: true,
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
                userPersona: true,
                character: true
            }
          },
        },
      });
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSession.delete({
        where: { id: input.id },
      });
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        scenario: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.chatSession.update({
        where: { id: input.id },
        data: {
          name: input.name,
          scenario: input.scenario,
        },
      });
    }),
});
