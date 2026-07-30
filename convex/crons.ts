import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

crons.daily(
  "refresh metals.dev prices",
  { hourUTC: 0, minuteUTC: 5 },
  internal.metalsApi.syncDaily,
  {},
);

export default crons;
