import { authRouter } from "~/server/api/routers/auth";
import { characterRouter } from "~/server/api/routers/character";
import { messageRouter } from "~/server/api/routers/message";
import { personaRouter } from "~/server/api/routers/persona";
import { sessionRouter } from "~/server/api/routers/session";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  character: characterRouter,
  session: sessionRouter,
  auth: authRouter,
  persona: personaRouter,
  user: userRouter,
  message: messageRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
