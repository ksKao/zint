import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Suspense } from "react";
import ExportDataForm from "./export-data-form";
import ImportDataForm from "./import-data-form/index";
import ManageAccounts from "./manage-accounts";

export default function SettingsPage() {
  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs className="my-4" defaultValue="accounts">
        <TabsList>
          <TabsTrigger value="accounts">Accounts</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <Suspense>
          <TabsContent value="accounts">
            <ManageAccounts />
          </TabsContent>
          <TabsContent value="import">
            <ImportDataForm />
          </TabsContent>
          <TabsContent value="export">
            <ExportDataForm />
          </TabsContent>
        </Suspense>
      </Tabs>
    </div>
  );
}
