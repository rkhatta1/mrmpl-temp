import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "refresh metals.dev prices",
  { hourUTC: 0, minuteUTC: 5 },
  internal.metalsApi.syncDaily,
  {},
);

crons.daily(
  "clean expired catalog imports",
  { hourUTC: 1, minuteUTC: 5 },
  internal.catalogImport.startScheduledCleanup,
  {},
);

export default crons;
