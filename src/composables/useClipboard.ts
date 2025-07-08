// クリップボード操作のComposable

import { useClipboard as useVueUseClipboard } from '@vueuse/core'
import { useToastStore } from '../stores'

export function useClipboard() {
  const { copy: vueCopy, copied, isSupported } = useVueUseClipboard()
  const toastStore = useToastStore()

  const copy = async (value: string | number): Promise<boolean> => {
    try {
      await vueCopy(value.toString())
      
      if (copied.value) {
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
    isSupported,
    copy,
    copyWeight
  }
}