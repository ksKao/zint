import AddAccountDialog from "@/components/dialog-forms/add-account-dialog";
import Navbar from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen w-screen">
      <AddAccountDialog />
      <Navbar />
      <Outlet />
      <Toaster richColors position="top-center" />
    </div>
  ),
});
