// テーマの状態管理

import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useDark, useToggle } from '@vueuse/core'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', () => {
  // VueUse の useDark を使用（localStorage自動管理、システムテーマ検出、DOM操作すべて自動）
  const isDarkMode = useDark({
    selector: 'html',
    attribute: 'data-theme',
    valueDark: 'dark',
    valueLight: 'light',
    storageKey: 'theme',
    storage: typeof localStorage !== 'undefined' ? localStorage : undefined
  })
  
  const toggleDark = useToggle(isDarkMode)

  // getters
  const theme = computed<Theme>(() => isDarkMode.value ? 'dark' : 'light')
  const isDark = computed(() => isDarkMode.value)
  const isLight = computed(() => !isDarkMode.value)
  
  // テーマボタンの表示情報（アプリ固有のUI要件）
  const themeButtonInfo = computed(() => {
    if (isDarkMode.value) {
      return {
        icon: '☀️',
        text: 'ライト'
      }
    } else {
      return {
        icon: '🌙',
        text: 'ダーク'
      }
    }
  })

  // actions
  function setTheme(newTheme: Theme): void {
    isDarkMode.value = newTheme === 'dark'
  }

  function toggleTheme(): void {
    toggleDark()
  }

  // 既存の API 互換性のための初期化関数（useDark が自動処理するため実質何もしない）
  function initializeTheme(): void {
    // useDark が自動的に localStorage から読み込み、システムテーマを検出し、DOM に適用
    // 明示的な初期化は不要だが、既存コードとの互換性のため関数を保持
  }

  return {
    // state（reactive）
    theme,
    isDark,
    isLight,
    themeButtonInfo,
    
    // actions
    setTheme,
    toggleTheme,
    initializeTheme
  }
})