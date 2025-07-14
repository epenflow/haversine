import { createRouter } from "@tanstack/react-router";

import { routeTree } from "~/routeTree.gen";

export default function router() {
  return createRouter({
    routeTree,
  });
}

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof router>;
  }
}
