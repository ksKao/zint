import UpsertAccountDialog from "@/components/dialog-forms/upsert-account-dialog";
import Navbar from "@/components/navbar";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { Toaster } from "sonner";

export const Route = createRootRoute({
  component: () => (
    <div className="flex h-screen w-screen">
      <UpsertAccountDialog />
      <Navbar />
      <main className="grow overflow-y-auto">
        <Outlet />
      </main>
      <Toaster richColors position="top-center" />
    </div>
  ),
});
