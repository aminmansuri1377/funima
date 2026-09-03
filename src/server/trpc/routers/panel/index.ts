import { router } from "../../trpc";

import { panelHostsRouter } from "./hosts";

export const panelRouter = router({
  hosts: panelHostsRouter,
});
