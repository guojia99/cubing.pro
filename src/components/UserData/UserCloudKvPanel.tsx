"use client";

import { Button, HStack, Progress, Text, VStack } from "@chakra-ui/react";
import { useState, type ReactNode } from "react";

import { toaster } from "@/components/ui/toaster";
import { getUserKv, setUserKv } from "@/services/cubing-pro/user/user_kv";
import { clientErrorMessage } from "@/services/cubing-pro/clientError";
import { useIntlMessage } from "@/hooks/useIntlMessage";

export type UserCloudKvPanelProps = {
  kvKey: string;
  title?: ReactNode;
  description?: ReactNode;
  uploadButtonText: string;
  syncButtonText: string;
  userKvType?: number;
  embedded?: boolean;
  getPayloadForUpload: () => string | Promise<string>;
  applyCloudPayload: (raw: string) => void | Promise<void>;
  uploadOkText?: string;
  syncOkText?: string;
};

export function UserCloudKvPanel({
  kvKey,
  title,
  description,
  uploadButtonText,
  syncButtonText,
  userKvType = 3,
  embedded = false,
  getPayloadForUpload,
  applyCloudPayload,
  uploadOkText,
  syncOkText,
}: UserCloudKvPanelProps) {
  const { locale, formatMessage: t } = useIntlMessage();
  const [uploadPercent, setUploadPercent] = useState<number | undefined>();
  const [busy, setBusy] = useState<"upload" | "sync" | null>(null);

  const handleUpload = async () => {
    setBusy("upload");
    setUploadPercent(0);
    try {
      const raw = await getPayloadForUpload();
      await setUserKv(kvKey, raw, userKvType, {
        onUploadProgress: (p) => setUploadPercent(p),
      });
      setUploadPercent(100);
      toaster.create({ title: uploadOkText ?? t({ id: "shared.cloud.uploaded" }), type: "success" });
    } catch (e) {
      toaster.create({
        title: clientErrorMessage(e, locale, "shared.cloud.uploadFailed"),
        type: "error",
      });
      setUploadPercent(undefined);
    } finally {
      setBusy(null);
      setTimeout(() => setUploadPercent(undefined), 800);
    }
  };

  const handleSync = async () => {
    setBusy("sync");
    try {
      const rec = await getUserKv(kvKey);
      await applyCloudPayload(rec.value);
      toaster.create({ title: syncOkText ?? t({ id: "shared.cloud.synced" }), type: "success" });
    } catch (e) {
      toaster.create({
        title: clientErrorMessage(e, locale, "shared.cloud.syncFailed"),
        type: "error",
      });
    } finally {
      setBusy(null);
    }
  };

  const actions = (
    <HStack gap={2} flexWrap="wrap" w={embedded ? "full" : undefined}>
      <Button
        size="sm"
        colorPalette="brand"
        flex={embedded ? 1 : undefined}
        loading={busy === "upload"}
        onClick={() => void handleUpload()}
      >
        {uploadButtonText}
      </Button>
      <Button
        size="sm"
        variant="outline"
        colorPalette="brand"
        flex={embedded ? 1 : undefined}
        loading={busy === "sync"}
        onClick={() => void handleSync()}
      >
        {syncButtonText}
      </Button>
    </HStack>
  );

  if (embedded) {
    return (
      <VStack align="stretch" gap={3} h="full" justify="space-between">
        {description ? (
          <Text fontSize="xs" color="fg.muted" lineClamp={3}>
            {description}
          </Text>
        ) : null}
        {actions}
        {uploadPercent !== undefined ? (
          <Progress.Root value={uploadPercent} size="xs" aria-label={t({ id: "shared.cloud.progress" })}>
            <Progress.Track>
              <Progress.Range />
            </Progress.Track>
          </Progress.Root>
        ) : null}
      </VStack>
    );
  }

  return (
    <VStack align="stretch" gap={3}>
      {title ? (
        <Text fontWeight="semibold" fontSize="md">
          {title}
        </Text>
      ) : null}
      {description ? (
        <Text fontSize="sm" color="fg.muted">
          {description}
        </Text>
      ) : null}
      {actions}
      {uploadPercent !== undefined ? (
        <Progress.Root value={uploadPercent} size="sm" aria-label={t({ id: "shared.cloud.progress" })}>
          <Progress.Track>
            <Progress.Range />
          </Progress.Track>
        </Progress.Root>
      ) : null}
    </VStack>
  );
}
