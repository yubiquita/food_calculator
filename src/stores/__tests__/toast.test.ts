// トーストストアのテスト

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useToastStore } from '../toast'
import { resetStores } from '../../test-utils'

describe('useToastStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetStores()
  })

  describe('基本機能', () => {
    it('初期状態では通知が空', () => {
      const store = useToastStore()
      
      expect(store.toasts).toHaveLength(0)
      expect(store.toastCount).toBe(0)
    })

    it('通知を表示できる', () => {
      const store = useToastStore()
      
      const id = store.showToast('テストメッセージ', 'info')
      
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0]).toMatchObject({
        id,
        message: 'テストメッセージ',
        type: 'info',
        duration: 3000
      })
    })

    it('カスタム継続時間で通知を表示できる', () => {
      const store = useToastStore()
      
      store.showToast('テストメッセージ', 'info', 5000)
      
      expect(store.toasts[0].duration).toBe(5000)
    })

    it('通知を削除できる', () => {
      const store = useToastStore()
      
      const id = store.showToast('テストメッセージ')
      expect(store.toasts).toHaveLength(1)
      
      store.removeToast(id)
      expect(store.toasts).toHaveLength(0)
    })

    it('存在しない通知の削除は無視される', () => {
      const store = useToastStore()
      
      store.showToast('テストメッセージ')
      store.removeToast('nonexistent-id')
      
      expect(store.toasts).toHaveLength(1)
    })

    it('全ての通知を削除できる', () => {
      const store = useToastStore()
      
      store.showToast('メッセージ1')
      store.showToast('メッセージ2')
      expect(store.toasts).toHaveLength(2)
      
      store.clearAllToasts()
      expect(store.toasts).toHaveLength(0)
    })
  })

  describe('通知タイプ別メソッド', () => {
    it('成功通知を表示できる', () => {
      const store = useToastStore()
      
      const id = store.showSuccess('成功メッセージ')
      
      expect(store.toasts[0]).toMatchObject({
        id,
        message: '成功メッセージ',
        type: 'success'
      })
    })

    it('エラー通知を表示できる', () => {
      const store = useToastStore()
      
      const id = store.showError('エラーメッセージ')
      
      expect(store.toasts[0]).toMatchObject({
        id,
        message: 'エラーメッセージ',
        type: 'error'
      })
    })

    it('警告通知を表示できる', () => {
      const store = useToastStore()
      
      const id = store.showWarning('警告メッセージ')
      
      expect(store.toasts[0]).toMatchObject({
        id,
        message: '警告メッセージ',
        type: 'warning'
      })
    })

    it('情報通知を表示できる', () => {
      const store = useToastStore()
      
      const id = store.showInfo('情報メッセージ')
      
      expect(store.toasts[0]).toMatchObject({
        id,
        message: '情報メッセージ',
        type: 'info'
      })
    })
  })

  describe('最大表示数の制御', () => {
    it('最大表示数を超えると古い通知が削除される', () => {
      const store = useToastStore()
      
      // 最大数（3）を超えるまで通知を追加
      const id1 = store.showToast('メッセージ1')
      const id2 = store.showToast('メッセージ2')
      const id3 = store.showToast('メッセージ3')
      const id4 = store.showToast('メッセージ4')
      
      expect(store.toasts).toHaveLength(3)
      expect(store.toasts.map(t => t.id)).not.toContain(id1) // 最古が削除される
      expect(store.toasts.map(t => t.id)).toEqual([id2, id3, id4])
    })

    it('最古の通知を手動で削除できる', () => {
      const store = useToastStore()
      
      store.showToast('メッセージ1')
      const id2 = store.showToast('メッセージ2')
      
      store.removeOldestToast()
      
      expect(store.toasts).toHaveLength(1)
      expect(store.toasts[0].id).toBe(id2)
    })

    it('通知がない状態で最古削除を実行しても問題ない', () => {
      const store = useToastStore()
      
      expect(() => {
        store.removeOldestToast()
      }).not.toThrow()
      
      expect(store.toasts).toHaveLength(0)
    })
  })

  describe('タイプ別操作', () => {
    beforeEach(() => {
      const store = useToastStore()
      store.showSuccess('成功メッセージ')
      store.showError('エラーメッセージ')
      store.showWarning('警告メッセージ')
    })

    it('特定タイプの通知があるかチェックできる', () => {
      const store = useToastStore()
      
      expect(store.hasToastOfType('success')).toBe(true)
      expect(store.hasToastOfType('error')).toBe(true)
      expect(store.hasToastOfType('info')).toBe(false)
    })

    it('特定タイプの通知をすべて削除できる', () => {
      const store = useToastStore()
      
      expect(store.toasts).toHaveLength(3)
      
      store.clearToastsByType('error')
      
      expect(store.toasts).toHaveLength(2)
      expect(store.hasToastOfType('error')).toBe(false)
      expect(store.hasToastOfType('success')).toBe(true)
      expect(store.hasToastOfType('warning')).toBe(true)
    })
  })

  describe('通知の更新', () => {
    it('通知の継続時間を更新できる', () => {
      const store = useToastStore()
      
      const id = store.showToast('テストメッセージ')
      
      store.updateToastDuration(id, 5000)
      
      expect(store.toasts[0].duration).toBe(5000)
    })

    it('存在しない通知の継続時間更新は無視される', () => {
      const store = useToastStore()
      
      store.showToast('テストメッセージ')
      
      expect(() => {
        store.updateToastDuration('nonexistent-id', 5000)
      }).not.toThrow()
    })

    it('通知メッセージを更新できる', () => {
      const store = useToastStore()
      
      const id = store.showToast('元のメッセージ')
      
      store.updateToastMessage(id, '更新されたメッセージ')
      
      expect(store.toasts[0].message).toBe('更新されたメッセージ')
    })

    it('存在しない通知のメッセージ更新は無視される', () => {
      const store = useToastStore()
      
      store.showToast('テストメッセージ')
      
      expect(() => {
        store.updateToastMessage('nonexistent-id', '新しいメッセージ')
      }).not.toThrow()
    })
  })

  describe('重複チェック機能', () => {
    it('重複メッセージを検出できる', () => {
      const store = useToastStore()
      
      store.showToast('重複メッセージ', 'info')
      
      const isDuplicate = store.isDuplicateMessage('重複メッセージ', 'info')
      const isNotDuplicate = store.isDuplicateMessage('異なるメッセージ', 'info')
      const isDifferentType = store.isDuplicateMessage('重複メッセージ', 'error')
      
      expect(isDuplicate).toBe(true)
      expect(isNotDuplicate).toBe(false)
      expect(isDifferentType).toBe(false)
    })

    it('重複を避けて通知を表示できる', () => {
      const store = useToastStore()
      
      const id1 = store.showToast('重複メッセージ', 'info')
      const id2 = store.showToastIfNotDuplicate('重複メッセージ', 'info')
      const id3 = store.showToastIfNotDuplicate('異なるメッセージ', 'info')
      
      expect(id1).toBeTruthy()
      expect(id2).toBeNull()
      expect(id3).toBeTruthy()
      expect(store.toasts).toHaveLength(2)
    })
  })

  describe('優先度通知', () => {
    it('優先度の高い通知を先頭に表示できる', () => {
      const store = useToastStore()
      
      const id1 = store.showToast('通常メッセージ')
      const id2 = store.showPriorityToast('優先メッセージ')
      
      expect(store.toasts).toHaveLength(2)
      expect(store.toasts[0].id).toBe(id2) // 優先度通知が先頭
      expect(store.toasts[1].id).toBe(id1)
    })

    it('優先度通知も最大数制限に従う', () => {
      const store = useToastStore()
      
      // 最大数まで通常通知を追加
      store.showToast('メッセージ1')
      store.showToast('メッセージ2')
      store.showToast('メッセージ3')
      
      // 優先度通知を追加（最古が削除される）
      const priorityId = store.showPriorityToast('優先メッセージ')
      
      expect(store.toasts).toHaveLength(3)
      expect(store.toasts[0].id).toBe(priorityId)
    })
  })

  describe('自動削除タイマー', () => {
    beforeEach(() => {
      vi.useFakeTimers()
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('指定した時間後に通知が自動削除される', () => {
      const store = useToastStore()
      
      store.showToast('テストメッセージ', 'info', 1000)
      expect(store.toasts).toHaveLength(1)
      
      vi.advanceTimersByTime(1000)
      
      expect(store.toasts).toHaveLength(0)
    })

    it('scheduleRemovalメソッドで手動でタイマーを設定できる', () => {
      const store = useToastStore()
      
      const id = store.showToast('テストメッセージ', 'info', 0) // 自動削除なし
      expect(store.toasts).toHaveLength(1)
      
      store.scheduleRemoval(id, 500)
      vi.advanceTimersByTime(500)
      
      expect(store.toasts).toHaveLength(0)
    })
  })

  describe('ゲッター', () => {
    it('visibleToasts が正しく動作する', () => {
      const store = useToastStore()
      
      store.showToast('メッセージ1')
      store.showToast('メッセージ2')
      
      const visibleToasts = store.visibleToasts
      
      expect(visibleToasts).toHaveLength(2)
      expect(visibleToasts).toEqual(store.toasts)
    })

    it('toastCount が正しく計算される', () => {
      const store = useToastStore()
      
      expect(store.toastCount).toBe(0)
      
      store.showToast('メッセージ1')
      expect(store.toastCount).toBe(1)
      
      store.showToast('メッセージ2')
      expect(store.toastCount).toBe(2)
    })
  })
})