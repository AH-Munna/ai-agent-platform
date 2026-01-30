import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export const roomRouter = createTRPCRouter({
  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1),
        scenario: z.string().optional(),
        characterAId: z.string().min(1),
        characterBId: z.string().min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let userId = ctx.session?.user?.id;
      if (!userId) {
        const firstUser = await ctx.db.user.findFirst();
        if (firstUser) userId = firstUser.id;
        else throw new Error("No user found. Please register first.");
      }

      const room = await ctx.db.room.create({
        data: {
          name: input.name,
          scenario: input.scenario,
          userId: userId!,
          characterAId: input.characterAId,
          characterBId: input.characterBId,
          status: "idle",
        },
      });

      // Save Character A's greeting as first message
      const charA = await ctx.db.character.findUnique({
          where: { id: input.characterAId }
      });

      if (charA && charA.greeting) {
          await ctx.db.roomMessage.create({
              data: {
                  content: charA.greeting,
                  roomId: room.id,
                  characterId: charA.id
              }
          });
      }

      return room;
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    let userId = ctx.session?.user?.id;
    if (!userId) {
      const firstUser = await ctx.db.user.findFirst();
      if (firstUser) userId = firstUser.id;
      else return [];
    }

    return ctx.db.room.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        characterA: true,
        characterB: true,
      },
    });
  }),

  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.room.findUnique({
        where: { id: input.id },
        include: {
          characterA: true,
          characterB: true,
          messages: {
            orderBy: { createdAt: "asc" },
            include: {
              character: true,
            }
          },
        },
      });
    }),

    delete: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.room.delete({
        where: { id: input.id },
      });
    }),

  restart: publicProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
        // 1. Reset Room Status
        await ctx.db.room.update({
            where: { id: input.id },
            data: { 
                status: "idle", 
                turnCount: 0,
                errorMessage: null 
            }
        });

        // 2. Delete all messages
        await ctx.db.roomMessage.deleteMany({
            where: { roomId: input.id }
        });

        // 3. Re-seed Header Greeting (Character A)
        const room = await ctx.db.room.findUnique({
             where: { id: input.id },
             include: { characterA: true }
        });

        if (room && room.characterA && room.characterA.greeting) {
            await ctx.db.roomMessage.create({
                data: {
                    content: room.characterA.greeting,
                    roomId: room.id,
                    characterId: room.characterA.id
                }
            });
        }
        
        return { success: true };
    }),
});
