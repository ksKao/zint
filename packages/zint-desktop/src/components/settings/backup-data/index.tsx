import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import { useMutation, useQuery } from "@tanstack/react-query";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { openUrl } from "@tauri-apps/plugin-opener";
import { format } from "date-fns";
import {
  AlertCircleIcon,
  LogOutIcon,
  PlusIcon,
  RefreshCwIcon,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { useLocalStorage } from "react-use";
import { toast } from "sonner";
import z from "zod/v4";

export default function BackupData() {
  const [googleToken, setGoogleToken, removeGoogleToken] = useLocalStorage(
    "google_token",
    {
      accessToken: null,
      expiresIn: null,
    } as { accessToken: string | null; expiresIn: string | null },
  );
  const {
    data: file,
    isError,
    isPending,
    refetch,
  } = useQuery({
    queryKey: [googleToken],
    queryFn: async () => {
      if (!googleToken || !googleToken.accessToken) return null;

      const response = await fetch(
        "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&fields=files(id,name,modifiedTime)&orderBy=recency%20desc",
        {
          headers: {
            Authorization: `Bearer ${googleToken.accessToken}`,
          },
        },
      );

      const files = z
        .object({
          files: z.array(
            z.object({
              id: z.string(),
              name: z.string(),
              modifiedTime: z.coerce.date(),
            }),
          ),
        })
        .safeParse(await response.json()).data?.files;

      return files?.[0] ?? null;
    },
    staleTime: 0,
  });
  const {
    mutate: createOrUploadBackup,
    isPending: createOrUploadBackupPending,
  } = useMutation({
    mutationFn: async () => {
      if (!googleToken || !googleToken.accessToken) {
        toast.error(
          "You are not signed into your Google account. Unable to backup",
        );
        return;
      }

      if (!file) {
        const formData = new FormData();

        formData.append(
          "metadata",
          new File(
            [
              JSON.stringify({
                name: "backup.json",
                description: "Full backup data for Zint",
                parents: ["appDataFolder"],
              }),
            ],
            "metadata.json",
            {
              type: "application/json",
            },
          ),
        );

        formData.append(
          "file",
          new File(
            [
              JSON.stringify({
                hello: "world",
              }),
            ],
            "media.json",
            {
              type: "application/json",
            },
          ),
        );

        const response = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
          {
            headers: new Headers({
              Authorization: `Bearer ${googleToken.accessToken}`,
            }),
            method: "POST",
            body: formData,
          },
        );

        if (!response.ok) throw new Error();
      } else {
        toast.error("Backup already exists");
      }
    },
    onSuccess: async () => {
      toast.success("Data backed up successfully");
      await refetch();
    },
    onError: (e) => {
      console.log(e);
      toast.error("An error occurred while trying to create a backup.");
    },
  });

  useEffect(() => {
    let unsub: Awaited<ReturnType<typeof onOpenUrl>> | undefined = undefined;

    async function listenDeepLink() {
      unsub = await onOpenUrl((urls) => {
        if (!urls.length) {
          toast.error("Google Authentication Failed.");
          return;
        }

        const split = urls[0].split("#");

        if (!split[1]) {
          toast.error("Google Authentication Failed.");
          return;
        }

        const searchParams = new URLSearchParams(split[1]);

        const accessToken = searchParams.get("access_token");
        const expiresIn = +new Number(searchParams.get("expires_in"));

        if (!accessToken || isNaN(expiresIn) || !expiresIn) {
          toast.error("Google Authentication Failed.");
          return;
        }

        const expireDate = new Date();
        expireDate.setSeconds(expireDate.getSeconds() + expiresIn);

        setGoogleToken({
          accessToken,
          expiresIn: expireDate.toISOString(),
        });
      });
    }

    listenDeepLink();

    return unsub;
  }, [setGoogleToken]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://apis.google.com/js/api.js";
    script.async = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const googleAuthStatus = useMemo(() => {
    if (!googleToken) return "Not Signed In" as const;

    if (!googleToken.accessToken) return "Not Signed In" as const;

    if (
      googleToken.expiresIn &&
      new Date(googleToken.expiresIn).getTime() < new Date().getTime()
    )
      return "Expired" as const;

    return "Signed In" as const;
  }, [googleToken]);

  return (
    <div className="w-sm">
      <h2 className="my-4 text-xl font-semibold">Backup</h2>
      <Item className="mb-4" variant="outline">
        <ItemMedia>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            width={24}
            height={24}
          >
            <path
              fill="#1e88e5"
              d="M38.59,39c-0.535,0.93-0.298,1.68-1.195,2.197C36.498,41.715,35.465,42,34.39,42H13.61 c-1.074,0-2.106-0.285-3.004-0.802C9.708,40.681,9.945,39.93,9.41,39l7.67-9h13.84L38.59,39z"
            />
            <path
              fill="#fbc02d"
              d="M27.463,6.999c1.073-0.002,2.104-0.716,3.001-0.198c0.897,0.519,1.66,1.27,2.197,2.201l10.39,17.996 c0.537,0.93,0.807,1.967,0.808,3.002c0.001,1.037-1.267,2.073-1.806,3.001l-11.127-3.005l-6.924-11.993L27.463,6.999z"
            />
            <path
              fill="#e53935"
              d="M43.86,30c0,1.04-0.27,2.07-0.81,3l-3.67,6.35c-0.53,0.78-1.21,1.4-1.99,1.85L30.92,30H43.86z"
            />
            <path
              fill="#4caf50"
              d="M5.947,33.001c-0.538-0.928-1.806-1.964-1.806-3c0.001-1.036,0.27-2.073,0.808-3.004l10.39-17.996 c0.537-0.93,1.3-1.682,2.196-2.2c0.897-0.519,1.929,0.195,3.002,0.197l3.459,11.009l-6.922,11.989L5.947,33.001z"
            />
            <path
              fill="#1565c0"
              d="M17.08,30l-6.47,11.2c-0.78-0.45-1.46-1.07-1.99-1.85L4.95,33c-0.54-0.93-0.81-1.96-0.81-3H17.08z"
            />
            <path
              fill="#2e7d32"
              d="M30.46,6.8L24,18L17.53,6.8c0.78-0.45,1.66-0.73,2.6-0.79L27.46,6C28.54,6,29.57,6.28,30.46,6.8z"
            />
          </svg>
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Google Drive Status: {googleAuthStatus}</ItemTitle>
        </ItemContent>
        {googleAuthStatus === "Signed In" ? (
          <ItemActions>
            <Button size="icon" onClick={() => removeGoogleToken()}>
              <LogOutIcon />
            </Button>
          </ItemActions>
        ) : null}
      </Item>

      {googleAuthStatus !== "Signed In" ? (
        <Button
          onClick={async () => {
            await openUrl(
              "https://accounts.google.com/o/oauth2/v2/auth?client_id=39590283211-qas56lkbc7dk35dm9scjp35eqksfh0ol.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fzint.ks-kao.com%2Fauth&response_type=token&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fdrive.appdata",
            );
          }}
        >
          Sign in via Google
        </Button>
      ) : null}

      {googleAuthStatus === "Signed In" ? (
        <>
          {isPending ? (
            <Skeleton className="h-16" />
          ) : isError ? (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Unable to get details about backup</AlertTitle>
            </Alert>
          ) : file ? (
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>Backup Found</ItemTitle>
                <ItemDescription>
                  {format(file.modifiedTime, "PPP HH:mm")}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button variant="outline" size="sm">
                  Restore
                </Button>
              </ItemActions>
            </Item>
          ) : (
            <Item variant="outline">
              <ItemContent>
                <ItemTitle>No backup found</ItemTitle>
              </ItemContent>
            </Item>
          )}

          <Button
            className="mt-4 w-full"
            onClick={() => createOrUploadBackup()}
            loading={createOrUploadBackupPending}
          >
            {file ? (
              <>
                <RefreshCwIcon />
                Update Backup
              </>
            ) : (
              <>
                <PlusIcon />
                Create Backup
              </>
            )}
          </Button>
        </>
      ) : null}
    </div>
  );
}
