// クリップボード操作のユーティリティ

/**
 * クリップボードに値をコピー
 */
export async function copyToClipboard(value: string | number): Promise<boolean> {
  const textValue = value.toString()
  
  try {
    // モダンブラウザのClipboard APIを使用
    await navigator.clipboard.writeText(textValue)
    return true
  } catch (err) {
    console.warn('Clipboard API failed, trying fallback method:', err)
    
    // フォールバック方法
    try {
      const textArea = document.createElement('textarea')
      textArea.value = textValue
      textArea.style.position = 'fixed'
      textArea.style.left = '-9999px'
      textArea.style.top = '0'
      textArea.style.opacity = '0'
      textArea.style.pointerEvents = 'none'
      
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      const successful = document.execCommand('copy')
      document.body.removeChild(textArea)
      
      return successful
    } catch (fallbackErr) {
      console.error('Fallback clipboard copy failed:', fallbackErr)
      return false
    }
  }
}

/**
 * クリップボードから値を読み取り
 */
export async function readFromClipboard(): Promise<string | null> {
  try {
    const text = await navigator.clipboard.readText()
    return text
  } catch (err) {
    console.warn('Clipboard read failed:', err)
    return null
  }
}

/**
 * クリップボードAPIが利用可能かチェック
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard && navigator.clipboard.writeText)
}

/**
 * セキュアコンテキストかどうかをチェック
 */
export function isSecureContext(): boolean {
  return window.isSecureContext || location.protocol === 'https:'
}