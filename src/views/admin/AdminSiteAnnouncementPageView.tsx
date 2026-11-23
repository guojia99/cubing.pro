"use client";

import { Badge, Button, Field, HStack, Input, Spinner, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useState, type SubmitEvent } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth } from "@/lib/auth";
import { getApiErrorDisplayMessage, isRequestCanceled } from "@/services/cubing-pro/request";
import {
  getAdminSiteAnnouncement, publishSiteAnnouncement, withdrawSiteAnnouncement,
  type AdminSiteAnnouncement,
} from "@/services/cubing-pro/siteAnnouncement";

const MAX_TEXT = 300;

function responseMessage(error: unknown) {
  return getApiErrorDisplayMessage((error as { response?: { data?: unknown } } | null)?.response?.data);
}

function AnnouncementForm() {
  const { t } = useI18n();
  const [saved, setSaved] = useState<AdminSiteAnnouncement | null>(null);
  const [text, setText] = useState("");
  const [href, setHref] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"siteAnnouncement.saved" | "siteAnnouncement.withdrawn" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getAdminSiteAnnouncement(controller.signal).then((item) => {
      if (controller.signal.aborted) return;
      setSaved(item);
      setText(item.text);
      setHref(item.href);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !isRequestCanceled(error)) setLoadFailed(true);
    });
    return () => controller.abort();
  }, [loadAttempt]);

  const normalizedText = text.trim();
  const count = Array.from(normalizedText).length;
  const invalidText = count === 0 || count > MAX_TEXT;

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved || pending || invalidText) return;
    setPending(true);
    setError("");
    setFeedback(null);
    try {
      const item = await publishSiteAnnouncement({ text: normalizedText, href: href.trim() });
      setSaved(item);
      setText(item.text);
      setHref(item.href);
      setFeedback("siteAnnouncement.saved");
    } catch (error) {
      setError(responseMessage(error) || t("siteAnnouncement.writeError"));
    } finally {
      setPending(false);
    }
  }

  async function withdraw() {
    if (!saved?.active || pending) return;
    setPending(true);
    setError("");
    setFeedback(null);
    try {
      setSaved(await withdrawSiteAnnouncement());
      setFeedback("siteAnnouncement.withdrawn");
    } catch (error) {
      setError(responseMessage(error) || t("siteAnnouncement.writeError"));
    } finally {
      setPending(false);
    }
  }

  return (
    <Stack gap="5">
      <PageHeader title={t("siteAnnouncement.title")} description={t("siteAnnouncement.adminHint")} />
      <Surface p={{ base: "4", md: "6" }} maxW="3xl">
        {loadFailed ? (
          <Stack gap="3" align="start">
            <Text role="alert" color="fg.error">{t("siteAnnouncement.loadError")}</Text>
            <Button variant="outline" onClick={() => { setLoadFailed(false); setLoadAttempt((n) => n + 1); }}>
              {t("siteAnnouncement.retry")}
            </Button>
          </Stack>
        ) : saved === null ? (
          <Spinner color="brand.solid" />
        ) : (
          <Stack asChild gap="4">
            <form onSubmit={save}>
              <Badge alignSelf="start" colorPalette={saved.active ? "green" : "gray"}>
                {t(saved.active ? "siteAnnouncement.active" : "siteAnnouncement.inactive")}
              </Badge>
              <Field.Root required invalid={count > MAX_TEXT} disabled={pending}>
                <Field.Label>{t("siteAnnouncement.text")}</Field.Label>
                <Textarea value={text} onChange={(event) => setText(event.target.value)} rows={5} resize="vertical" />
                <Field.HelperText>{count} / {MAX_TEXT}</Field.HelperText>
              </Field.Root>
              <Field.Root disabled={pending}>
                <Field.Label>{t("siteAnnouncement.link")}</Field.Label>
                <Input value={href} onChange={(event) => setHref(event.target.value)} inputMode="url" />
                <Field.HelperText>{t("siteAnnouncement.linkHint")}</Field.HelperText>
              </Field.Root>
              {error && <Text role="alert" color="fg.error">{error}</Text>}
              {feedback && <Text role="status">{t(feedback)}</Text>}
              <HStack gap="3" flexWrap="wrap">
                <Button type="submit" disabled={pending || invalidText}>
                  {t(saved.active ? "siteAnnouncement.save" : "siteAnnouncement.publish")}
                </Button>
                {saved.active && (
                  <Button type="button" variant="outline" disabled={pending} onClick={() => void withdraw()}>
                    {t("siteAnnouncement.withdraw")}
                  </Button>
                )}
              </HStack>
            </form>
          </Stack>
        )}
      </Surface>
    </Stack>
  );
}

export function AdminSiteAnnouncementPageView() {
  return <AdminGuard required={[Auth.AuthSuperAdmin]}><AnnouncementForm /></AdminGuard>;
}
