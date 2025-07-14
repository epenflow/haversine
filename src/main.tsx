import { createRoot } from "react-dom/client";

import Root from "~/components/utils/root";

const root = document.getElementById("root")!;

if (!root.innerHTML) {
  createRoot(root).render(<Root />);
}
