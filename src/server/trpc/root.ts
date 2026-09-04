import { router } from "./trpc";
import { healthRouter } from "./routers/health";
import { authRouter } from "./routers/auth";
import { authzTestRouter } from "./routers/authz-test";
import { panelRouter } from "./routers/panel";
import { hostRouter } from "./routers/host";
import { visitorRouter } from "./routers/visitor";

export const appRouter = router({
  health: healthRouter,
  auth: authRouter,
  authzTest: authzTestRouter,
  panel: panelRouter,
  host: hostRouter,
  visitor: visitorRouter,
});

export type AppRouter = typeof appRouter;
