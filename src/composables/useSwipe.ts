// スワイプ操作のComposable

import { ref, readonly, type Ref } from 'vue'
import type { SwipeState } from '../types'

export interface UseSwipeOptions {
  threshold?: number
  timeLimit?: number
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

export function useSwipe(
  element: Ref<HTMLElement | null>,
  options: UseSwipeOptions = {}
) {
  const {
    threshold = 80,
    timeLimit = 500,
    onSwipeLeft,
    onSwipeRight
  } = options

  const swipeState = ref<SwipeState>({
    startX: 0,
    currentX: 0,
    startTime: 0,
    isDragging: false,
    hasMoved: false,
    threshold
  })

  // タッチ開始
  const handleTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    swipeState.value = {
      startX: touch.clientX,
      currentX: touch.clientX,
      startTime: Date.now(),
      isDragging: true,
      hasMoved: false,
      threshold
    }

    // トランジションを無効化
    if (element.value) {
      element.value.style.transition = 'none'
    }
  }

  // タッチ移動
  const handleTouchMove = (e: TouchEvent) => {
    if (!swipeState.value.isDragging) return

    const touch = e.touches[0]
    swipeState.value.currentX = touch.clientX
    swipeState.value.hasMoved = true

    const deltaX = swipeState.value.currentX - swipeState.value.startX

    // 視覚的フィードバック
    if (element.value) {
      // 左スワイプのみ許可
      if (deltaX < 0) {
        const translateX = Math.max(deltaX, -120) // 最大120px移動
        element.value.style.transform = `translateX(${translateX}px)`
        
        // undoアイコンの表示度を調整
        const opacity = Math.min(Math.abs(translateX) / threshold, 1)
        const undoBackground = element.value.parentElement?.querySelector('.undo-background') as HTMLElement
        if (undoBackground) {
          undoBackground.style.opacity = opacity.toString()
        }
      }
    }
  }

  // タッチ終了
  const handleTouchEnd = () => {
    if (!swipeState.value.isDragging) return

    const deltaX = swipeState.value.currentX - swipeState.value.startX
    const timeDelta = Date.now() - swipeState.value.startTime

    // トランジションを復活
    if (element.value) {
      element.value.style.transition = 'transform 0.3s ease-out'
    }

    // スワイプ判定
    const isValidSwipe = swipeState.value.hasMoved && timeDelta < timeLimit

    if (isValidSwipe && deltaX <= -threshold) {
      // 左スワイプ
      onSwipeLeft?.()
    } else if (isValidSwipe && deltaX >= threshold) {
      // 右スワイプ
      onSwipeRight?.()
    } else {
      // 元の位置に戻す
      resetPosition()
    }

    // 状態をリセット
    swipeState.value.isDragging = false
    swipeState.value.hasMoved = false
  }

  // 位置をリセット
  const resetPosition = () => {
    if (element.value) {
      element.value.style.transform = 'translateX(0)'
      const undoBackground = element.value.parentElement?.querySelector('.undo-background') as HTMLElement
      if (undoBackground) {
        undoBackground.style.opacity = '0'
      }
    }
  }

  // イベントリスナーを登録
  const attachListeners = () => {
    if (!element.value) return

    element.value.addEventListener('touchstart', handleTouchStart, { passive: true })
    element.value.addEventListener('touchmove', handleTouchMove, { passive: true })
    element.value.addEventListener('touchend', handleTouchEnd, { passive: true })
  }

  // イベントリスナーを削除
  const detachListeners = () => {
    if (!element.value) return

    element.value.removeEventListener('touchstart', handleTouchStart)
    element.value.removeEventListener('touchmove', handleTouchMove)
    element.value.removeEventListener('touchend', handleTouchEnd)
  }

  return {
    swipeState: readonly(swipeState),
    attachListeners,
    detachListeners,
    resetPosition
  }
}