import { createRouteHandler } from "uploadthing/next";

import { siteMediaFileRouter } from "./core";

export const { GET, POST } = createRouteHandler({
  router: siteMediaFileRouter,
});
