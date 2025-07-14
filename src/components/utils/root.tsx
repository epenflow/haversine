import { RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";

import "~/assets/styles/globals.css";
import createRouter from "~/configs/router";

const router = createRouter();

export default function Root() {
  if (import.meta.env) {
    return (
      <StrictMode>
        <RouterProvider router={router} />
      </StrictMode>
    );
  }

  return <RouterProvider router={router} />;
}
