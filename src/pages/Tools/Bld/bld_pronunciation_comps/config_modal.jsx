"use client";
import { useState } from "react";
import { Modal, Tabs, Table, Input, Button, message } from "antd";
import { defaultConfig } from '@/pages/Tools/Bld/bld_pronunciation_comps/defalut_configs';
const ConfigModal = ({ visible, config, onClose, onSave }) => {
    const [editingConfig, setEditingConfig] = useState(config);
    // Reset to default configuration
    const resetToDefault = () => {
        setEditingConfig(defaultConfig);
        message.success("已重置为默认配置").then();
    };
    // Handle first letter mapping change
    const handleFirstLetterChange = (key, value) => {
        setEditingConfig((prev) => ({
            ...prev,
            firstLetters: {
                ...prev.firstLetters,
                [key]: value,
            },
        }));
    };
    // Handle second letter mapping change
    const handleSecondLetterChange = (key, value) => {
        setEditingConfig((prev) => ({
            ...prev,
            secondLetters: {
                ...prev.secondLetters,
                [key]: value,
            },
        }));
    };
    // Save configuration
    const handleSave = () => {
        onSave(editingConfig);
        onClose();
        message.success("配置已保存").then();
    };
    // First letter mapping columns
    const firstLetterColumns = [
        {
            title: "字母",
            dataIndex: "key",
            key: "key",
            width: "40%",
        },
        {
            title: "映射",
            dataIndex: "value",
            key: "value",
            width: "60%",
            render: (_, record) => (<Input value={record.value} onChange={(e) => handleFirstLetterChange(record.key, e.target.value)}/>),
        },
    ];
    // Second letter mapping columns
    const secondLetterColumns = [
        {
            title: "字母",
            dataIndex: "key",
            key: "key",
            width: "40%",
        },
        {
            title: "映射",
            dataIndex: "value",
            key: "value",
            width: "60%",
            render: (_, record) => (<Input value={record.value} onChange={(e) => handleSecondLetterChange(record.key, e.target.value)}/>),
        },
    ];
    // Convert mapping objects to array for Table
    const firstLetterData = Object.entries(editingConfig.firstLetters).map(([key, value]) => ({
        key,
        value,
    }));
    const secondLetterData = Object.entries(editingConfig.secondLetters).map(([key, value]) => ({
        key,
        value,
    }));
    // Tab items
    const items = [
        {
            key: "1",
            label: "首字母映射",
            children: (<Table dataSource={firstLetterData} columns={firstLetterColumns} pagination={false} rowKey="key" size="small" scroll={{ y: 400 }}/>),
        },
        {
            key: "2",
            label: "次字母映射",
            children: (<Table dataSource={secondLetterData} columns={secondLetterColumns} pagination={false} rowKey="key" size="small" scroll={{ y: 400 }}/>),
        },
    ];
    return (<Modal title="配置映射" open={visible} onCancel={onClose} width={600} footer={[
            <Button key="reset" onClick={resetToDefault}>
          重置默认
        </Button>,
            <Button key="cancel" onClick={onClose}>
          取消
        </Button>,
            <Button key="save" type="primary" onClick={handleSave}>
          保存
        </Button>,
        ]}>
      <Tabs defaultActiveKey="1" items={items}/>
    </Modal>);
};
export default ConfigModal;
//# sourceMappingURL=config_modal.jsx.map