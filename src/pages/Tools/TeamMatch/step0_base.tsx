import { Card, Input } from "antd";
import React from "react";

interface BaseProps {
  name: string;
  setName: (s: string) => void;
}

const Base: React.FC<BaseProps> = ({ name, setName }) => {
  return (
    <Card
      style={{
        width: 500, // 增大卡片宽度
        padding: 24, // 增大内边距
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)", // 增强阴影效果
        borderRadius: 8, // 使边角更圆润
      }}
      title="输入本次比赛名称"
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="输入比赛名称..."
        allowClear
        size="large" // 让输入框更大
      />
    </Card>
  );
};

export default Base;
