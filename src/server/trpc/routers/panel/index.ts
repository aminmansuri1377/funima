import { router } from "../../trpc";
import { panelAdminsRouter } from "./admins";
import { panelFiltersRouter } from "./filters";

import { panelHostsRouter } from "./hosts";
import { panelPlacesRouter } from "./places";
import { panelVisitorsRouter } from "./visitors";

export const panelRouter = router({
  hosts: panelHostsRouter,

  visitors: panelVisitorsRouter,
  admins: panelAdminsRouter,
  places: panelPlacesRouter,
  filters: panelFiltersRouter,
});
