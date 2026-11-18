"use client";
import { useAdminManagement } from "@/views/admin/useAdminManagement";
import { PageHeader } from "@/components/ui/page";
import "./admin-ui.css";

import {
  Avatar,
  Badge,
  Button,
  Card,
  Dialog,
  Field,
  HStack,
  Image,
  Input,
  NumberInput,
  Portal,
  Spinner,
  Stack,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import { getIntlLocale } from "@/i18n/locales";
import { useAdminDragAccessibility } from "./useAdminDragAccessibility";
import {
  getAcknowledgmentsWithAdmin,
  setAcknowledgmentsWithAdmin,
} from "@/services/cubing-pro/auth/system";
import type { Thank } from "@/services/cubing-pro/public/types";
import { apiGetWCAPersonProfile } from "@/services/cubing-pro/wca/wca_api";
import { ThanksSection } from "@/views/Welcome/ThanksSection";

const ROW_ID_PREFIX = "ack-";
const rowId = (index: number) => `${ROW_ID_PREFIX}${index}`;

function parseRowId(id: string | number): number {
  const index = Number(String(id).slice(ROW_ID_PREFIX.length));
  return Number.isNaN(index) ? -1 : index;
}

const emptyThank = (): Thank => ({
  wcaID: "",
  nickname: "",
  amount: 0,
  avatar: "",
  other: "",
  pinned: false,
});

function hasValidWcaId(wcaID: string): boolean {
  return !!wcaID && wcaID !== "-" && wcaID.length === 10;
}

function normalizeThanks(list: Thank[]): Thank[] {
  return [...list.filter((x) => x.pinned), ...list.filter((x) => !x.pinned)];
}

function SortableRow({
  id,
  pinned,
  dragLabel,
  children,
}: {
  id: string;
  pinned: boolean;
  dragLabel: string;
  children: React.ReactNode;
}) {
  const m = useAdminManagement();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    attributes: { roleDescription: m("adminManagement.dragInstructions") },
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
        position: "relative",
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <HStack
        gap="3"
        px="3"
        py="2"
        borderWidth="1px"
        borderRadius="var(--radius-card)"
        bg={pinned ? "var(--accent-soft)" : "var(--card)"}
        borderColor="var(--border-default)"
        _hover={{ bg: "var(--muted)" }}
        flexWrap="wrap"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={dragLabel}
          title={dragLabel}
          style={{ cursor: "grab", border: "none", background: "none", fontSize: 16, padding: 0 }}
        >
          ⋮⋮
        </button>
        {children}
      </HStack>
    </div>
  );
}

function AvatarUrlField({
  value,
  wcaID,
  onChange,
  onPreview,
}: {
  value: string;
  wcaID: string;
  onChange: (v: string) => void;
  onPreview: (url: string) => void;
}) {
  const m = useAdminManagement();
  const { t } = useI18n();
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [fetchingWca, setFetchingWca] = useState(false);

  useEffect(() => {
    const url = value.trim();
    if (!url) {
      setStatus("idle");
      return;
    }
    setStatus("loading");
    let cancelled = false;
    const img = document.createElement("img");
    img.onload = () => {
      if (!cancelled) setStatus("ok");
    };
    img.onerror = () => {
      if (!cancelled) setStatus("error");
    };
    img.src = url;
    return () => {
      cancelled = true;
    };
  }, [value]);

  const fetchWcaAvatar = async () => {
    const id = wcaID.trim();
    if (!hasValidWcaId(id)) {
      toaster.create({ type: "warning", title: t("admin.acknowledgments.wcaIdInvalid") });
      return;
    }
    setFetchingWca(true);
    try {
      const res = await apiGetWCAPersonProfile(id);
      const url = res.person?.avatar?.thumb_url ?? "";
      if (url) {
        onChange(url);
        toaster.create({ type: "success", title: t("admin.acknowledgments.wcaAvatarFetched") });
      } else {
        toaster.create({ type: "warning", title: t("admin.acknowledgments.wcaAvatarMissing") });
      }
    } catch {
      toaster.create({ type: "error", title: t("admin.acknowledgments.wcaAvatarFailed") });
    } finally {
      setFetchingWca(false);
    }
  };

  return (
    <Field.Root>
      <Field.Label>{m("adminManagement.avatarUrl")}</Field.Label>
      <HStack align="flex-start" gap="4">
        <Stack gap="2" flex="1" minW="0">
          <Input
            placeholder="https://..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
          <HStack gap="3" flexWrap="wrap">
            <Button size="2xs" variant="outline" loading={fetchingWca} onClick={() => void fetchWcaAvatar()}>
              {t("admin.acknowledgments.fetchWcaAvatar")}
            </Button>
            <Text fontSize="xs" color="fg.muted">
              {t("admin.acknowledgments.avatarHint")}
            </Text>
          </HStack>
          {status === "error" && (
            <Text fontSize="xs" color="red.solid">
              {t("admin.acknowledgments.avatarLoadError")}
            </Text>
          )}
        </Stack>
        {value.trim() && (
          <Avatar.Root
            size="2xl"
            style={{ flexShrink: 0 }}
            cursor={status === "ok" ? "zoom-in" : "default"}
            onClick={() => status === "ok" && onPreview(value.trim())}
          >
            <Avatar.Image src={value.trim()} />
            <Avatar.Fallback name="?" />
          </Avatar.Root>
        )}
      </HStack>
    </Field.Root>
  );
}

export function AdminAcknowledgmentsPageView() {
  const m = useAdminManagement();
  const dragAccessibility = useAdminDragAccessibility();
  const { t, locale } = useI18n();
  const [list, setList] = useState<Thank[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState<Thank>(emptyThank());
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAcknowledgmentsWithAdmin();
      setList(normalizeThanks(data ?? []));
    } catch {
      toaster.create({ type: "error", title: m("adminManagement.sponsorsFailed") });
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [m]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const persist = useCallback(
    async (next: Thank[], successTitle?: string) => {
      setList(next);
      setSaving(true);
      try {
        await setAcknowledgmentsWithAdmin(next);
        if (successTitle) toaster.create({ type: "success", title: successTitle });
      } catch {
        toaster.create({ type: "error", title: t("admin.acknowledgments.saveError") });
        void fetchList();
      } finally {
        setSaving(false);
      }
    },
    [fetchList, t],
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const from = parseRowId(active.id);
    const to = parseRowId(over.id);
    if (from < 0 || to < 0 || from >= list.length || to >= list.length) return;

    const moved = arrayMove(list, from, to);
    const pinnedCount = list.filter((x) => x.pinned).length;
    const wasPinned = !!list[from].pinned;

    let boundary = pinnedCount;
    if (!wasPinned && to < pinnedCount) boundary = pinnedCount + 1;
    else if (wasPinned && to >= pinnedCount) boundary = pinnedCount - 1;

    const adjusted = moved.map((item, i) => ({ ...item, pinned: i < boundary }));
    void persist(adjusted);
  };

  const togglePin = (index: number) => {
    const willPin = !list[index].pinned;
    const next = normalizeThanks(
      list.map((item, i) => (i === index ? { ...item, pinned: willPin } : item)),
    );
    void persist(
      next,
      willPin ? t("admin.acknowledgments.pinnedToast") : t("admin.acknowledgments.unpinnedToast"),
    );
  };

  const handleDelete = (index: number) => {
    if (!window.confirm(m("adminManagement.deleteSponsor", { name: list[index].nickname }))) return;
    void persist(list.filter((_, i) => i !== index), m("adminManagement.deleted"));
  };

  const openAdd = () => {
    setEditIndex(-1);
    setForm(emptyThank());
    setEditOpen(true);
  };

  const openEdit = (record: Thank, index: number) => {
    setEditIndex(index);
    setForm({ ...record });
    setEditOpen(true);
  };

  const handleSave = () => {
    if (!form.nickname.trim()) {
      toaster.create({ type: "error", title: m("adminManagement.nameRequired") });
      return;
    }
    const item: Thank = {
      nickname: form.nickname.trim(),
      amount: Number(form.amount) || 0,
      wcaID: form.wcaID?.trim() ?? "",
      avatar: form.avatar?.trim() ?? "",
      other: form.other?.trim() ?? "",
      pinned: editIndex >= 0 ? !!list[editIndex]?.pinned : false,
    };
    const next = normalizeThanks(
      editIndex >= 0 ? list.map((x, i) => (i === editIndex ? item : x)) : [...list, item],
    );
    setEditOpen(false);
    void persist(next, editIndex >= 0 ? t("profile.saveOk") : m("adminManagement.added"));
  };

  const pinnedCount = list.filter((x) => x.pinned).length;

  const renderRow = (record: Thank, index: number) => {
    const pinned = !!record.pinned;
    return (
      <SortableRow
        key={rowId(index)}
        id={rowId(index)}
        pinned={pinned}
        dragLabel={t("admin.acknowledgments.dragRow")}
      >
        {record.avatar ? (
          <Avatar.Root
            size="md"
            style={{ flexShrink: 0 }}
            cursor="zoom-in"
            onClick={() => setAvatarPreviewUrl(record.avatar)}
          >
            <Avatar.Image src={record.avatar} />
            <Avatar.Fallback name={record.nickname} />
          </Avatar.Root>
        ) : (
          <Avatar.Root size="md" style={{ flexShrink: 0 }}>
            <Avatar.Fallback name={record.nickname} />
          </Avatar.Root>
        )}
        <VStack align="start" gap="0" flex="1" minW="0">
          <HStack gap="2" minW="0">
            <Text fontSize="sm" fontWeight="medium" truncate>
              {record.nickname}
            </Text>
            {pinned && (
              <Badge
                colorPalette="brand"
                variant="subtle"
                borderRadius="full"
                style={{ flexShrink: 0 }}
              >
                {t("admin.acknowledgments.pin")}
              </Badge>
            )}
          </HStack>
          <HStack gap="2" fontSize="xs" color="fg.muted" minW="0" flexWrap="wrap">
            {record.wcaID && <Text fontFamily="mono">{record.wcaID}</Text>}
            <Text>¥{record.amount}</Text>
            {record.other && (
              <Text truncate maxW="260px">
                {record.other}
              </Text>
            )}
          </HStack>
        </VStack>
        <HStack gap="1" style={{ flexShrink: 0 }}>
          <Button size="xs" variant="ghost" onClick={() => togglePin(index)}>
            {pinned ? t("admin.acknowledgments.unpin") : t("admin.acknowledgments.pin")}
          </Button>
          <Button size="xs" variant="ghost" onClick={() => openEdit(record, index)}>
            {t("teamMatch.edit")}
          </Button>
          <Button
            size="xs"
            variant="ghost"
            colorPalette="red"
            onClick={() => handleDelete(index)}
          >
            {t("teamMatch.delete")}
          </Button>
        </HStack>
      </SortableRow>
    );
  };

  return (
    <AdminGuard>
      <VStack className="admin-page" align="stretch" gap="6">
        <PageHeader eyebrow={t("admin.admins.siteManagement")} title={t("admin.acknowledgments.title")} />

        <HStack className="admin-toolbar" flexWrap="wrap" gap="2">
          <Button colorPalette="brand" onClick={openAdd}>
            {t("teamMatch.add")}
          </Button>
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            {t("admin.acknowledgments.preview")}
          </Button>
          <Button variant="ghost" onClick={() => void fetchList()}>
            {t("admin.acknowledgments.reload")}
          </Button>
          {saving && (
            <HStack gap="2" color="fg.muted">
              <Spinner size="xs" />
              <Text fontSize="xs">{t("admin.acknowledgments.saving")}</Text>
            </HStack>
          )}
        </HStack>

        <Text fontSize="xs" color="fg.muted">
          {t("admin.acknowledgments.dragHint")}
        </Text>

        {loading ? (
          <Spinner size="lg" color="brand.solid" alignSelf="center" />
        ) : list.length === 0 ? (
          <Card.Root variant="outline" borderRadius="var(--radius-card)" bg="var(--card)" borderColor="var(--border-default)">
            <Card.Body>
              <Text color="fg.muted">{t("admin.acknowledgments.empty")}</Text>
            </Card.Body>
          </Card.Root>
        ) : (
          <VStack align="stretch" gap="2">
            <DndContext accessibility={dragAccessibility} sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext
                items={list.map((_, i) => rowId(i))}
                strategy={verticalListSortingStrategy}
              >
                {pinnedCount > 0 && (
                  <Text fontSize="sm" color="fg.muted" mb="1">
                    {t("admin.acknowledgments.pinnedZone")}（{pinnedCount}）
                  </Text>
                )}
                {list.slice(0, pinnedCount).map((record, i) => renderRow(record, i))}
                {list.length - pinnedCount > 0 && (
                  <Text fontSize="sm" color="fg.muted" mb="1" mt={pinnedCount > 0 ? "3" : "0"}>
                    {t("admin.acknowledgments.normalZone")}（{list.length - pinnedCount}）
                  </Text>
                )}
                {list.slice(pinnedCount).map((record, i) => renderRow(record, i + pinnedCount))}
              </SortableContext>
            </DndContext>
          </VStack>
        )}
      </VStack>

      <Dialog.Root open={editOpen} onOpenChange={(e) => setEditOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="560px">
              <Dialog.Header>
                <Dialog.Title>{editIndex >= 0 ? m("adminManagement.editSponsor") : m("adminManagement.addSponsor")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Field.Root required>
                    <Field.Label>{t("competitionAdmin.name")}</Field.Label>
                    <Input
                      value={form.nickname}
                      onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>{m("adminManagement.amount")}</Field.Label>
                     <NumberInput.Root
                       locale={getIntlLocale(locale)}
                      value={String(form.amount)}
                      onValueChange={(e) => setForm((f) => ({ ...f, amount: Number(e.value) || 0 }))}
                    >
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>{m("adminManagement.optionalWcaId")}</Field.Label>
                    <Input
                      value={form.wcaID}
                      onChange={(e) => setForm((f) => ({ ...f, wcaID: e.target.value }))}
                    />
                  </Field.Root>
                  <AvatarUrlField
                    value={form.avatar}
                    wcaID={form.wcaID}
                    onChange={(v) => setForm((f) => ({ ...f, avatar: v }))}
                    onPreview={setAvatarPreviewUrl}
                  />
                  <Field.Root>
                    <Field.Label>{m("adminManagement.optionalNotes")}</Field.Label>
                    <Textarea
                      value={form.other}
                      onChange={(e) => setForm((f) => ({ ...f, other: e.target.value }))}
                      rows={2}
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setEditOpen(false)}>
                  {t("teamMatch.cancel")}
                </Button>
                <Button colorPalette="brand" onClick={handleSave}>
                  {t("teamMatch.save")}
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger aria-label={t("competitionAdmin.close")} />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root
        open={avatarPreviewUrl !== null}
        onOpenChange={(e) => !e.open && setAvatarPreviewUrl(null)}
        size="sm"
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{t("admin.acknowledgments.avatarPreview")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {avatarPreviewUrl && (
                  <Image
                    src={avatarPreviewUrl}
                    alt={t("admin.acknowledgments.avatarPreview")}
                    borderRadius="lg"
                    w="full"
                    maxH="60vh"
                    objectFit="contain"
                  />
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger aria-label={t("competitionAdmin.close")} />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root open={previewOpen} onOpenChange={(e) => setPreviewOpen(e.open)} size="xl">
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="800px">
              <Dialog.Header>
                <Dialog.Title>{t("admin.acknowledgments.preview")}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                {list.length > 0 ? (
                  <ThanksSection data={list} />
                ) : (
                  <Text textAlign="center" color="fg.muted" py="8">
                    {m("adminManagement.noSponsors")}
                  </Text>
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger aria-label={t("competitionAdmin.close")} />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </AdminGuard>
  );
}
