import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { authzTestRouter } from "./routers/authz-test";
import { panelRouter } from "./routers/panel";
import { hostRouter } from "./routers/host";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  authzTest: authzTestRouter,
  panel: panelRouter,
  host: hostRouter,
});

export type AppRouter = typeof appRouter;
