"use client";

import {
  Avatar,
  Button,
  Card,
  Dialog,
  Field,
  Heading,
  Input,
  Spinner,
  Tabs,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useRef, useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import { resolveAvatarUrl } from "@/lib/avatar";
import { updateAvatar } from "@/services/cubing-pro/auth/auth";
import type { CurrentUserData } from "@/services/cubing-pro/auth/types";

type ProfileAvatarProps = {
  user: CurrentUserData;
  onUpdated: () => void;
};

function fileToBase64(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ProfileAvatar({ user, onUpdated }: ProfileAvatarProps) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const avatarSrc = resolveAvatarUrl(user.Avatar);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = useCallback(async () => {
    setUploading(true);
    try {
      const req = {
        URL: imageUrl,
        ImageName: "avatar",
        Data: "",
      };
      if (preview && fileRef.current?.files?.[0]) {
        req.Data = await fileToBase64(fileRef.current.files[0]);
        req.ImageName = fileRef.current.files[0].name || "avatar.jpeg";
      }
      await updateAvatar(req);
      toaster.create({ title: t("profile.uploadOk"), type: "success" });
      setOpen(false);
      setPreview(null);
      setImageUrl("");
      onUpdated();
    } catch {
      toaster.create({ title: t("profile.uploadFail"), type: "error" });
    } finally {
      setUploading(false);
    }
  }, [imageUrl, preview, onUpdated, t]);

  return (
    <>
      <Card.Root textAlign="center">
        <Card.Body py="8">
          <VStack gap="4">
            <Avatar.Root
              size="2xl"
              cursor="pointer"
              onClick={() => setOpen(true)}
              mx="auto"
            >
              {avatarSrc ? <Avatar.Image src={avatarSrc} alt={user.Name} /> : null}
              <Avatar.Fallback name={user.Name} />
            </Avatar.Root>
            <Heading size="md">{user.Name}</Heading>
            <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
              {t("profile.uploadAvatar")}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>

      <Dialog.Root
        open={open}
        onOpenChange={(e) => !uploading && setOpen(e.open)}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t("profile.uploadAvatar")}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Tabs.Root defaultValue="file">
                <Tabs.List>
                  <Tabs.Trigger value="file">{t("profile.tabFile")}</Tabs.Trigger>
                  <Tabs.Trigger value="url">{t("profile.tabUrl")}</Tabs.Trigger>
                </Tabs.List>
                <Tabs.Content value="file" pt="4">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={(e) => handleFile(e.target.files?.[0])}
                  />
                  <Button
                    variant="outline"
                    onClick={() => fileRef.current?.click()}
                    mb="3"
                  >
                    {t("profile.chooseFile")}
                  </Button>
                  {preview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={preview}
                      alt=""
                      style={{
                        maxWidth: "100%",
                        maxHeight: 256,
                        margin: "0 auto",
                        borderRadius: 8,
                        display: "block",
                      }}
                    />
                  ) : null}
                </Tabs.Content>
                <Tabs.Content value="url" pt="4">
                  <Field.Root>
                    <Input
                      placeholder={t("profile.avatarUrlPlaceholder")}
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                    />
                  </Field.Root>
                  {imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt=""
                      style={{
                        maxWidth: "100%",
                        marginTop: 12,
                        borderRadius: 8,
                      }}
                    />
                  ) : null}
                </Tabs.Content>
              </Tabs.Root>
              {uploading ? (
                <Spinner mt="4" color="brand.solid" />
              ) : null}
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" disabled={uploading}>
                  Cancel
                </Button>
              </Dialog.ActionTrigger>
              <Button
                colorPalette="brand"
                loading={uploading}
                onClick={() => void handleSubmit()}
              >
                {uploading ? t("profile.uploading") : "OK"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </>
  );
}
