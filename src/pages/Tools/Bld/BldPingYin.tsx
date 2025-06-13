import { useState, useEffect, useCallback, useRef } from "react"
import { Button, Input, Space, Typography, message, Radio, Tooltip } from "antd"
import { ConfigProvider } from "antd"
import { QuestionCircleOutlined } from "@ant-design/icons"
import zhCN from "antd/lib/locale/zh_CN"
import ConfigModal from '@/pages/Tools/Bld/bld_pronunciation_comps/config_modal';
import StatsModal from '@/pages/Tools/Bld/bld_pronunciation_comps/stats_modal';
import ShortcutsModal from '@/pages/Tools/Bld/bld_pronunciation_comps/shortcuts_modal';
import { defaultConfig } from '@/pages/Tools/Bld/bld_pronunciation_comps/defalut_configs';
import { applyTone, removeTones } from './bld_pronunciation_comps/tone_utils';
import { PinyinConfig, PracticeMode, PracticeRecord } from '@/pages/Tools/Bld/bld_pronunciation_comps/types';

const { Title, Text } = Typography
const { Group: RadioGroup, Button: RadioButton } = Radio

export default function BldPingYin() {
  const [config, setConfig] = useState<PinyinConfig>(() => {
    if (typeof window !== "undefined") {
      const savedConfig = localStorage.getItem("pinyinConfig")
      return savedConfig ? JSON.parse(savedConfig) : defaultConfig
    }
    return defaultConfig
  })

  const [mode, setMode] = useState<PracticeMode>("pinyinToLetter")
  const [currentFirstLetter, setCurrentFirstLetter] = useState<string>("")
  const [currentSecondLetter, setCurrentSecondLetter] = useState<string>("")
  const [userInput, setUserInput] = useState<string>("")
  const [startTime, setStartTime] = useState<number | null>(null)
  const [isConfigModalVisible, setIsConfigModalVisible] = useState<boolean>(false)
  const [isStatsModalVisible, setIsStatsModalVisible] = useState<boolean>(false)
  const [isShortcutsModalVisible, setIsShortcutsModalVisible] = useState<boolean>(false)
  const [records, setRecords] = useState<PracticeRecord[]>(() => {
    if (typeof window !== "undefined") {
      const savedRecords = localStorage.getItem("pinyinRecords")
      return savedRecords ? JSON.parse(savedRecords) : []
    }
    return []
  })

  // @ts-ignore
  const inputRef = useRef<Input>(null)

  // Generate a new letter combination
  const generateNewCombination = useCallback(() => {
    const firstLetters = Object.keys(config.firstLetters)
    const secondLetters = Object.keys(config.secondLetters)

    const randomFirstLetter = firstLetters[Math.floor(Math.random() * firstLetters.length)]
    const randomSecondLetter = secondLetters[Math.floor(Math.random() * secondLetters.length)]

    setCurrentFirstLetter(randomFirstLetter)
    setCurrentSecondLetter(randomSecondLetter)
    setUserInput("")
    setStartTime(Date.now())

    // Focus the input field
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }, 100)
  }, [config])

  // Check user input
  const checkAnswer = useCallback(() => {
    if (!startTime) return

    let isCorrect = false
    let expectedAnswer = ""
    const userAnswer = userInput.trim()

    if (mode === "pinyinToLetter") {
      expectedAnswer = currentFirstLetter + currentSecondLetter
      isCorrect = userAnswer.toUpperCase() === expectedAnswer.toUpperCase()
    } else {
      // For letterToPinyin mode, we need to compare without tone marks
      expectedAnswer = config.firstLetters[currentFirstLetter] + config.secondLetters[currentSecondLetter]
      isCorrect = removeTones(userAnswer.toLowerCase()) === removeTones(expectedAnswer.toLowerCase())
    }

    const endTime = Date.now()
    const timeSpent = (endTime - startTime) / 1000 // in seconds

    // Only record if time spent is less than 60 seconds
    if (timeSpent < 60) {
      const newRecord: PracticeRecord = {
        combination: currentFirstLetter + currentSecondLetter,
        expected: expectedAnswer,
        input: userAnswer,
        isCorrect,
        timeSpent,
        timestamp: new Date().toISOString(),
        mode,
      }

      const updatedRecords = [...records, newRecord]
      setRecords(updatedRecords)
      localStorage.setItem("pinyinRecords", JSON.stringify(updatedRecords))

      if (isCorrect) {
        message.success("正确!")
      } else {
        message.error(`错误! 正确答案是: ${expectedAnswer}`)
      }
    } else {
      message.warning("超时，不记录此次练习")
    }

    // Always generate a new combination after checking the answer
    generateNewCombination()
  }, [currentFirstLetter, currentSecondLetter, generateNewCombination, mode, records, startTime, userInput, config])

  // Save config to localStorage
  const saveConfig = useCallback(
    (newConfig: PinyinConfig) => {
      setConfig(newConfig)
      localStorage.setItem("pinyinConfig", JSON.stringify(newConfig))
      generateNewCombination()
    },
    [generateNewCombination],
  )

  // Handle mode change
  const handleModeChange = useCallback(
    (e: any) => {
      setMode(e.target.value)
      generateNewCombination()
    },
    [generateNewCombination],
  )

  // Apply tone to the current input
  const applyToneToInput = useCallback(
    (toneNumber: number) => {
      if (mode === "letterToPinyin") {
        setUserInput(applyTone(userInput, toneNumber))
      }
    },
    [mode, userInput],
  )

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent default behavior for function keys
      if (
        e.key.startsWith("F") &&
        Number.parseInt(e.key.substring(1)) >= 1 &&
        Number.parseInt(e.key.substring(1)) <= 5
      ) {
        e.preventDefault()
      }

      if (e.key === "Enter") {
        checkAnswer()
      } else if (e.key === "Escape") {
        generateNewCombination()
      } else if (mode === "letterToPinyin") {
        // Tone shortcuts (F1-F5)
        if (e.key === "F1") {
          applyToneToInput(0) // Remove tone
        } else if (e.key === "F2") {
          applyToneToInput(1) // First tone
        } else if (e.key === "F3") {
          applyToneToInput(2) // Second tone
        } else if (e.key === "F4") {
          applyToneToInput(3) // Third tone
        } else if (e.key === "F5") {
          applyToneToInput(4) // Fourth tone
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [applyToneToInput, checkAnswer, generateNewCombination, mode])

  // Initialize on component mount
  useEffect(() => {
    generateNewCombination()
  }, [generateNewCombination])

  // Get the current display and expected input based on mode
  const getCurrentDisplay = () => {
    if (mode === "pinyinToLetter") {
      return config.firstLetters[currentFirstLetter] + config.secondLetters[currentSecondLetter]
    } else {
      return currentFirstLetter + currentSecondLetter
    }
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#1890ff",
        },
      }}
    >
      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto",
          padding: "20px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <Title level={2} style={{ marginBottom: "20px" }}>
          拼音练习
          <Tooltip title="查看快捷键">
            <QuestionCircleOutlined
              style={{ fontSize: "16px", marginLeft: "10px", cursor: "pointer" }}
              onClick={() => setIsShortcutsModalVisible(true)}
            />
          </Tooltip>
        </Title>

        <div style={{ marginBottom: "20px" }}>
          <RadioGroup value={mode} onChange={handleModeChange} buttonStyle="solid">
            <RadioButton value="pinyinToLetter">拼音→字母</RadioButton>
            <RadioButton value="letterToPinyin">字母→拼音</RadioButton>
          </RadioGroup>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <Title level={3} style={{ marginBottom: "20px" }}>
            {mode === "pinyinToLetter" ? "当前拼音: " : "当前字母组合: "}
            <Text type="danger">{getCurrentDisplay()}</Text>
          </Title>

          <Space direction="vertical" size="large" style={{ width: "300px" }}>
            <Input
              ref={inputRef}
              size="large"
              placeholder={mode === "pinyinToLetter" ? "请输入对应的字母组合" : "请输入对应的拼音"}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onPressEnter={checkAnswer}
              autoFocus
            />

            {mode === "letterToPinyin" && (
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
                <Button onClick={() => applyToneToInput(0)}>无声调</Button>
                <Button onClick={() => applyToneToInput(1)}>第一声 (ˉ)</Button>
                <Button onClick={() => applyToneToInput(2)}>第二声 (ˊ)</Button>
                <Button onClick={() => applyToneToInput(3)}>第三声 (ˇ)</Button>
                <Button onClick={() => applyToneToInput(4)}>第四声 (ˋ)</Button>
              </div>
            )}

            <Button type="primary" size="large" block onClick={checkAnswer}>
              确认
            </Button>

            <Button size="large" block onClick={generateNewCombination}>
              跳过
            </Button>
          </Space>
        </div>

        <div style={{ marginTop: "40px" }}>
          <Space size="large">
            <Button type="default" onClick={() => setIsConfigModalVisible(true)}>
              配置映射
            </Button>

            <Button type="default" onClick={() => setIsStatsModalVisible(true)}>
              查看统计
            </Button>
          </Space>
        </div>

        <ConfigModal
          visible={isConfigModalVisible}
          config={config}
          onClose={() => setIsConfigModalVisible(false)}
          onSave={saveConfig}
        />

        <StatsModal visible={isStatsModalVisible} records={records} onClose={() => setIsStatsModalVisible(false)} />

        <ShortcutsModal
          visible={isShortcutsModalVisible}
          onClose={() => setIsShortcutsModalVisible(false)}
          mode={mode}
        />
      </div>
    </ConfigProvider>
  )
}
