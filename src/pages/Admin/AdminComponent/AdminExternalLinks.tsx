import { useIntl } from '@@/plugin-locale';
import { Auth, checkAuth } from '@/pages/Admin/AuthComponents/AuthComponents';
import ExternalLinkCard from '@/pages/ExternalLinks/ExternalLinkCard';
import ExternalLinksGroupedView, {
  EXTERNAL_LINKS_LIST_DESC_MAX,
} from '@/pages/ExternalLinks/ExternalLinksGroupedView';
import { ExternalLinkIconField } from '@/pages/ExternalLinks/externalLinkIconField';
import '@/pages/ExternalLinks/ExternalLinks.less';
import {
  findGroupForLinkKey,
  groupDropId,
  groupSortId,
  MAX_TOP_LINKS,
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
} from '@/pages/ExternalLinks/utils';
import {
  getOtherLinksWithAdmin,
  setOtherLinksWithAdmin,
} from '@/services/cubing-pro/auth/system';
import type { OtherLink, OtherLinks } from '@/services/cubing-pro/auth/typings';
import { emptyOtherLinks } from '@/services/cubing-pro/otherLinksNormalize';
import { PageContainer } from '@ant-design/pro-components';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PlusOutlined } from '@ant-design/icons';
import { Button, Card, Form, Input, Modal, Segmented, Select, Space, message } from 'antd';
import classNames from 'classnames';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

function linkMapFrom(links: OtherLink[]): Map<string, OtherLink> {
  const m = new Map<string, OtherLink>();
  for (const l of links) m.set(l.key, l);
  return m;
}

const SortableGroupRow: React.FC<{
  id: string;
  children: React.ReactNode;
}> = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
    marginBottom: 20,
  };
  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 8,
          fontSize: 13,
          color: 'var(--ant-color-text-secondary)',
        }}
      >
        <span
          {...attributes}
          {...listeners}
          style={{ cursor: 'grab', userSelect: 'none', fontSize: 16 }}
          title="拖动排序分组"
        >
          ⋮⋮
        </span>
        <span>拖动整组排序</span>
      </div>
      {children}
    </div>
  );
};

const SortableLinkWrap: React.FC<{
  id: string;
  link: OtherLink;
  admin: React.ComponentProps<typeof ExternalLinkCard>['admin'];
}> = ({ id, link, admin }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
    height: '100%',
  };
  return (
    <div ref={setNodeRef} style={style} className="external-links-sortable-link">
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
};

const GroupDropZone: React.FC<{
  groupName: string;
  children: React.ReactNode;
}> = ({ groupName, children }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: groupDropId(groupName),
  });
  return (
    <div
      ref={setNodeRef}
      className={classNames('external-links-group-drop', isOver && 'external-links-group-drop--over')}
    >
      {children}
    </div>
  );
};

const AdminExternalLinks: React.FC = () => {
  const intl = useIntl();
  const user = checkAuth([Auth.AuthAdmin, Auth.AuthSuperAdmin]);
  const [data, setData] = useState<OtherLinks>(emptyOtherLinks());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [linkModalGroup, setLinkModalGroup] = useState<string>('');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [form] = Form.useForm<OtherLink>();
  const iconUrlWatch = Form.useWatch('icon_url', form);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');

  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveKey, setMoveKey] = useState<string | null>(null);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const [deleteGroupName, setDeleteGroupName] = useState('');

  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');

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
      message.error(intl.formatMessage({ id: 'menu.ExternalLinks.fetchError' }));
      setData(emptyOtherLinks());
    } finally {
      setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    fetchData();
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
      if (fg === tg) {
        return reorderKeysInGroup(d, fg, aid, oid);
      }
      return moveLinkBetweenGroups(d, aid, fg, tg, oid);
    });
  };

  const openAddLink = (group: string) => {
    setEditingKey(null);
    setLinkModalGroup(group);
    form.setFieldsValue(newEmptyLink(''));
    setLinkModalOpen(true);
  };

  const openEditLink = (group: string, key: string) => {
    const link = linkByKey.get(key);
    if (!link) return;
    setEditingKey(key);
    setLinkModalGroup(group);
    form.setFieldsValue({ ...link });
    setLinkModalOpen(true);
  };

  const submitLink = async () => {
    try {
      const v = await form.validateFields();
      const key = editingKey ?? uuidv4();
      const item: OtherLink = {
        key,
        name: v.name?.trim() ?? '',
        desc: v.desc?.trim() ?? '',
        url: v.url?.trim() ?? '',
        icon: v.icon?.trim() ?? '',
        icon_url: v.icon_url?.trim() ?? '',
      };

      setData((d) => {
        const links = [...d.links.filter((l) => l.key !== key), item];
        const group_map = { ...d.group_map };
        const keys = [...(group_map[linkModalGroup] ?? [])];
        if (!keys.includes(key)) {
          group_map[linkModalGroup] = [...keys, key];
        } else {
          group_map[linkModalGroup] = keys;
        }
        return { ...d, links, group_map };
      });

      message.success(editingKey ? '已保存修改' : '已添加链接');
      setLinkModalOpen(false);
    } catch {
      /* validate */
    }
  };

  const deleteLink = (group: string, key: string) => {
    Modal.confirm({
      title: '删除该链接？',
      onOk: () => {
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
        message.success('已删除');
      },
    });
  };

  const addGroup = () => {
    const name = newGroupName.trim();
    if (!name) {
      message.warning('请输入分组名称');
      return;
    }
    if (data.groups.includes(name)) {
      message.warning('分组名称已存在');
      return;
    }
    setData((d) => ({
      ...d,
      groups: [...d.groups, name],
      group_map: { ...d.group_map, [name]: [] },
    }));
    setNewGroupName('');
    setGroupModalOpen(false);
    message.success('已添加分组');
  };

  const [moveTargetGroup, setMoveTargetGroup] = useState<string>('');

  const confirmRename = () => {
    const nv = renameValue.trim();
    if (!nv) {
      message.warning('请输入新名称');
      return;
    }
    setData((d) => renameGroup(d, renameTarget, nv));
    setRenameModalOpen(false);
    message.success('已重命名');
  };

  const openMove = (key: string) => {
    const fg = findGroupForLinkKey(data, key);
    const candidates = data.groups.filter((g) => g !== fg);
    if (candidates.length === 0) {
      message.info('没有其他分组可移动');
      return;
    }
    setMoveKey(key);
    setMoveTargetGroup(candidates[0]);
    setMoveModalOpen(true);
  };

  const applyMove = () => {
    if (!moveKey || !moveTargetGroup) return;
    const key = moveKey;
    const fg = findGroupForLinkKey(data, key);
    if (!fg || fg === moveTargetGroup) {
      setMoveModalOpen(false);
      return;
    }
    setData((d) => moveLinkBetweenGroups(d, key, fg, moveTargetGroup, key));
    setMoveModalOpen(false);
    message.success('已移动');
  };

  const save = async () => {
    setSaving(true);
    try {
      const cleaned = pruneOrphanLinks(data);
      setData(cleaned);
      await setOtherLinksWithAdmin(cleaned);
      message.success('已保存');
      fetchData();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  if (user === null) {
    return <>无权限</>;
  }

  const groupSortItems = data.groups.map(groupSortId);
  const pinCount = data.tops.length;

  return (
    <PageContainer title={intl.formatMessage({ id: 'menu.ExternalLinks.adminTitle' })} loading={loading}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Segmented
          options={[
            { label: '编辑', value: 'edit' },
            { label: '展示', value: 'preview' },
          ]}
          value={viewMode}
          onChange={(v) => setViewMode(v as 'edit' | 'preview')}
        />
        {viewMode === 'edit' && (
          <>
            <Button type="primary" loading={saving} onClick={save}>
              保存到服务器
            </Button>
            <Button onClick={fetchData}>重新加载</Button>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => setGroupModalOpen(true)}>
              添加分组
            </Button>
          </>
        )}
      </Space>

      {viewMode === 'preview' ? (
        <>
          {data.groups.length === 0 ? (
            <Card size="small" style={{ marginBottom: 16 }}>
              暂无分组，请先切换到「编辑」并添加分组与链接。
            </Card>
          ) : (
            <ExternalLinksGroupedView data={data} />
          )}
        </>
      ) : (
        <>
      {data.groups.length === 0 && (
        <Card size="small" style={{ marginBottom: 16 }}>
          暂无分组，请先点击「添加分组」创建分组，再在各分组下添加链接。
        </Card>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={groupSortItems} strategy={verticalListSortingStrategy}>
          {data.groups.map((g) => {
            const keys = data.group_map[g] ?? [];
            return (
              <SortableGroupRow key={g} id={groupSortId(g)}>
                <Card
                  title={
                    <Space wrap>
                      <span>{g}</span>
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          setRenameTarget(g);
                          setRenameValue(g);
                          setRenameModalOpen(true);
                        }}
                      >
                        重命名
                      </Button>
                      <Button
                        type="link"
                        size="small"
                        danger
                        onClick={() => {
                          if (data.groups.length <= 1) {
                            message.warning('至少保留一个分组');
                            return;
                          }
                          setDeleteGroupName(g);
                          setDeleteGroupOpen(true);
                        }}
                      >
                        删除
                      </Button>
                    </Space>
                  }
                  extra={
                    <Button type="primary" size="small" onClick={() => openAddLink(g)}>
                      添加链接
                    </Button>
                  }
                  styles={{ body: { padding: 16 } }}
                >
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
                                        message.warning(`首页置顶最多 ${MAX_TOP_LINKS} 个`);
                                        return d;
                                      }
                                      return { ...d, tops: toggleTop(d.tops, key, v) };
                                    });
                                  },
                                  onEdit: () => openEditLink(g, key),
                                  onDelete: () => deleteLink(g, key),
                                  onMove: () => openMove(key),
                                }}
                              />
                            );
                          })}
                        </div>
                        {keys.length === 0 && (
                          <div style={{ color: 'var(--ant-color-text-tertiary)', fontSize: 13 }}>
                            该分组暂无链接（可拖入其他分组的卡片）
                          </div>
                        )}
                      </GroupDropZone>
                    </div>
                  </SortableContext>
                </Card>
              </SortableGroupRow>
            );
          })}
        </SortableContext>
      </DndContext>
        </>
      )}

      <Modal
        title={editingKey ? '编辑链接' : '添加链接'}
        open={linkModalOpen}
        onOk={submitLink}
        onCancel={() => setLinkModalOpen(false)}
        destroyOnClose
        width={580}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="显示名称" />
          </Form.Item>
          <Form.Item name="desc" label="描述">
            <Input.TextArea rows={3} placeholder="简短说明" />
          </Form.Item>
          <Form.Item name="url" label="链接 URL" rules={[{ required: true, message: '请输入 URL' }]}>
            <Input placeholder="https://..." />
          </Form.Item>
          <Form.Item name="icon_url" label="图标 URL（可选）">
            <Input placeholder="https://.../icon.png（优先于下方 icon）" />
          </Form.Item>
          <Form.Item name="icon" label="图标（图标库或路径）">
            <ExternalLinkIconField iconUrl={iconUrlWatch} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="添加分组"
        open={groupModalOpen}
        onOk={addGroup}
        onCancel={() => setGroupModalOpen(false)}
      >
        <Input
          placeholder="分组名称"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onPressEnter={addGroup}
        />
      </Modal>

      <Modal
        title="重命名分组"
        open={renameModalOpen}
        onOk={confirmRename}
        onCancel={() => setRenameModalOpen(false)}
      >
        <Input
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onPressEnter={confirmRename}
        />
      </Modal>

      <Modal
        title="移动到分组"
        open={moveModalOpen}
        onOk={applyMove}
        onCancel={() => setMoveModalOpen(false)}
      >
        <Select
          style={{ width: '100%' }}
          value={moveTargetGroup}
          onChange={setMoveTargetGroup}
          options={data.groups
            .filter((g) => moveKey && findGroupForLinkKey(data, moveKey) !== g)
            .map((x) => ({ label: x, value: x }))}
        />
      </Modal>

      <Modal
        title={`删除分组「${deleteGroupName}」`}
        open={deleteGroupOpen}
        onCancel={() => setDeleteGroupOpen(false)}
        footer={
          <Space wrap>
            <Button onClick={() => setDeleteGroupOpen(false)}>取消</Button>
            <Button
              onClick={() => {
                setData((d) => removeGroup(d, deleteGroupName, false));
                setDeleteGroupOpen(false);
                message.success('已删除分组，链接已合并到第一个分组');
              }}
            >
              仅删分组（链接保留）
            </Button>
            <Button
              type="primary"
              danger
              onClick={() => {
                setData((d) => removeGroup(d, deleteGroupName, true));
                setDeleteGroupOpen(false);
                message.success('已删除分组及链接');
              }}
            >
              删除分组与链接
            </Button>
          </Space>
        }
      >
        <p>「仅删分组」将把该分组内链接移动到列表中的第一个分组；「删除分组与链接」将移除这些链接。</p>
      </Modal>
    </PageContainer>
  );
};

export default AdminExternalLinks;
