"use client";

import { Badge, Box, Button, Field, HStack, Input, Spinner, Stack, Text, Textarea } from "@chakra-ui/react";
import { useEffect, useRef, useState, type SubmitEvent } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { PageHeader, Surface } from "@/components/ui/page";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth } from "@/lib/auth";
import { getApiErrorDisplayMessage, isRequestCanceled } from "@/services/cubing-pro/request";
import {
  getAdminSiteAnnouncements, publishSiteAnnouncement, withdrawSiteAnnouncement,
  type AdminSiteAnnouncement,
} from "@/services/cubing-pro/siteAnnouncement";

const MAX_TEXT = 300;

function responseMessage(error: unknown) {
  return getApiErrorDisplayMessage((error as { response?: { data?: unknown } } | null)?.response?.data);
}

function AnnouncementForm() {
  const { t } = useI18n();
  const [announcements, setAnnouncements] = useState<AdminSiteAnnouncement[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const textField = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [href, setHref] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState<"siteAnnouncement.saved" | "siteAnnouncement.published" | "siteAnnouncement.withdrawn" | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    void getAdminSiteAnnouncements(controller.signal).then((items) => {
      if (controller.signal.aborted) return;
      setAnnouncements(items);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted && !isRequestCanceled(error)) setLoadFailed(true);
    });
    return () => controller.abort();
  }, [loadAttempt]);

  const selected = announcements?.find((item) => item.id === selectedId);
  const normalizedText = text.trim();
  const count = Array.from(normalizedText).length;
  const invalidText = count === 0 || count > MAX_TEXT;

  function select(item?: AdminSiteAnnouncement) {
    setSelectedId(item?.id);
    setText(item?.text ?? "");
    setHref(item?.href ?? "");
    setError("");
    setFeedback(null);
    textField.current?.focus();
  }

  function replaceAnnouncement(item: AdminSiteAnnouncement) {
    setAnnouncements((items) => {
      if (!items) return items;
      const previous = items.find((row) => row.id === item.id);
      if (!previous || (!previous.active && item.active)) {
        return [item, ...items.filter((row) => row.id !== item.id)];
      }
      return items.map((row) => row.id === item.id ? item : row);
    });
  }

  async function save(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!announcements || pending || invalidText) return;
    setPending(true);
    setError("");
    setFeedback(null);
    try {
      const item = await publishSiteAnnouncement({ text: normalizedText, href: href.trim() }, selectedId);
      replaceAnnouncement(item);
      setSelectedId(item.id);
      setText(item.text);
      setHref(item.href);
      setFeedback(selected?.active ? "siteAnnouncement.saved" : "siteAnnouncement.published");
    } catch (error) {
      setError(responseMessage(error) || t("siteAnnouncement.writeError"));
    } finally {
      setPending(false);
    }
  }

  async function withdraw() {
    if (!selected?.active || pending) return;
    setPending(true);
    setError("");
    setFeedback(null);
    try {
      replaceAnnouncement(await withdrawSiteAnnouncement(selected.id));
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
        ) : announcements === null ? (
          <Spinner color="brand.solid" />
        ) : (
          <Stack asChild gap="4">
            <form onSubmit={save}>
              <HStack justify="space-between" flexWrap="wrap">
                <Text as="h2" fontWeight="semibold">{t(selected ? "siteAnnouncement.edit" : "siteAnnouncement.new")}</Text>
                {selected && <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => select()}>
                  {t("siteAnnouncement.new")}
                </Button>}
              </HStack>
              <Field.Root required invalid={count > MAX_TEXT} disabled={pending}>
                <Field.Label>{t("siteAnnouncement.text")}</Field.Label>
                <Textarea ref={textField} value={text} onChange={(event) => setText(event.target.value)} rows={5} resize="vertical" />
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
                  {t(selected?.active ? "siteAnnouncement.save" : selected ? "siteAnnouncement.republish" : "siteAnnouncement.publish")}
                </Button>
                {selected?.active && (
                  <Button type="button" variant="outline" disabled={pending} onClick={() => void withdraw()}>
                    {t("siteAnnouncement.withdraw")}
                  </Button>
                )}
              </HStack>
            </form>
          </Stack>
        )}
      </Surface>
      {announcements && (
        <Surface p={{ base: "4", md: "6" }} maxW="3xl">
          <Stack gap="4">
            <Text as="h2" fontWeight="semibold">{t("siteAnnouncement.list")}</Text>
            {announcements.length === 0 ? <Text color="fg.muted">{t("siteAnnouncement.empty")}</Text> : (
              <Stack as="ul" listStyleType="none" m="0" p="0" gap="3">
                {announcements.map((item) => (
                  <Box as="li" key={item.id} p="3" borderWidth="1px" borderColor={selectedId === item.id ? "brand.solid" : "border"} borderRadius="md">
                    <Stack data-announcement-id={item.id} gap="2">
                      <Text lineClamp={3} whiteSpace="pre-wrap" overflowWrap="anywhere">{item.text}</Text>
                      <HStack justify="space-between" flexWrap="wrap">
                        <Badge colorPalette={item.active ? "green" : "gray"}>
                          {t(item.active ? "siteAnnouncement.active" : "siteAnnouncement.inactive")}
                        </Badge>
                        <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => select(item)}>
                          {t("siteAnnouncement.edit")}
                        </Button>
                      </HStack>
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Stack>
        </Surface>
      )}
    </Stack>
  );
}

export function AdminSiteAnnouncementPageView() {
  return <AdminGuard required={[Auth.AuthSuperAdmin]}><AnnouncementForm /></AdminGuard>;
}
