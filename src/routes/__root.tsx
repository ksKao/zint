import AddAccountDialog from "@/components/dialog-forms/add-account-dialog";
import Navbar from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen w-screen">
      <AddAccountDialog />
      <Navbar />
      <main className="grow">
        <Outlet />
      </main>
      <Toaster richColors position="top-center" />
    </div>
  ),
});
