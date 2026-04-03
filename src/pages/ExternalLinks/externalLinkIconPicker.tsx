import { CubeIcon } from '@/components/CubeIcon/cube_icon';
import { CubesAttributesList } from '@/components/CubeIcon/cube_map';
import {
  OTHER_LINK_ANTD_ICON_ENTRIES,
  OTHER_LINK_FC_ICON_ENTRIES,
  OTHER_LINK_GI_ICON_ENTRIES,
} from '@/pages/ExternalLinks/externalLinkIconRegistry';
import type { ExternalLinkIconEntry } from '@/pages/ExternalLinks/externalLinkIconTypes';
import {
  ANTD_ICON_PREFIX,
  CUBE_ICON_PREFIX,
  FC_ICON_PREFIX,
  GI_ICON_PREFIX,
  LETTER_ICON_PREFIX,
} from '@/pages/ExternalLinks/utils';
import { SearchOutlined } from '@ant-design/icons';
import { Button, Input, Modal, Space, Tabs } from 'antd';
import classNames from 'classnames';
import React, { useMemo, useState } from 'react';
import './externalLinkIconPicker.less';

export type ExternalLinkIconPickerProps = {
  open: boolean;
  title?: string;
  value: string | undefined;
  onCancel: () => void;
  onConfirm: (iconValue: string) => void;
};

function normIcon(v: string | undefined): string {
  return (v ?? '').trim();
}

const LETTER_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

function tabKeyForIcon(icon: string | undefined): string {
  const t = normIcon(icon);
  if (t.startsWith(FC_ICON_PREFIX)) return 'fc';
  if (t.startsWith(GI_ICON_PREFIX)) return 'gi';
  if (t.startsWith(CUBE_ICON_PREFIX)) return 'cube';
  if (t.startsWith(LETTER_ICON_PREFIX)) return 'letter';
  if (t.startsWith(ANTD_ICON_PREFIX)) return 'antd';
  return 'antd';
}

function filterEntries(entries: ExternalLinkIconEntry[], q: string): ExternalLinkIconEntry[] {
  const s = q.trim().toLowerCase();
  if (!s) return entries;
  return entries.filter(
    (e) =>
      e.name.toLowerCase().includes(s) ||
      e.label.includes(q.trim()) ||
      e.label.toLowerCase().includes(s),
  );
}

const IconGrid: React.FC<{
  entries: ExternalLinkIconEntry[];
  selectedValue: string | undefined;
  buildValue: (e: ExternalLinkIconEntry) => string;
  onPick: (v: string) => void;
}> = ({ entries, selectedValue, buildValue, onPick }) => {
  if (entries.length === 0) {
    return <div className="external-link-icon-picker__empty">无匹配图标，请换个关键词</div>;
  }
  return (
  <div className="external-link-icon-picker__grid">
    {entries.map((e) => {
      const v = buildValue(e);
      const sel = normIcon(selectedValue) === normIcon(v);
      return (
        <button
          key={v}
          type="button"
          aria-pressed={sel}
          className={classNames('external-link-icon-picker__cell', sel && 'external-link-icon-picker__cell--selected')}
          onClick={() => onPick(v)}
          title={`${e.label} (${e.name})`}
        >
          <span className="external-link-icon-picker__cellIcon">
            <e.Icon />
          </span>
          <span className="external-link-icon-picker__cellLabel">{e.label}</span>
        </button>
      );
    })}
  </div>
  );
};

export const ExternalLinkIconPicker: React.FC<ExternalLinkIconPickerProps> = ({
  open,
  title = '选择图标',
  value,
  onCancel,
  onConfirm,
}) => {
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState<string | undefined>(value);
  const [activeTab, setActiveTab] = useState<string>('antd');

  React.useEffect(() => {
    if (open) {
      setDraft(value);
      setSearch('');
      setActiveTab(tabKeyForIcon(value));
    }
  }, [open, value]);

  const antdFiltered = useMemo(() => filterEntries(OTHER_LINK_ANTD_ICON_ENTRIES, search), [search]);
  const fcFiltered = useMemo(() => filterEntries(OTHER_LINK_FC_ICON_ENTRIES, search), [search]);
  const giFiltered = useMemo(() => filterEntries(OTHER_LINK_GI_ICON_ENTRIES, search), [search]);

  const cubeRows = useMemo(() => {
    const rows = CubesAttributesList.filter((r) => (r.Icon ?? '').trim() !== '');
    const s = search.trim().toLowerCase();
    if (!s) return rows;
    return rows.filter(
      (r) =>
        r.Cn.includes(search.trim()) ||
        String(r.Cubes).toLowerCase().includes(s),
    );
  }, [search]);

  const letterFiltered = useMemo(() => {
    const s = search.trim().toUpperCase();
    if (!s) return LETTER_CHARS;
    if (/字母|LETTER|ABC/i.test(search.trim())) return LETTER_CHARS;
    return LETTER_CHARS.filter((ch) => ch === s || ch.includes(s));
  }, [search]);

  const pickIcon = React.useCallback((v: string) => {
    setDraft(v);
    setActiveTab(tabKeyForIcon(v));
  }, []);

  const tabItems = [
    {
      key: 'antd',
      label: 'Ant Design',
      children: (
        <IconGrid
          entries={antdFiltered}
          selectedValue={draft}
          buildValue={(e) => `${ANTD_ICON_PREFIX}${e.name}`}
          onPick={pickIcon}
        />
      ),
    },
    {
      key: 'fc',
      label: 'Flat Color',
      children: (
        <IconGrid
          entries={fcFiltered}
          selectedValue={draft}
          buildValue={(e) => `${FC_ICON_PREFIX}${e.name}`}
          onPick={pickIcon}
        />
      ),
    },
    {
      key: 'gi',
      label: 'Game Icons',
      children: (
        <IconGrid
          entries={giFiltered}
          selectedValue={draft}
          buildValue={(e) => `${GI_ICON_PREFIX}${e.name}`}
          onPick={pickIcon}
        />
      ),
    },
    {
      key: 'cube',
      label: '魔方项目',
      children:
        cubeRows.length === 0 ? (
          <div className="external-link-icon-picker__empty">无匹配项目，请换个关键词</div>
        ) : (
        <div className="external-link-icon-picker__grid external-link-icon-picker__grid--cube">
          {cubeRows.map((row) => {
            const v = `${CUBE_ICON_PREFIX}${String(row.Cubes)}`;
            const sel = normIcon(draft) === normIcon(v);
            return (
              <button
                key={v}
                type="button"
                aria-pressed={sel}
                className={classNames(
                  'external-link-icon-picker__cell',
                  sel && 'external-link-icon-picker__cell--selected',
                )}
                onClick={() => pickIcon(v)}
                title={row.Cn}
              >
                <span className="external-link-icon-picker__cellIcon external-link-icon-picker__cellIcon--cube">
                  {CubeIcon(row.Cubes, `pick-${row.Cubes}`, {
                    fontSize: 28,
                    lineHeight: 1,
                  })}
                </span>
                <span className="external-link-icon-picker__cellLabel">{row.Cn}</span>
              </button>
            );
          })}
        </div>
        ),
    },
    {
      key: 'letter',
      label: '字母',
      children:
        letterFiltered.length === 0 ? (
          <div className="external-link-icon-picker__empty">无匹配字母</div>
        ) : (
          <div className="external-link-icon-picker__grid external-link-icon-picker__grid--letters">
            {letterFiltered.map((ch) => {
              const v = `${LETTER_ICON_PREFIX}${ch}`;
              const sel = normIcon(draft) === normIcon(v);
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={sel}
                  className={classNames(
                    'external-link-icon-picker__cell',
                    sel && 'external-link-icon-picker__cell--selected',
                  )}
                  onClick={() => pickIcon(v)}
                  title={`字母 ${ch}`}
                >
                  <span className="external-link-icon-picker__cellIcon external-link-icon-picker__cellIcon--letter">
                    {ch}
                  </span>
                  <span className="external-link-icon-picker__cellLabel">{ch}</span>
                </button>
              );
            })}
          </div>
        ),
    },
  ];

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={760}
      destroyOnClose
      footer={
        <Space wrap>
          <Button onClick={onCancel}>取消</Button>
          <Button onClick={() => onConfirm('')}>清除图标</Button>
          <Button type="primary" onClick={() => onConfirm(draft ?? '')}>
            确定
          </Button>
        </Space>
      }
    >
      <div className="external-link-icon-picker">
        <Input
          allowClear
          placeholder="搜索名称或英文名…"
          prefix={<SearchOutlined />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
        <Tabs
          activeKey={activeTab}
          onChange={(k) => setActiveTab(k)}
          items={tabItems}
          size="small"
        />
      </div>
    </Modal>
  );
};
