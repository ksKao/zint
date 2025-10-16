import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportDataForm from "./import-data-form/index";
import { Suspense } from "react";
import ExportDataForm from "./export-data-form";

export default function SettingsPage() {
  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs className="my-4" defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>
        <Suspense>
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
