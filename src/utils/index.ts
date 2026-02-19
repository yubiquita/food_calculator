// ユーティリティ関数

/**
 * 重量を整数表示でフォーマット
 */
export function formatWeight(weight: number): string {
  return `${Math.round(weight)}g`
}

/**
 * 現在の時刻を日本語形式（月/日 時:分）で取得
 */
export function getCurrentTimeString(): string {
  const now = new Date()
  const month = now.getMonth() + 1
  const date = now.getDate()
  const hours = now.getHours().toString().padStart(2, '0')
  const minutes = now.getMinutes().toString().padStart(2, '0')
  return `${month}/${date} ${hours}:${minutes}`
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
  // 最新のブラウザではcrypto.randomUUID()を使用
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  
  // フォールバック実装（より強力なランダム性）
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // 最後のフォールバック
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}