"use client";

import {
  Button,
  Card,
  Dialog,
  Field,
  Heading,
  HStack,
  Input,
  NativeSelect,
  Portal,
  SegmentGroup,
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
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import {
  getOtherLinksWithAdmin,
  setOtherLinksWithAdmin,
} from "@/services/cubing-pro/auth/system";
import { emptyOtherLinks } from "@/services/cubing-pro/otherLinksNormalize";
import type { OtherLink, OtherLinks } from "@/services/cubing-pro/public/types";
import { ExternalLinkCard } from "@/views/ExternalLinks/ExternalLinkCard";
import {
  EXTERNAL_LINKS_LIST_DESC_MAX,
  ExternalLinksGroupedView,
} from "@/views/ExternalLinks/ExternalLinksPageView";
import {
  MAX_TOP_LINKS,
  findGroupForLinkKey,
  groupDropId,
  groupSortId,
  moveLinkBetweenGroups,
  newEmptyLink,
  parseGroupDropId,
  parseGroupSortId,
  pruneOrphanLinks,
  removeGroup,
  renameGroup,
  reorderGroupsOrder,
  reorderKeysInGroup,
  toggleTop,
} from "@/views/ExternalLinks/utils";

import "@/views/ExternalLinks/externalLinks.css";

function linkMapFrom(links: OtherLink[]) {
  const m = new Map<string, OtherLink>();
  for (const l of links) m.set(l.key, l);
  return m;
}

function SortableGroupRow({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
        marginBottom: 20,
      }}
    >
      <HStack mb="2" fontSize="sm" color="fg.muted" gap="2">
        <button
          type="button"
          {...attributes}
          {...listeners}
          style={{ cursor: "grab", border: "none", background: "none", fontSize: 16 }}
          title="拖动排序分组"
        >
          ⋮⋮
        </button>
        <Text>拖动整组排序</Text>
      </HStack>
      {children}
    </div>
  );
}

function SortableLinkWrap({
  id,
  link,
  admin,
}: {
  id: string;
  link: OtherLink;
  admin: React.ComponentProps<typeof ExternalLinkCard>["admin"];
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.65 : 1,
        height: "100%",
      }}
    >
      <ExternalLinkCard
        link={link}
        descMaxChars={EXTERNAL_LINKS_LIST_DESC_MAX}
        admin={{
          ...admin,
          dragHandleProps: { ...listeners, ...attributes },
        }}
      />
    </div>
  );
}

function GroupDropZone({ groupName, children }: { groupName: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: groupDropId(groupName) });
  return (
    <div
      ref={setNodeRef}
      className={`external-links-group-drop${isOver ? " external-links-group-drop--over" : ""}`}
    >
      {children}
    </div>
  );
}

export function AdminExternalLinksPageView() {
  const { t } = useI18n();
  const [data, setData] = useState<OtherLinks>(emptyOtherLinks());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit");

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalGroup, setLinkModalGroup] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [linkForm, setLinkForm] = useState<OtherLink>(newEmptyLink(""));

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveKey, setMoveKey] = useState<string | null>(null);
  const [moveTargetGroup, setMoveTargetGroup] = useState("");
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteGroupName, setDeleteGroupName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const linkByKey = useMemo(() => linkMapFrom(data.links), [data.links]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getOtherLinksWithAdmin();
      setData(d ?? emptyOtherLinks());
    } catch {
      toaster.create({ type: "error", title: t("externalLinks.fetchError") });
      setData(emptyOtherLinks());
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const aid = String(active.id);
    const oid = String(over.id);

    const gA = parseGroupSortId(aid);
    const gO = parseGroupSortId(oid);
    if (gA && gO) {
      setData((d) => reorderGroupsOrder(d, gA, gO));
      return;
    }

    if (parseGroupSortId(aid)) return;

    const dropGroup = parseGroupDropId(oid);
    if (dropGroup) {
      setData((d) => {
        const fg = findGroupForLinkKey(d, aid);
        if (!fg || fg === dropGroup) return d;
        return moveLinkBetweenGroups(d, aid, fg, dropGroup, aid);
      });
      return;
    }

    setData((d) => {
      const fg = findGroupForLinkKey(d, aid);
      const tg = findGroupForLinkKey(d, oid);
      if (!fg || !tg) return d;
      if (fg === tg) return reorderKeysInGroup(d, fg, aid, oid);
      return moveLinkBetweenGroups(d, aid, fg, tg, oid);
    });
  };

  const openAddLink = (group: string) => {
    setEditingKey(null);
    setLinkModalGroup(group);
    setLinkForm(newEmptyLink(""));
    setLinkModalOpen(true);
  };

  const openEditLink = (group: string, key: string) => {
    const link = linkByKey.get(key);
    if (!link) return;
    setEditingKey(key);
    setLinkModalGroup(group);
    setLinkForm({ ...link });
    setLinkModalOpen(true);
  };

  const submitLink = () => {
    if (!linkForm.name.trim() || !linkForm.url.trim()) {
      toaster.create({ type: "error", title: "请填写名称和 URL" });
      return;
    }
    const key = editingKey ?? uuidv4();
    const item: OtherLink = {
      key,
      name: linkForm.name.trim(),
      desc: linkForm.desc?.trim() ?? "",
      url: linkForm.url.trim(),
      icon: linkForm.icon?.trim() ?? "",
      icon_url: linkForm.icon_url?.trim() ?? "",
    };

    setData((d) => {
      const links = [...d.links.filter((l) => l.key !== key), item];
      const group_map = { ...d.group_map };
      const keys = [...(group_map[linkModalGroup] ?? [])];
      if (!keys.includes(key)) group_map[linkModalGroup] = [...keys, key];
      return { ...d, links, group_map };
    });

    toaster.create({ type: "success", title: editingKey ? "已保存修改" : "已添加链接" });
    setLinkModalOpen(false);
  };

  const deleteLink = (group: string, key: string) => {
    if (!window.confirm("删除该链接？")) return;
    setData((d) => {
      const links = d.links.filter((l) => l.key !== key);
      const tops = d.tops.filter((k) => k !== key);
      const keys = (d.group_map[group] ?? []).filter((k) => k !== key);
      return {
        ...d,
        links,
        tops,
        group_map: { ...d.group_map, [group]: keys },
      };
    });
    toaster.create({ type: "success", title: "已删除" });
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      toaster.create({ type: "warning", title: "请输入分组名称" });
      return;
    }
    if (data.groups.includes(name)) {
      toaster.create({ type: "warning", title: "分组名称已存在" });
      return;
    }
    setData((d) => ({
      ...d,
      groups: [...d.groups, name],
      group_map: { ...d.group_map, [name]: [] },
    }));
    setNewGroupName("");
    setGroupModalOpen(false);
    toaster.create({ type: "success", title: "已添加分组" });
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = pruneOrphanLinks(data);
      setData(cleaned);
      await setOtherLinksWithAdmin(cleaned);
      toaster.create({ type: "success", title: "已保存" });
      void fetchData();
    } catch {
      toaster.create({ type: "error", title: "保存失败" });
    } finally {
      setSaving(false);
    }
  };

  const pinCount = data.tops.length;
  const groupSortItems = data.groups.map(groupSortId);

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Heading size="xl">{t("externalLinks.adminTitle")}</Heading>

        <HStack flexWrap="wrap" gap="2">
          <SegmentGroup.Root
            value={viewMode}
            onValueChange={(e) => setViewMode(e.value as "edit" | "preview")}
            size="sm"
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Item value="edit">
              <SegmentGroup.ItemText>编辑</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
            <SegmentGroup.Item value="preview">
              <SegmentGroup.ItemText>展示</SegmentGroup.ItemText>
              <SegmentGroup.ItemHiddenInput />
            </SegmentGroup.Item>
          </SegmentGroup.Root>
          {viewMode === "edit" && (
            <>
              <Button colorPalette="brand" loading={saving} onClick={() => void save()}>
                保存到服务器
              </Button>
              <Button variant="outline" onClick={() => void fetchData()}>
                重新加载
              </Button>
              <Button variant="outline" onClick={() => setGroupModalOpen(true)}>
                添加分组
              </Button>
            </>
          )}
        </HStack>

        {loading ? (
          <Spinner size="lg" color="brand.solid" alignSelf="center" />
        ) : viewMode === "preview" ? (
          data.groups.length === 0 ? (
            <Card.Root>
              <Card.Body>暂无分组，请先切换到「编辑」并添加分组与链接。</Card.Body>
            </Card.Root>
          ) : (
            <ExternalLinksGroupedView data={data} />
          )
        ) : (
          <>
            {data.groups.length === 0 && (
              <Card.Root mb="4">
                <Card.Body>暂无分组，请先点击「添加分组」创建分组，再在各分组下添加链接。</Card.Body>
              </Card.Root>
            )}
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={groupSortItems} strategy={verticalListSortingStrategy}>
                {data.groups.map((g) => {
                  const keys = data.group_map[g] ?? [];
                  return (
                    <SortableGroupRow key={g} id={groupSortId(g)}>
                      <Card.Root borderRadius="xl">
                        <Card.Header>
                          <HStack justify="space-between" flexWrap="wrap" gap="2">
                            <HStack flexWrap="wrap" gap="2">
                              <Heading size="md">{g}</Heading>
                              <Button
                                size="xs"
                                variant="ghost"
                                onClick={() => {
                                  setRenameTarget(g);
                                  setRenameValue(g);
                                  setRenameModalOpen(true);
                                }}
                              >
                                重命名
                              </Button>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() => {
                                  if (data.groups.length <= 1) {
                                    toaster.create({ type: "warning", title: "至少保留一个分组" });
                                    return;
                                  }
                                  setDeleteGroupName(g);
                                  setDeleteGroupOpen(true);
                                }}
                              >
                                删除
                              </Button>
                            </HStack>
                            <Button size="sm" colorPalette="brand" onClick={() => openAddLink(g)}>
                              添加链接
                            </Button>
                          </HStack>
                        </Card.Header>
                        <Card.Body>
                          <SortableContext id={`links-${g}`} items={keys} strategy={rectSortingStrategy}>
                            <div className="external-links-page">
                              <GroupDropZone groupName={g}>
                                <div className="external-links-grid external-links-grid--max4">
                                  {keys.map((key) => {
                                    const link = linkByKey.get(key);
                                    if (!link) return null;
                                    const pinned = data.tops.includes(key);
                                    return (
                                      <SortableLinkWrap
                                        key={key}
                                        id={key}
                                        link={link}
                                        admin={{
                                          pinned,
                                          pinDisabled: pinCount >= MAX_TOP_LINKS,
                                          onPinChange: (v) => {
                                            setData((d) => {
                                              if (
                                                v &&
                                                d.tops.length >= MAX_TOP_LINKS &&
                                                !d.tops.includes(key)
                                              ) {
                                                toaster.create({
                                                  type: "warning",
                                                  title: `首页置顶最多 ${MAX_TOP_LINKS} 个`,
                                                });
                                                return d;
                                              }
                                              return { ...d, tops: toggleTop(d.tops, key, v) };
                                            });
                                          },
                                          onEdit: () => openEditLink(g, key),
                                          onDelete: () => deleteLink(g, key),
                                          onMove: () => {
                                            const candidates = data.groups.filter(
                                              (x) => findGroupForLinkKey(data, key) !== x,
                                            );
                                            if (candidates.length === 0) {
                                              toaster.create({ type: "info", title: "没有其他分组可移动" });
                                              return;
                                            }
                                            setMoveKey(key);
                                            setMoveTargetGroup(candidates[0]);
                                            setMoveModalOpen(true);
                                          },
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                                {keys.length === 0 && (
                                  <Text fontSize="sm" color="fg.muted">
                                    该分组暂无链接（可拖入其他分组的卡片）
                                  </Text>
                                )}
                              </GroupDropZone>
                            </div>
                          </SortableContext>
                        </Card.Body>
                      </Card.Root>
                    </SortableGroupRow>
                  );
                })}
              </SortableContext>
            </DndContext>
          </>
        )}
      </VStack>

      <Dialog.Root open={linkModalOpen} onOpenChange={(e) => setLinkModalOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content maxW="580px">
              <Dialog.Header>
                <Dialog.Title>{editingKey ? "编辑链接" : "添加链接"}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Field.Root required>
                    <Field.Label>名称</Field.Label>
                    <Input
                      value={linkForm.name}
                      onChange={(e) => setLinkForm((f) => ({ ...f, name: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>描述</Field.Label>
                    <Textarea
                      rows={3}
                      value={linkForm.desc}
                      onChange={(e) => setLinkForm((f) => ({ ...f, desc: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>链接 URL</Field.Label>
                    <Input
                      value={linkForm.url}
                      onChange={(e) => setLinkForm((f) => ({ ...f, url: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>图标 URL（可选）</Field.Label>
                    <Input
                      value={linkForm.icon_url}
                      onChange={(e) => setLinkForm((f) => ({ ...f, icon_url: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>图标（letter:A 或图片路径）</Field.Label>
                    <Input
                      placeholder="letter:A 或 /path/icon.png"
                      value={linkForm.icon}
                      onChange={(e) => setLinkForm((f) => ({ ...f, icon: e.target.value }))}
                    />
                  </Field.Root>
                </Stack>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setLinkModalOpen(false)}>
                  取消
                </Button>
                <Button colorPalette="brand" onClick={submitLink}>
                  确定
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root open={groupModalOpen} onOpenChange={(e) => setGroupModalOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>添加分组</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Input
                  placeholder="分组名称"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addGroup()}
                />
              </Dialog.Body>
              <Dialog.Footer>
                <Button colorPalette="brand" onClick={addGroup}>
                  确定
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root open={renameModalOpen} onOpenChange={(e) => setRenameModalOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>重命名分组</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  colorPalette="brand"
                  onClick={() => {
                    const nv = renameValue.trim();
                    if (!nv) {
                      toaster.create({ type: "warning", title: "请输入新名称" });
                      return;
                    }
                    setData((d) => renameGroup(d, renameTarget, nv));
                    setRenameModalOpen(false);
                    toaster.create({ type: "success", title: "已重命名" });
                  }}
                >
                  确定
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root open={moveModalOpen} onOpenChange={(e) => setMoveModalOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>移动到分组</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <NativeSelect.Root>
                  <NativeSelect.Field
                    value={moveTargetGroup}
                    onChange={(e) => setMoveTargetGroup(e.target.value)}
                  >
                    {data.groups
                      .filter((g) => moveKey && findGroupForLinkKey(data, moveKey) !== g)
                      .map((x) => (
                        <option key={x} value={x}>
                          {x}
                        </option>
                      ))}
                  </NativeSelect.Field>
                </NativeSelect.Root>
              </Dialog.Body>
              <Dialog.Footer>
                <Button
                  colorPalette="brand"
                  onClick={() => {
                    if (!moveKey || !moveTargetGroup) return;
                    const fg = findGroupForLinkKey(data, moveKey);
                    if (!fg || fg === moveTargetGroup) {
                      setMoveModalOpen(false);
                      return;
                    }
                    setData((d) => moveLinkBetweenGroups(d, moveKey, fg, moveTargetGroup, moveKey));
                    setMoveModalOpen(false);
                    toaster.create({ type: "success", title: "已移动" });
                  }}
                >
                  确定
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <Dialog.Root open={deleteGroupOpen} onOpenChange={(e) => setDeleteGroupOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>删除分组「{deleteGroupName}」</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Text fontSize="sm">
                  「仅删分组」将把该分组内链接移动到列表中的第一个分组；「删除分组与链接」将移除这些链接。
                </Text>
              </Dialog.Body>
              <Dialog.Footer>
                <Button variant="outline" onClick={() => setDeleteGroupOpen(false)}>
                  取消
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setData((d) => removeGroup(d, deleteGroupName, false));
                    setDeleteGroupOpen(false);
                    toaster.create({ type: "success", title: "已删除分组，链接已合并到第一个分组" });
                  }}
                >
                  仅删分组
                </Button>
                <Button
                  colorPalette="red"
                  onClick={() => {
                    setData((d) => removeGroup(d, deleteGroupName, true));
                    setDeleteGroupOpen(false);
                    toaster.create({ type: "success", title: "已删除分组及链接" });
                  }}
                >
                  删除分组与链接
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </AdminGuard>
  );
}
