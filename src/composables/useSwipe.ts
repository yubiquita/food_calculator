// スワイプ操作のComposable

import { ref, readonly, type Ref, onMounted, onUnmounted } from 'vue'
import type { SwipeState } from '../types'

export interface UseSwipeOptions {
  threshold?: number
  timeLimit?: number
  enabled?: () => boolean
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
    enabled = () => true,
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
    // enabled チェック
    if (!enabled()) {
      console.log('⚠️ [useSwipe] スワイプ機能が無効のためtouchstartをスキップ')
      return
    }
    
    console.log('🟢 [useSwipe] touchstart イベント発生')
    const touch = e.touches[0]
    swipeState.value = {
      startX: touch.clientX,
      currentX: touch.clientX,
      startTime: Date.now(),
      isDragging: true,
      hasMoved: false,
      threshold
    }
    console.log('🟢 [useSwipe] 開始位置:', touch.clientX)

    // トランジションを無効化
    if (element.value) {
      element.value.style.transition = 'none'
      console.log('🟢 [useSwipe] トランジション無効化')
    }
  }

  // タッチ移動
  const handleTouchMove = (e: TouchEvent) => {
    // enabled チェック
    if (!enabled()) {
      console.log('⚠️ [useSwipe] スワイプ機能が無効のためtouchmoveをスキップ')
      return
    }
    
    if (!swipeState.value.isDragging) {
      console.log('⚠️ [useSwipe] touchmove: isDragging=false でリターン')
      return
    }

    const touch = e.touches[0]
    swipeState.value.currentX = touch.clientX
    swipeState.value.hasMoved = true

    const deltaX = swipeState.value.currentX - swipeState.value.startX
    console.log('🟡 [useSwipe] touchmove:', {
      currentX: touch.clientX,
      startX: swipeState.value.startX,
      deltaX: deltaX,
      hasMoved: swipeState.value.hasMoved
    })

    // 視覚的フィードバック
    if (element.value) {
      // 左スワイプのみ許可
      if (deltaX < 0) {
        const translateX = Math.max(deltaX, -120) // 最大120px移動
        element.value.style.transform = `translateX(${translateX}px)`
        console.log('🟡 [useSwipe] 要素移動:', translateX)
        
        // undoアイコンの表示度を調整
        const opacity = Math.min(Math.abs(translateX) / threshold, 1)
        const undoBackground = element.value.parentElement?.querySelector('.undo-background') as HTMLElement
        if (undoBackground) {
          undoBackground.style.opacity = opacity.toString()
          console.log('🟡 [useSwipe] undo背景の透明度:', opacity)
        } else {
          console.log('⚠️ [useSwipe] undo背景要素が見つかりません')
        }
      }
    } else {
      console.log('⚠️ [useSwipe] element.valueがnullです')
    }
  }

  // タッチ終了
  const handleTouchEnd = () => {
    console.log('🔴 [useSwipe] touchend イベント発生')
    
    // enabled チェック
    if (!enabled()) {
      console.log('⚠️ [useSwipe] スワイプ機能が無効のためtouchendをスキップ')
      // 状態だけリセット
      swipeState.value.isDragging = false
      swipeState.value.hasMoved = false
      return
    }
    
    if (!swipeState.value.isDragging) {
      console.log('⚠️ [useSwipe] touchend: isDragging=false でリターン')
      return
    }

    const deltaX = swipeState.value.currentX - swipeState.value.startX
    const timeDelta = Date.now() - swipeState.value.startTime

    console.log('🔴 [useSwipe] touchend判定:', {
      deltaX: deltaX,
      timeDelta: timeDelta,
      threshold: threshold,
      timeLimit: timeLimit,
      hasMoved: swipeState.value.hasMoved
    })

    // トランジションを復活
    if (element.value) {
      element.value.style.transition = 'transform 0.3s ease-out'
      console.log('🔴 [useSwipe] トランジション復活')
    }

    // スワイプ判定
    const isValidSwipe = swipeState.value.hasMoved && timeDelta < timeLimit
    console.log('🔴 [useSwipe] 判定結果:', {
      isValidSwipe: isValidSwipe,
      leftSwipe: deltaX <= -threshold,
      rightSwipe: deltaX >= threshold
    })

    if (isValidSwipe && deltaX <= -threshold) {
      // 左スワイプ
      console.log('✅ [useSwipe] 左スワイプ実行')
      onSwipeLeft?.()
      // スワイプ成功後も必ず元の位置に戻す
      setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('🔄 [useSwipe] スワイプ成功後のリセット')
        }
        resetPosition()
      }, 100)
    } else if (isValidSwipe && deltaX >= threshold) {
      // 右スワイプ
      console.log('✅ [useSwipe] 右スワイプ実行')
      onSwipeRight?.()
      // スワイプ成功後も必ず元の位置に戻す
      setTimeout(() => {
        if (import.meta.env.DEV) {
          console.log('🔄 [useSwipe] スワイプ成功後のリセット')
        }
        resetPosition()
      }, 100)
    } else {
      // 元の位置に戻す
      console.log('🔄 [useSwipe] 元の位置に戻す')
      resetPosition()
    }

    // 状態をリセット
    swipeState.value.isDragging = false
    swipeState.value.hasMoved = false
    console.log('🔴 [useSwipe] 状態リセット完了')
  }

  // 位置をリセット
  const resetPosition = () => {
    console.log('🔄 [useSwipe] resetPosition実行')
    if (element.value) {
      element.value.style.transform = 'translateX(0)'
      const undoBackground = element.value.parentElement?.querySelector('.undo-background') as HTMLElement
      if (undoBackground) {
        undoBackground.style.opacity = '0'
        console.log('🔄 [useSwipe] undo背景を非表示')
      } else {
        console.log('⚠️ [useSwipe] resetPosition: undo背景要素が見つかりません')
      }
    } else {
      console.log('⚠️ [useSwipe] resetPosition: element.valueがnullです')
    }
  }

  // イベントリスナーの手動管理
  let cleanup: (() => void) | null = null

  const setupEventListeners = () => {
    if (element.value && !cleanup) {
      console.log('🟢 [useSwipe] イベントリスナーを設定')
      
      const startHandler = (e: TouchEvent) => handleTouchStart(e)
      const moveHandler = (e: TouchEvent) => handleTouchMove(e)
      const endHandler = () => handleTouchEnd()

      element.value.addEventListener('touchstart', startHandler, { passive: true })
      element.value.addEventListener('touchmove', moveHandler, { passive: true })
      element.value.addEventListener('touchend', endHandler, { passive: true })

      cleanup = () => {
        console.log('🟢 [useSwipe] イベントリスナーをクリーンアップ')
        if (element.value) {
          element.value.removeEventListener('touchstart', startHandler)
          element.value.removeEventListener('touchmove', moveHandler)
          element.value.removeEventListener('touchend', endHandler)
        }
      }
    }
  }

  onMounted(() => {
    console.log('🟢 [useSwipe] onMounted')
    setupEventListeners()
  })

  onUnmounted(() => {
    console.log('🟢 [useSwipe] onUnmounted')
    if (cleanup) {
      cleanup()
      cleanup = null
    }
  })

  return {
    swipeState: readonly(swipeState),
    resetPosition,
    setupEventListeners
  }
}