// ユーティリティ関数

/**
 * 重量を整数表示でフォーマット
 */
export function formatWeight(weight: number): string {
  return `${Math.round(weight)}g`
}

/**
 * 現在の時刻を日本語形式で取得
 */
export function getCurrentTimeString(): string {
  return new Date().toLocaleTimeString('ja-JP', { 
    hour: '2-digit', 
    minute: '2-digit' 
  })
}

/**
 * 安全な数値変換
 */
export function safeParseFloat(value: string | number): number {
  const parsed = parseFloat(value.toString())
  return isNaN(parsed) ? 0 : parsed
}

/**
 * 安全な整数変換
 */
export function safeParseInt(value: string | number): number {
  const parsed = parseInt(value.toString(), 10)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * 一意のIDを生成
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 深いコピーを作成
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as unknown as T
  if (typeof obj === 'object') {
    const cloned = {} as T
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
  return obj
}

/**
 * 配列から最後の要素を安全に取得
 */
export function getLastItem<T>(array: T[]): T | undefined {
  return array.length > 0 ? array[array.length - 1] : undefined
}

/**
 * 配列が空かどうかを判定
 */
export function isEmpty<T>(array: T[]): boolean {
  return array.length === 0
}

/**
 * 数値の範囲制限
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

/**
 * 遅延実行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * デバウンス関数
 */
export function debounce<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: number | undefined
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait) as any
  }
}

/**
 * スロットル関数
 */
export function throttle<T extends (...args: any[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let lastTime = 0
  return (...args: Parameters<T>) => {
    const now = Date.now()
    if (now - lastTime >= wait) {
      lastTime = now
      func(...args)
    }
  }
}