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
 * 一意のIDを生成
 */
export function generateUniqueId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}