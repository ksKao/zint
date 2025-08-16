import AddAccountDialog from "@/components/add-account-dialog";
import Navbar from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen w-screen">
      <AddAccountDialog />
      <Navbar />
      <Outlet />
    </div>
  ),
});
