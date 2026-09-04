import { router } from "../../trpc";

import { visitorCommentsRouter } from "./comments";

import { visitorEventsRouter } from "./events";

import { visitorHomeRouter } from "./home";

import { visitorPlacesRouter } from "./places";

import { visitorProfileRouter } from "./profile";

import { visitorSavedRouter } from "./saved";

export const visitorRouter = router({
  home: visitorHomeRouter,

  places: visitorPlacesRouter,

  events: visitorEventsRouter,

  saved: visitorSavedRouter,

  comments: visitorCommentsRouter,

  profile: visitorProfileRouter,
});
