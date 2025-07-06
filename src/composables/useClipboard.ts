// クリップボード操作のComposable

import { ref, readonly } from 'vue'
import { copyToClipboard, isClipboardSupported } from '../utils/clipboard'
import { useToastStore } from '../stores'

export function useClipboard() {
  const isSupported = ref(isClipboardSupported())
  const toastStore = useToastStore()

  const copy = async (value: string | number): Promise<boolean> => {
    try {
      const success = await copyToClipboard(value)
      
      if (success) {
        // 成功時のフィードバック（Androidの場合は自動的に通知が表示される）
        return true
      } else {
        toastStore.showWarning('クリップボードへのコピーに失敗しました')
        return false
      }
    } catch (error) {
      console.error('Clipboard copy failed:', error)
      toastStore.showError('クリップボード操作でエラーが発生しました')
      return false
    }
  }

  const copyWeight = async (weight: number): Promise<boolean> => {
    const roundedWeight = Math.round(weight)
    return await copy(roundedWeight.toString())
  }

  return {
    isSupported: readonly(isSupported),
    copy,
    copyWeight
  }
}