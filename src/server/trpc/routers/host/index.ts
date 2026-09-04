import { router } from "../../trpc";
import { hostDashboardRouter } from "./dashboard";
import { hostEventsRouter } from "./events";

import { hostPlaceRouter } from "./place";

export const hostRouter = router({
  place: hostPlaceRouter,
  events: hostEventsRouter,
  dashboard: hostDashboardRouter,
});
