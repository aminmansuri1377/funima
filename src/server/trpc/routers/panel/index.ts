import { router } from "../../trpc";

import { panelHostsRouter } from "./hosts";
import { panelVisitorsRouter } from "./visitors";

export const panelRouter = router({
  hosts: panelHostsRouter,

  visitors: panelVisitorsRouter,
});
