import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { authzTestRouter } from "./routers/authz-test";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  authzTest: authzTestRouter,
});

export type AppRouter = typeof appRouter;
