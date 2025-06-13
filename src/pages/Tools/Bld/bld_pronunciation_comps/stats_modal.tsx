"use client"

import type React from "react"

import { useMemo, useState } from "react"
import { Modal, Table, Typography, Card, Row, Col, Statistic, Tabs, theme } from "antd"
import type { TabsProps } from "antd"
import { PracticeMode, PracticeRecord } from '@/pages/Tools/Bld/bld_pronunciation_comps/types';

interface StatsModalProps {
  visible: boolean
  records: PracticeRecord[]
  onClose: () => void
}

const { Title } = Typography

const StatsModal: React.FC<StatsModalProps> = ({ visible, records, onClose }) => {
  const { token } = theme.useToken()
  const [activeMode, setActiveMode] = useState<PracticeMode>("pinyinToLetter")

  // Filter records by mode
  const filteredRecords = useMemo(() => {
    return records.filter((record) => record.mode === activeMode || !record.mode)
  }, [records, activeMode])

  // Calculate overall statistics
  const overallStats = useMemo(() => {
    if (filteredRecords.length === 0) {
      return {
        totalCount: 0,
        correctCount: 0,
        accuracy: 0,
        averageTime: 0,
      }
    }

    const correctCount = filteredRecords.filter((record) => record.isCorrect).length
    const totalTime = filteredRecords.reduce((sum, record) => sum + record.timeSpent, 0)

    return {
      totalCount: filteredRecords.length,
      correctCount,
      accuracy: (correctCount / filteredRecords.length) * 100,
      averageTime: totalTime / filteredRecords.length,
    }
  }, [filteredRecords])

  // Calculate statistics by combination
  const combinationStats = useMemo(() => {
    const statsByCombo: Record<
      string,
      {
        total: number
        correct: number
        totalTime: number
      }
    > = {}

    filteredRecords.forEach((record) => {
      if (!statsByCombo[record.combination]) {
        statsByCombo[record.combination] = { total: 0, correct: 0, totalTime: 0 }
      }

      statsByCombo[record.combination].total += 1
      if (record.isCorrect) {
        statsByCombo[record.combination].correct += 1
      }
      statsByCombo[record.combination].totalTime += record.timeSpent
    })

    return Object.entries(statsByCombo).map(([combination, stats]) => ({
      combination,
      total: stats.total,
      correct: stats.correct,
      accuracy: (stats.correct / stats.total) * 100,
      averageTime: stats.totalTime / stats.total,
    }))
  }, [filteredRecords])

  // Recent records columns
  const recentColumns = [
    {
      title: "组合",
      dataIndex: "combination",
      key: "combination",
    },
    {
      title: "预期输入",
      dataIndex: "expected",
      key: "expected",
    },
    {
      title: "实际输入",
      dataIndex: "input",
      key: "input",
    },
    {
      title: "结果",
      dataIndex: "isCorrect",
      key: "isCorrect",
      render: (isCorrect: boolean) => (
        <span style={{ color: isCorrect ? "#52c41a" : "#f5222d" }}>{isCorrect ? "正确" : "错误"}</span>
      ),
    },
    {
      title: "用时(秒)",
      dataIndex: "timeSpent",
      key: "timeSpent",
      render: (time: number) => time.toFixed(2),
    },
  ]

  // Combination statistics columns
  const combinationColumns = [
    {
      title: "组合",
      dataIndex: "combination",
      key: "combination",
    },
    {
      title: "总次数",
      dataIndex: "total",
      key: "total",
    },
    {
      title: "正确次数",
      dataIndex: "correct",
      key: "correct",
    },
    {
      title: "正确率",
      dataIndex: "accuracy",
      key: "accuracy",
      render: (accuracy: number) => `${accuracy.toFixed(2)}%`,
      sorter: (a: any, b: any) => a.accuracy - b.accuracy,
    },
    {
      title: "平均用时(秒)",
      dataIndex: "averageTime",
      key: "averageTime",
      render: (time: number) => time.toFixed(2),
      sorter: (a: any, b: any) => a.averageTime - b.averageTime,
    },
  ]

  // Tab items for different modes
  const items: TabsProps["items"] = [
    {
      key: "pinyinToLetter",
      label: "拼音→字母",
      children: <></>,
    },
    {
      key: "letterToPinyin",
      label: "字母→拼音",
      children: <></>,
    },
  ]

  return (
    <Modal title="练习统计" open={visible} onCancel={onClose} footer={null} width={800}>
      <Tabs activeKey={activeMode} onChange={(key) => setActiveMode(key as PracticeMode)} items={items} />

      <div style={{ marginBottom: "20px" }}>
        <Title level={4}>总体统计</Title>
        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="总练习次数" value={overallStats.totalCount} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="正确次数" value={overallStats.correctCount} valueStyle={{ color: "#52c41a" }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic
                title="正确率"
                value={overallStats.accuracy}
                precision={2}
                suffix="%"
                valueStyle={{ color: overallStats.accuracy >= 80 ? "#52c41a" : "#f5222d" }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="平均用时" value={overallStats.averageTime} precision={2} suffix="秒" />
            </Card>
          </Col>
        </Row>
      </div>

      <div style={{ marginBottom: "20px" }}>
        <Title level={4}>组合统计</Title>
        <Table
          dataSource={combinationStats}
          columns={combinationColumns}
          rowKey="combination"
          pagination={{ pageSize: 5 }}
          size="small"
        />
      </div>

      <div>
        <Title level={4}>最近记录</Title>
        <Table
          dataSource={filteredRecords.slice().reverse().slice(0, 10)}
          columns={recentColumns}
          rowKey="timestamp"
          pagination={false}
          size="small"
        />
      </div>
    </Modal>
  )
}

export default StatsModal
