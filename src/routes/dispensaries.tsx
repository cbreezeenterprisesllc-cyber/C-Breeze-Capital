import { createFileRoute, Outlet } from "@tanstack/react-router";
// Layout route for the /dispensaries subtree.
// The listing lives at /dispensaries (dispensaries.index.tsx) and the storefront
// at /dispensaries/:id (dispensaries.$id.tsx). Both are children of this layout,
// which just renders the active child so the storefront is reachable.
export const Route = createFileRoute("/dispensaries")({
  component: DispensariesLayout,
});
function DispensariesLayout() {
  return <Outlet />;
}
