import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const messageRouter = createTRPCRouter({
  create: protectedProcedure
    .input(
      z.object({
        content: z.string().min(1),
        sessionId: z.string(),
        role: z.enum(["user", "assistant"]),
        characterId: z.string().optional(), // For assistant messages
        userPersonaId: z.string().optional(), // For user messages
      })
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.message.create({
        data: {
          content: input.content,
          role: input.role,
          sessionId: input.sessionId,
          // Only link character if role is assistant (or if specified)
          characterId: input.role === "assistant" ? input.characterId : undefined,
          // Link user persona if provided
          userPersonaId: input.userPersonaId,
        },
      });
    }),
    
    // Optional: Delete message, Edit message (SillyTavern features)
    delete: protectedProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.message.delete({ where: { id: input.id } });
        }),

    update: protectedProcedure
        .input(z.object({ id: z.string(), content: z.string().min(1) }))
        .mutation(async ({ ctx, input }) => {
            return ctx.db.message.update({
                where: { id: input.id },
                data: { content: input.content }
            });
        }),
});
