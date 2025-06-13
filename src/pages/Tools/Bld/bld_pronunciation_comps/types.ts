export interface PinyinConfig {
  firstLetters: Record<string, string>
  secondLetters: Record<string, string>
}

export interface PracticeRecord {
  combination: string
  expected: string
  input: string
  isCorrect: boolean
  timeSpent: number // in seconds
  timestamp: string
  mode: PracticeMode // Added mode tracking
}

export type PracticeMode = "pinyinToLetter" | "letterToPinyin"
