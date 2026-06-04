"use client";

import {
  Badge,
  Box,
  Button,
  Card,
  Field,
  Grid,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Separator,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import NextLink from "next/link";
import { useCallback, useEffect, useState } from "react";

import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import { Auth, hasAuth } from "@/lib/auth";
import { parseCurrentUserData } from "@/lib/parseCurrentUser";
import { currentUser, updateDetail } from "@/services/cubing-pro/auth/auth";
import { getApiErrorDisplayMessage } from "@/services/cubing-pro/request";
import type { CurrentUserData } from "@/services/cubing-pro/auth/types";
import type { AxiosError } from "axios";

function formatDate(value: string) {
  if (!value) return "—";
  return value.split("T")[0]?.replace(/-/g, " / ") ?? value;
}

function AuthBadges({ auth, t }: { auth: number; t: (k: import("@/i18n").MessageKey) => string }) {
  const tags: { key: string; color: string }[] = [];
  if (hasAuth(auth, Auth.AuthSuperAdmin))
    tags.push({ key: "profile.auth.super", color: "orange" });
  if (hasAuth(auth, Auth.AuthAdmin))
    tags.push({ key: "profile.auth.admin", color: "pink" });
  if (hasAuth(auth, Auth.AuthDelegates))
    tags.push({ key: "profile.auth.delegate", color: "yellow" });
  if (hasAuth(auth, Auth.AuthOrganizers))
    tags.push({ key: "profile.auth.organizer", color: "purple" });
  if (hasAuth(auth, Auth.AuthPlayer))
    tags.push({ key: "profile.auth.player", color: "green" });
  return (
    <HStack gap="1" flexWrap="wrap">
      {tags.map((tag) => (
        <Badge key={tag.key} colorPalette={tag.color} size="sm">
          {t(tag.key as import("@/i18n").MessageKey)}
        </Badge>
      ))}
    </HStack>
  );
}

export function ProfileUserInfo({
  initialUser,
  onUpdated,
}: {
  initialUser: CurrentUserData;
  onUpdated: () => void;
}) {
  const { t } = useI18n();
  const [user, setUser] = useState(initialUser);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    Name: initialUser.Name,
    EnName: initialUser.EnName,
    QQ: initialUser.QQ,
    Sex: String(initialUser.Sex ?? 1),
    Birthdate: initialUser.Birthdate?.split("T")[0] ?? "",
    Sign: initialUser.Sign ?? "",
  });

  const reload = useCallback(async () => {
    const res = await currentUser();
    const data = parseCurrentUserData(res);
    if (!data) throw new Error("invalid user response");
    setUser(data);
    setForm({
      Name: data.Name,
      EnName: data.EnName,
      QQ: data.QQ,
      Sex: String(data.Sex ?? 1),
      Birthdate: data.Birthdate?.split("T")[0] ?? "",
      Sign: data.Sign ?? "",
    });
    onUpdated();
  }, [onUpdated]);

  useEffect(() => {
    setUser(initialUser);
  }, [initialUser]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDetail({
        Name: form.Name,
        EnName: form.EnName,
        WcaID: user.WcaID,
        QQ: form.QQ,
        Sex: Number(form.Sex),
        Birthdate: form.Birthdate,
        Sign: form.Sign,
      });
      toaster.create({ title: t("profile.saveOk"), type: "success" });
      await reload();
    } catch (e) {
      const err = e as AxiosError;
      const msg =
        getApiErrorDisplayMessage(err.response?.data) ?? t("profile.saveFail");
      toaster.create({ title: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const readonlyRows = [
    { label: t("profile.field.id"), value: String(user.id) },
    { label: t("profile.field.cubeId"), value: user.CubeID },
    { label: t("profile.field.createdAt"), value: formatDate(user.createdAt) },
    { label: t("profile.field.email"), value: user.Email || "—" },
    { label: t("profile.field.level"), value: String(user.Level) },
    { label: t("profile.field.exp"), value: String(user.Experience) },
  ];

  return (
    <VStack gap="4" align="stretch">
      <Card.Root>
        <Card.Header>
          <Heading size="md">{t("profile.infoTitle")}</Heading>
        </Card.Header>
        <Card.Body>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="3">
            {readonlyRows.map((row) => (
              <Box key={row.label}>
                <Text fontSize="xs" color="fg.muted">
                  {row.label}
                </Text>
                <Text fontWeight="medium">{row.value}</Text>
              </Box>
            ))}
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="xs" color="fg.muted" mb="1">
                {t("profile.field.auth")}
              </Text>
              <AuthBadges auth={user.Auth} t={t} />
            </Box>
            <Box gridColumn={{ md: "1 / -1" }}>
              <Text fontSize="xs" color="fg.muted">
                {t("profile.field.qqUni")}
              </Text>
              <Text fontFamily="mono" fontSize="sm">
                {user.QQUniID || "—"}
              </Text>
            </Box>
          </Grid>
          {user.CubeID ? (
            <Button asChild mt="4" size="sm" variant="outline" alignSelf="flex-start">
              <NextLink href={`/player/${user.CubeID}`}>
                {t("user.myHome")}
              </NextLink>
            </Button>
          ) : null}
        </Card.Body>
      </Card.Root>

      <Card.Root>
        <Card.Header>
          <Heading size="md">{t("profile.editTitle")}</Heading>
          <Text fontSize="sm" color="fg.muted" mt="1">
            {t("profile.editHint")}
          </Text>
        </Card.Header>
        <Card.Body>
          <VStack gap="4" align="stretch">
            <Field.Root>
              <Field.Label>{t("profile.field.name")}</Field.Label>
              <Input
                value={form.Name}
                onChange={(e) => setForm((f) => ({ ...f, Name: e.target.value }))}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.enName")}</Field.Label>
              <Input
                value={form.EnName}
                onChange={(e) => setForm((f) => ({ ...f, EnName: e.target.value }))}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.wcaId")}</Field.Label>
              <Input value={user.WcaID || "—"} readOnly bg="bg.muted" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.qq")}</Field.Label>
              <Input
                value={form.QQ}
                onChange={(e) => setForm((f) => ({ ...f, QQ: e.target.value }))}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.sex")}</Field.Label>
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={form.Sex}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, Sex: e.target.value }))
                  }
                >
                  <option value="0">{t("profile.sex.bot")}</option>
                  <option value="1">{t("profile.sex.male")}</option>
                  <option value="2">{t("profile.sex.female")}</option>
                </NativeSelect.Field>
              </NativeSelect.Root>
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.birthdate")}</Field.Label>
              <Input
                type="date"
                value={form.Birthdate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, Birthdate: e.target.value }))
                }
              />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t("profile.field.sign")}</Field.Label>
              <Textarea
                value={form.Sign}
                rows={3}
                onChange={(e) => setForm((f) => ({ ...f, Sign: e.target.value }))}
              />
            </Field.Root>
            <Separator />
            <Button
              colorPalette="brand"
              alignSelf="flex-start"
              loading={saving}
              onClick={() => void handleSave()}
            >
              {t("profile.save")}
            </Button>
          </VStack>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
}
