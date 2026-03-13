import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Cleanup old notifications every day at midnight UTC
crons.daily(
  "cleanup-old-notifications",
  { hourUTC: 0, minuteUTC: 0 },
  api.lyrics.cleanupNotifications,
);

export default crons;
