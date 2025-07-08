// 食品計算アプリケーションの型定義

// 操作履歴のタイプ
export type HistoryType = 'add' | 'subtract' | 'calculation' | 'auto_recalculation'

// 操作履歴エントリー
export interface HistoryEntry {
  type: HistoryType
  value: number
  timestamp: string
  sourceName?: string
  multiplier?: number
}

// 計算関係の定義
export interface Calculation {
  sourceId: number
  multiplier: number
}

// 状態スナップショット（Undo用）
export interface StateSnapshot {
  weight: number
  calculation: Calculation | null
}

// 食品オブジェクト
export interface Food {
  id: number
  name: string
  weight: number
  calculation: Calculation | null
  history: HistoryEntry[]
  stateHistory: StateSnapshot[]
}

// 食器プリセット
export interface Dish {
  name: string
  weight: number
}

// アプリケーションの状態
export interface AppState {
  foods: Food[]
  dishes: Dish[]
  nextId: number
  theme: 'light' | 'dark'
}

// LocalStorage保存用のデータ形式
export interface SavedData {
  foods: Food[]
  dishes: Dish[]
  nextId: number
  theme: 'light' | 'dark'
}

// トースト通知の種類
export type ToastType = 'warning' | 'error' | 'success' | 'info'

// トースト通知の定義
export interface ToastNotification {
  id: string
  message: string
  type: ToastType
  duration?: number
}


// スワイプイベントの状態
export interface SwipeState {
  startX: number
  currentX: number
  startTime: number
  isDragging: boolean
  hasMoved: boolean
  threshold: number
}


// 循環参照検出の結果
export interface CircularReferenceResult {
  hasCircularReference: boolean
  path?: number[]
}