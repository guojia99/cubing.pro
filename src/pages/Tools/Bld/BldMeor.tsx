import { BarChartOutlined, DatabaseOutlined, UploadOutlined } from '@ant-design/icons';
import { Button, Card, Input, List, Modal, Tabs, Upload, message } from 'antd';
import TextArea from 'antd/es/input/TextArea';
import 'chart.js/auto';
import Cookies from 'js-cookie';
import React, { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';

interface WordStats {
  count: number;
  success: number;
  failure: number;
  pass: number;
}

interface Stats {
  [word: string]: WordStats;
}

interface HistoryEntry {
  word: string;
  result: 'success' | 'failure' | 'pass';
}

const BldMemoryTest: React.FC = () => {
  const [dataset, setDataset] = useState<Set<string>>(new Set());
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isDatasetModalVisible, setIsDatasetModalVisible] = useState(false);
  const [isStatsModalVisible, setIsStatsModalVisible] = useState(false);
  const [isInputMode, setIsInputMode] = useState(true);
  const [tempDataset, setTempDataset] = useState<string>('');

  const pickRandomWord = () => {
    const words = Array.from(dataset);
    if (words.length === 0) return;
    const randomWord = words[Math.floor(Math.random() * words.length)];
    setCurrentWord(randomWord);
  };

  const handleResult = (result: 'success' | 'failure' | 'pass') => {
    if (!currentWord) return;
    setStats((prev) => {
      const newStats = { ...prev };
      if (!newStats[currentWord]) {
        newStats[currentWord] = { count: 0, success: 0, failure: 0, pass: 0 };
      }
      newStats[currentWord][result] += 1;
      newStats[currentWord].count += 1;
      Cookies.set(
        'memoryTestData',
        JSON.stringify({ dataset: Array.from(dataset), stats: newStats }),
        { expires: 7 },
      );
      return newStats;
    });
    setHistory((prev) => [{ word: currentWord, result }, ...prev.slice(0, 9)]);
    pickRandomWord();
  };

  const handleImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target) return;
      try {
        const importedData = JSON.parse(e.target.result as string) as {
          dataset: string[];
          stats: Stats;
        };
        setDataset(new Set(importedData.dataset));
        setStats(importedData.stats);
        Cookies.set('memoryTestData', JSON.stringify(importedData), { expires: 7 });
        message.success('数据导入成功！').then();
      } catch {
        message.error('文件格式错误').then();
      }
    };
    reader.readAsText(file);
    return false;
  };

  const handleExport = () => {
    const dataStr = JSON.stringify({ dataset: Array.from(dataset), stats });
    const blob = new Blob([dataStr], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'memory_test_data.json';
    link.click();
  };

  useEffect(() => {
    const savedData = Cookies.get('memoryTestData');
    if (savedData) {
      const parsedData = JSON.parse(savedData) as { dataset: string[]; stats: Stats };
      setDataset(new Set(parsedData.dataset));
      setStats(parsedData.stats);
    }
  }, []);

  useEffect(() => {
    if (dataset.size > 0) pickRandomWord();
  }, [dataset]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isDatasetModalVisible) return;

      const keyActionMap: Record<string, () => void> = {
        ' ': () => handleResult('success'),
        Enter: () => handleResult('failure'),
        Escape: () => handleResult('pass'),
      };

      if (keyActionMap[e.key]) {
        e.preventDefault();
        keyActionMap[e.key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentWord]);

  const getFailureRateData = (count: number) => {
    let sortedWords = Object.entries(stats).sort((a, b) => {
      const failureA = a[1].failure;
      const failureB = b[1].failure;
      if (failureA !== failureB) {
        return failureB - failureA;
      }
      return a[1].success - b[1].success;
    });

    if (count !== 0) {
      sortedWords = sortedWords.slice(0, count);
    }

    return {
      labels: sortedWords.map(([word]) => word),
      datasets: [
        // {
        //   label: '失败率',
        //   data: sortedWords.map(([, data]) => (data.failure / data.count) * 100), // 转换为百分比
        //   backgroundColor: 'rgba(255, 99, 132, 0.2)',
        //   borderColor: 'rgba(255, 99, 132, 1)',
        //   borderWidth: 1,
        // },
        {
          label: '失败次数',
          data: sortedWords.map(([, data]) => data.failure),
          backgroundColor: 'rgb(107,215,231)',
          borderColor: 'rgb(107,215,231)',
          borderWidth: 1,
        },
        {
          label: '成功次数',
          data: sortedWords.map(([, data]) => data.success),
          backgroundColor: 'rgb(79,250,79)',
          borderColor: 'rgb(79,250,79)',
          borderWidth: 1,
        },
      ],
    };
  };

  return (
    <div style={{ margin: 'auto', textAlign: 'center', padding: 20 }}>
      <Card
        title={'记忆练习工具'}
        style={{ marginBottom: 20 }}
        extra={
          <div>
            <Button icon={<DatabaseOutlined />} onClick={() => setIsDatasetModalVisible(true)}>
              数据
            </Button>
            <Button
              icon={<BarChartOutlined />}
              onClick={() => setIsStatsModalVisible(true)}
              style={{ marginLeft: 10 }}
            >
              统计
            </Button>
          </div>
        }
      >
        {currentWord && <div style={{ fontSize: 48, padding: 40 }}>{currentWord}</div>}
        <div style={{ marginTop: 20 }}>
          <Button onClick={() => handleResult('success')} type="primary">
            成功 (空格)
          </Button>
          <Button
            onClick={() => handleResult('failure')}
            type="primary"
            danger
            style={{ marginLeft: 10 }}
          >
            失败 (回车)
          </Button>
          <Button onClick={() => handleResult('pass')} style={{ marginLeft: 10 }}>
            跳过 (ESC)
          </Button>
        </div>
        <div style={{ marginTop: 20, fontSize: 12, color: '#666' }}>
          当前: 数据集长度 {dataset.size} 个词
        </div>
      </Card>

      <Modal
        title="数据"
        open={isDatasetModalVisible}
        onCancel={() => setIsDatasetModalVisible(false)}
        footer={null}
      >
        {/* 切换按钮 */}
        <div style={{ marginBottom: 10 }}>
          <Button type={isInputMode ? 'primary' : 'default'} onClick={() => setIsInputMode(true)}>
            输入模式
          </Button>
          <Button
            type={!isInputMode ? 'primary' : 'default'}
            onClick={() => setIsInputMode(false)}
            style={{ marginLeft: 10 }}
          >
            展示模式
          </Button>
        </div>

        {/* 输入模式 */}
        {isInputMode && (
          <>
            <TextArea
              rows={10}
              placeholder="输入单词，每行一个，或用逗号、空格分隔"
              value={tempDataset}
              onChange={(e) => {
                setTempDataset(e.target.value);
              }} // 仅更新临时状态
            />
            <Button
              type="primary"
              style={{ marginTop: 10, float: 'right' }}
              onClick={() => {
                const words = new Set(tempDataset.split(/\s|,|\n/).filter(Boolean));
                setDataset(words); // 确认后更新数据集
                message.success('数据集已更新！').then();
              }}
            >
              确认
            </Button>
          </>
        )}

        {/* 展示模式 */}
        {!isInputMode && (
          <Input.TextArea rows={10} value={Array.from(dataset).join('\n')} readOnly />
        )}

        <div style={{ marginTop: 40 }}>
          <Upload beforeUpload={handleImport} showUploadList={false}>
            <Button icon={<UploadOutlined />}>导入数据</Button>
          </Upload>
          <Button onClick={handleExport} style={{ marginLeft: 10 }}>
            导出数据
          </Button>
          <Button
            danger
            style={{ marginLeft: 10 }}
            onClick={() => {
              setDataset(new Set());
              setStats({});
              Cookies.remove('memoryTestData');
              message.success('数据已清空！');
            }}
          >
            清空数据
          </Button>
        </div>
      </Modal>
      <Modal
        title="统计"
        open={isStatsModalVisible}
        onCancel={() => setIsStatsModalVisible(false)}
        footer={null}
        width="80%"
        style={{ maxHeight: '75vh', height: '75vh', top: '20px' }}
      >
        <Tabs>
          <Tabs.TabPane tab="排序(10)" key="10">
            <Bar data={getFailureRateData(10)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="排序(20)" key="20">
            <Bar data={getFailureRateData(20)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="排序(50)" key="50">
            <Bar data={getFailureRateData(50)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="排序(100)" key="100">
            <Bar data={getFailureRateData(100)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="排序(全部)" key="all">
            <Bar data={getFailureRateData(0)} />
          </Tabs.TabPane>
          <Tabs.TabPane tab="最近" key="history">
            <List
              dataSource={history}
              renderItem={(item) => (
                <List.Item>
                  {item.word} - {item.result}
                </List.Item>
              )}
            />
          </Tabs.TabPane>
        </Tabs>
      </Modal>
    </div>
  );
};

export default BldMemoryTest;


/*
RA: R D' R':[U',R' D R]   // R D' R' U' R' D R U R' D' R2 D R'
RD: R D' R':[U2,R' D R]   // R D' R' U2 R' D R U2 R' D' R2 D R'

//CE	R' F R:[S',R U' R']
//CF	U:[S',R U' R']
//CG	R2 U R U R' ....
//CH	[S,R' F R]
//DE	U' M U:[M',U2]
//DF	U': [S,R' F R]
//DG	[r U' r',S']
//DH	M U:[M',U2]
//EG	R2 U':[S,R2]
//EH	U M U:[M',U2]
//FG	R':[U' R U,M]
//FH	R:[M',U R' U']

A:
B:
C:       J  M  KP  RS  X
D:
E:          M   P
F:     G     N KPQ RST  Y
G:       F
H:         W   KPQ RST XYZ
J:   C     W N K Q RST
W:     D    HJ
M:   C  E   HJ
N:      EF  HJ
K:   C   F G J
P:  BC  EF  HJ
Q: ABC DEF GHJ
R: ABC DEF GHJ
S: ABC DEF GHJ
T: ABC DEF GHJ
X: ABC DEF GHJ
Y: ABC DEF GHJ
Z: ABC DEF GHJ
* */

