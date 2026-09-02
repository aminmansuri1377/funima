import {
  router,
  visitorProcedure,
  hostProcedure,
  adminProcedure,
} from "../trpc";

export const authzTestRouter = router({
  visitorOnly: visitorProcedure.query(() => {
    return {
      ok: true,
      role: "VISITOR",
    };
  }),

  hostOnly: hostProcedure.query(() => {
    return {
      ok: true,
      role: "HOST",
    };
  }),

  adminOnly: adminProcedure.query(() => {
    return {
      ok: true,
      role: "ADMIN",
    };
  }),
});
