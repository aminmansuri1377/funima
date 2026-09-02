import { publicProcedure, router } from "../trpc";

export const healthRouter = router({
  check: publicProcedure.query(() => {
    return {
      success: true,
      message: "Funima API is healthy",
      timestamp: new Date().toISOString(),
    };
  }),
});
