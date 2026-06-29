"use client";

import { BorderOutlined, CheckSquareOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Select, Slider, Space, Tag } from "antd";
import type { SelectProps } from "antd";
import { useEffect, useState } from "react";

import { CubeIcon } from "@/components/CubeIcon/cube_icon";
import {
  CountryAvatar,
  countryIso2ToChinese,
} from "@/views/Wca/PlayerComponents/region/all_contiry";

export const allEvents = [
  "333",
  "222",
  "444",
  "555",
  "666",
  "777",
  "pyram",
  "skewb",
  "minx",
  "sq1",
  "clock",
  "333oh",
  "333bf",
  "333mbf",
  "444bf",
  "555bf",
  "333fm",
];

interface EventSelectorProps {
  events: string[];
  isSenior?: boolean;
  isCountry?: boolean;
  onConfirm: (selectedEvents: string[], age?: number, country?: string[]) => void;
}

export function EventSelector({
  events = [],
  isSenior = false,
  isCountry = false,
  onConfirm,
}: EventSelectorProps) {
  const [selectingEvents, setSelectingEvents] = useState<string[]>([]);
  const [age, setAge] = useState<number>(40);
  const [selectedCountries, setSelectedCountries] = useState<string[]>([]);

  useEffect(() => {
    setSelectingEvents(events);
  }, [events]);

  const presets = new Map<string, string[]>([
    [
      "速拧",
      ["333", "222", "444", "555", "666", "777", "pyram", "skewb", "minx", "sq1", "clock", "333oh"],
    ],
    ["安静", ["333bf", "333mbf", "444bf", "555bf", "333fm"]],
    ["盲拧", ["333bf", "333mbf", "444bf", "555bf"]],
    ["正阶", ["333", "222", "444", "555", "666", "777", "333oh"]],
    ["异型", ["pyram", "skewb", "minx", "sq1", "clock"]],
  ]);

  const handleSelectAll = () => {
    setSelectingEvents([...events]);
  };

  const handleUnselectAll = () => {
    setSelectingEvents([]);
  };

  const handleSetWithPresets = (name: string) => {
    const ps = presets.get(name);
    if (ps) {
      setSelectingEvents([...ps]);
    }
  };

  const handleUpdateTable = () => {
    onConfirm(selectingEvents, age, selectedCountries);
  };

  const placeholderCountryText =
    selectedCountries.length === 0
      ? "全部国家或地区"
      : `${selectedCountries.length} 个国家已选择`;

  const countryOptions: SelectProps["options"] = Object.entries(countryIso2ToChinese).map(
    ([code, name]) => ({
      value: code,
      label: (
        <div style={{ display: "flex", alignItems: "center" }}>
          {CountryAvatar(code)}
          {name} ({code})
        </div>
      ),
    }),
  );

  return (
    <Card style={{ marginBottom: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
          flexWrap: "wrap",
          gap: "10px",
        }}
      >
        <Space wrap>
          <Button
            size="small"
            icon={<CheckSquareOutlined />}
            onClick={handleSelectAll}
            disabled={events.length === 0}
          >
            全选
          </Button>
          <Button
            size="small"
            icon={<BorderOutlined />}
            onClick={handleUnselectAll}
            disabled={events.length === 0}
          >
            取消全选
          </Button>
          {[...presets.keys()].map((presetName) => (
            <Button key={presetName} size="small" onClick={() => handleSetWithPresets(presetName)}>
              {presetName}
            </Button>
          ))}
        </Space>

        <div style={{ fontSize: "14px" }}>
          已选择{" "}
          <Tag color="blue">
            {selectingEvents.length}/{events.length}
          </Tag>{" "}
          个项目
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(72px, 1fr))",
          gap: "10px",
          marginBottom: "20px",
          maxHeight: "300px",
          overflowY: "auto",
          padding: "10px",
          border: "1px solid var(--border-default)",
          borderRadius: "4px",
        }}
      >
        {events.map((event) => (
          <div key={event} style={{ textAlign: "center" }}>
            <Checkbox
              value={event}
              checked={selectingEvents.includes(event)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSelectingEvents([...selectingEvents, event]);
                } else {
                  setSelectingEvents(selectingEvents.filter((item) => item !== event));
                }
              }}
            >
              {CubeIcon(event, `${event}__label`, {})}
            </Checkbox>
          </div>
        ))}
      </div>

      {isSenior && (
        <div style={{ marginBottom: "20px" }}>
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>年龄: {age}岁</div>
          <Slider min={40} max={100} step={10} value={age} onChange={setAge} />
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "12px",
              color: "var(--faint-foreground)",
            }}
          >
            <span>40岁</span>
            <span>100岁</span>
          </div>
        </div>
      )}

      {isCountry && (
        <div style={{ marginBottom: "20px" }}>
          <Select
            mode="multiple"
            style={{ width: "100%", maxWidth: 480, marginBottom: "10px" }}
            placeholder={placeholderCountryText}
            value={selectedCountries}
            onChange={setSelectedCountries}
            options={countryOptions}
            maxTagCount="responsive"
          />
        </div>
      )}

      <Button type="primary" onClick={handleUpdateTable} size="small" style={{ float: "right" }}>
        提交
      </Button>
      <div style={{ clear: "both" }} />
    </Card>
  );
}
