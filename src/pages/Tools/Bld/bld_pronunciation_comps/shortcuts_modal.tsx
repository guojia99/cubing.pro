"use client"

import type React from "react"

import { Modal, Table } from "antd"
import type { ColumnsType } from "antd/es/table"
import { PracticeMode } from '@/pages/Tools/Bld/bld_pronunciation_comps/types';
interface ShortcutsModalProps {
  visible: boolean
  onClose: () => void
  mode: PracticeMode
}

interface ShortcutItem {
  key: string
  shortcut: string
  description: string
}

const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ visible, onClose, mode }) => {
  const columns: ColumnsType<ShortcutItem> = [
    {
      title: "快捷键",
      dataIndex: "shortcut",
      key: "shortcut",
      width: "30%",
      render: (text) => (
        <kbd style={{ padding: "2px 5px", backgroundColor: "#f0f0f0", borderRadius: "3px" }}>{text}</kbd>
      ),
    },
    {
      title: "功能",
      dataIndex: "description",
      key: "description",
    },
  ]

  const commonShortcuts: ShortcutItem[] = [
    {
      key: "1",
      shortcut: "Enter",
      description: "确认答案",
    },
    {
      key: "2",
      shortcut: "Esc",
      description: "跳过当前题目",
    },
  ]

  const toneShortcuts: ShortcutItem[] = [
    {
      key: "3",
      shortcut: "F1",
      description: "无声调",
    },
    {
      key: "4",
      shortcut: "F2",
      description: "第一声 (ˉ)",
    },
    {
      key: "5",
      shortcut: "F3",
      description: "第二声 (ˊ)",
    },
    {
      key: "6",
      shortcut: "F4",
      description: "第三声 (ˇ)",
    },
    {
      key: "7",
      shortcut: "F5",
      description: "第四声 (ˋ)",
    },
  ]

  const dataSource = mode === "letterToPinyin" ? [...commonShortcuts, ...toneShortcuts] : commonShortcuts

  return (
    <Modal title="键盘快捷键" open={visible} onCancel={onClose} footer={null} width={500}>
      <Table columns={columns} dataSource={dataSource} pagination={false} rowKey="key" />
    </Modal>
  )
}

export default ShortcutsModal
