import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ImportDataForm from "./import-data-form/index";

export default function SettingsPage() {
  return (
    <div className="w-full px-4 py-8">
      <h1 className="text-2xl font-bold">Settings</h1>
      <Tabs className="my-4" defaultValue="import">
        <TabsList>
          <TabsTrigger value="import">Import</TabsTrigger>
        </TabsList>
        <TabsContent value="import">
          <ImportDataForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
