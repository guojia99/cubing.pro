"use client";

import { Modal, Table, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";

import { CubesCn } from "@/components/CubeIcon/cube";
import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import { PlayerLink } from "@/components/Link/GcLinks";
import { WCALinkWithCnName } from "@/components/Link/WcaLinks";
import type { KinChSorResult } from "@/services/cubing-pro/statistics/typings";

const { Text } = Typography;

export const getScoreColor = (score: number) => {
  if (score <= 0) return "#ccc";
  const normalizedScore = Math.min(100, Math.max(0, score));
  const red = Math.round(180 * (normalizedScore / 100));
  const green = Math.round(150 * (1 - normalizedScore / 100));
  const blue = Math.round(50 * (1 - normalizedScore / 100));
  return `rgb(${red}, ${green}, ${blue})`;
};

type DetailRow = {
  key: number;
  event: string;
  eventResult: number;
  bestResultString: string;
};

type KinchPlayerDetailModalProps = {
  visible: boolean;
  onCancel: () => void;
  player: KinChSorResult;
  isSenior: boolean;
};

export function KinchPlayerDetailModal({
  visible,
  onCancel,
  player,
  isSenior,
}: KinchPlayerDetailModalProps) {
  const tableData: DetailRow[] = player.Results.map((result, index) => ({
    key: index,
    event: result.Event,
    eventResult: result.Result,
    bestResultString: result.ResultString || "-",
  }));

  const columns: ColumnsType<DetailRow> = [
    {
      title: "项目",
      dataIndex: "event",
      key: "event",
      align: "center",
      render: (event: string) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          {CubeIcon(event, `${event}_detail`, {})}
          <span style={{ marginLeft: 8 }}>{CubesCn(event)}</span>
        </div>
      ),
    },
    {
      title: "项目分数",
      dataIndex: "eventResult",
      key: "eventResult",
      align: "center",
      render: (score: number) => (
        <Text style={{ color: getScoreColor(score), fontWeight: score > 0 ? "bold" : "normal" }}>
          {score > 0 ? score.toFixed(2) : "-"}
        </Text>
      ),
    },
    {
      title: "项目详细成绩",
      align: "center",
      dataIndex: "bestResultString",
      key: "bestResultString",
      render: (result: string) => <strong>{result}</strong>,
    },
  ];

  return (
    <Modal
      title={
        <div style={{ textAlign: "center" }}>
          {isSenior ? (
            WCALinkWithCnName(player.wca_id, player.WcaName)
          ) : (
            <>{PlayerLink(player.CubeId, player.PlayerName, "rgb(29,177,236)")}</>
          )}
          <div style={{ marginTop: 8, fontSize: "16px", color: "#f23f3f" }}>
            总分: <strong>{player.Result.toFixed(3)}</strong>
          </div>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      centered
    >
      <Table
        columns={columns}
        dataSource={tableData}
        pagination={false}
        size="small"
        rowKey="key"
        style={{ marginTop: 16 }}
      />
    </Modal>
  );
}
