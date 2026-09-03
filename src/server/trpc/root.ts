import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { authzTestRouter } from "./routers/authz-test";
import { panelRouter } from "./routers/panel";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  authzTest: authzTestRouter,
  panel: panelRouter,
});

export type AppRouter = typeof appRouter;
