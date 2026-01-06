import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { AlertCircleIcon, RotateCwIcon } from "lucide-react";

export default function ErrorPage() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <AlertCircleIcon />
          </EmptyMedia>
          <EmptyTitle>An Error Occured!</EmptyTitle>
          <EmptyDescription>
            An unexpected error has occurred. This should not happen. Please try
            to refresh the page.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <div className="flex gap-2">
            <Button onClick={() => window.location.reload()}>
              <RotateCwIcon /> Refresh
            </Button>
          </div>
        </EmptyContent>
      </Empty>
    </div>
  );
}
