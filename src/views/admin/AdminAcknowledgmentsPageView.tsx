"use client";

import {
  Button,
  Dialog,
  Field,
  Heading,
  HStack,
  Input,
  NumberInput,
  Portal,
  Spinner,
  Stack,
  Table,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { AdminGuard } from "@/components/admin/AdminGuard";
import { toaster } from "@/components/ui/toaster";
import { useI18n } from "@/contexts/I18nProvider";
import {
  getAcknowledgmentsWithAdmin,
  setAcknowledgmentsWithAdmin,
} from "@/services/cubing-pro/auth/system";
import type { Thank } from "@/services/cubing-pro/public/types";
import { ThanksSection } from "@/views/Welcome/ThanksSection";

const emptyThank = (): Thank => ({
  wcaID: "",
  nickname: "",
  amount: 0,
  avatar: "",
  other: "",
});

export function AdminAcknowledgmentsPageView() {
  const { t } = useI18n();
  const [list, setList] = useState<Thank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortByAmount, setSortByAmount] = useState<"desc" | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(-1);
  const [form, setForm] = useState<Thank>(emptyThank());

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAcknowledgmentsWithAdmin();
      setList(data ?? []);
    } catch {
      toaster.create({ type: "error", title: "获取赞助列表失败" });
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const displayList = useMemo(() => {
    if (sortByAmount === null) return list;
    return [...list].sort((a, b) => b.amount - a.amount);
  }, [list, sortByAmount]);

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

  const handleApplySort = async () => {
    if (sortByAmount === null) return;
    try {
      await setAcknowledgmentsWithAdmin(displayList);
      toaster.create({ type: "success", title: "排序已应用" });
      setSortByAmount(null);
      void fetchList();
    } catch {
      toaster.create({ type: "error", title: "应用排序失败" });
    }
  };

  const handleDelete = async (index: number) => {
    const newList = list.filter((_, i) => i !== index);
    try {
      await setAcknowledgmentsWithAdmin(newList);
      toaster.create({ type: "success", title: "删除成功" });
      void fetchList();
    } catch {
      toaster.create({ type: "error", title: "删除失败" });
    }
  };

  const handleSave = async () => {
    if (!form.nickname.trim()) {
      toaster.create({ type: "error", title: "请输入名称" });
      return;
    }
    const item: Thank = {
      nickname: form.nickname.trim(),
      amount: Number(form.amount) || 0,
      wcaID: form.wcaID?.trim() ?? "",
      avatar: form.avatar?.trim() ?? "",
      other: form.other?.trim() ?? "",
    };
    const newList = editIndex >= 0 ? list.map((t, i) => (i === editIndex ? item : t)) : [...list, item];
    try {
      await setAcknowledgmentsWithAdmin(newList);
      toaster.create({ type: "success", title: editIndex >= 0 ? "修改成功" : "添加成功" });
      setEditOpen(false);
      void fetchList();
    } catch {
      toaster.create({ type: "error", title: "保存失败" });
    }
  };

  return (
    <AdminGuard>
      <VStack align="stretch" gap="6">
        <Heading size="xl">{t("admin.acknowledgments.title")}</Heading>

        <HStack flexWrap="wrap" gap="2">
          <Button colorPalette="brand" onClick={openAdd}>
            新增
          </Button>
          <Button variant="outline" onClick={() => setSortByAmount("desc")}>
            {t("admin.acknowledgments.sortDesc")}
          </Button>
          {sortByAmount !== null && (
            <>
              <Button colorPalette="brand" onClick={() => void handleApplySort()}>
                {t("admin.acknowledgments.applySort")}
              </Button>
              <Button variant="ghost" onClick={() => setSortByAmount(null)}>
                {t("admin.acknowledgments.cancelSort")}
              </Button>
            </>
          )}
          <Button variant="outline" onClick={() => setPreviewOpen(true)}>
            {t("admin.acknowledgments.preview")}
          </Button>
        </HStack>

        {loading ? (
          <Spinner size="lg" color="brand.solid" alignSelf="center" />
        ) : (
          <Table.Root size="sm" variant="outline">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>名称</Table.ColumnHeader>
                <Table.ColumnHeader>金额</Table.ColumnHeader>
                <Table.ColumnHeader>WCA ID</Table.ColumnHeader>
                <Table.ColumnHeader>头像</Table.ColumnHeader>
                <Table.ColumnHeader>备注</Table.ColumnHeader>
                <Table.ColumnHeader>操作</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {displayList.map((record, index) => (
                <Table.Row key={`${record.nickname}-${index}`}>
                  <Table.Cell>{record.nickname}</Table.Cell>
                  <Table.Cell>¥{record.amount}</Table.Cell>
                  <Table.Cell>{record.wcaID || "-"}</Table.Cell>
                  <Table.Cell>{record.avatar ? "已设置" : "-"}</Table.Cell>
                  <Table.Cell maxW="200px" truncate>
                    {record.other || "-"}
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap="1">
                      <Button size="xs" variant="ghost" onClick={() => openEdit(record, index)}>
                        编辑
                      </Button>
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="red"
                        onClick={() => void handleDelete(index)}
                      >
                        删除
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        )}
      </VStack>

      <Dialog.Root open={editOpen} onOpenChange={(e) => setEditOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content>
              <Dialog.Header>
                <Dialog.Title>{editIndex >= 0 ? "编辑赞助" : "新增赞助"}</Dialog.Title>
              </Dialog.Header>
              <Dialog.Body>
                <Stack gap="4">
                  <Field.Root required>
                    <Field.Label>名称</Field.Label>
                    <Input
                      value={form.nickname}
                      onChange={(e) => setForm((f) => ({ ...f, nickname: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root required>
                    <Field.Label>金额</Field.Label>
                    <NumberInput.Root
                      value={String(form.amount)}
                      onValueChange={(e) => setForm((f) => ({ ...f, amount: Number(e.value) || 0 }))}
                    >
                      <NumberInput.Input />
                    </NumberInput.Root>
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>WCA ID（可选）</Field.Label>
                    <Input
                      value={form.wcaID}
                      onChange={(e) => setForm((f) => ({ ...f, wcaID: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>头像 URL（可选）</Field.Label>
                    <Input
                      value={form.avatar}
                      onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label>备注（可选）</Field.Label>
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
                  取消
                </Button>
                <Button colorPalette="brand" onClick={() => void handleSave()}>
                  保存
                </Button>
              </Dialog.Footer>
              <Dialog.CloseTrigger />
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
                {displayList.length > 0 ? (
                  <ThanksSection data={displayList} />
                ) : (
                  <Text textAlign="center" color="fg.muted" py="8">
                    暂无赞助数据
                  </Text>
                )}
              </Dialog.Body>
              <Dialog.CloseTrigger />
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </AdminGuard>
  );
}
