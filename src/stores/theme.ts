// テーマの状態管理

import { defineStore } from 'pinia'

export type Theme = 'light' | 'dark'

export const useThemeStore = defineStore('theme', {
  state: () => ({
    currentTheme: 'light' as Theme
  }),

  getters: {
    // 現在のテーマを取得
    theme: (state) => state.currentTheme,
    
    // ダークテーマかどうか
    isDark: (state) => state.currentTheme === 'dark',
    
    // ライトテーマかどうか
    isLight: (state) => state.currentTheme === 'light',
    
    // テーマボタンの表示情報
    themeButtonInfo: (state) => {
      if (state.currentTheme === 'dark') {
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
    }
  },

  actions: {
    // テーマを設定
    setTheme(theme: Theme): void {
      this.currentTheme = theme
      this.applyThemeToDocument()
    },

    // テーマを切り替え
    toggleTheme(): void {
      const newTheme = this.currentTheme === 'light' ? 'dark' : 'light'
      this.setTheme(newTheme)
    },

    // ドキュメントにテーマを適用
    applyThemeToDocument(): void {
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', this.currentTheme)
      }
    },

    // システムのテーマ設定を検出
    detectSystemTheme(): Theme {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        return mediaQuery.matches ? 'dark' : 'light'
      }
      return 'light'
    },

    // システムテーマに合わせて設定
    setSystemTheme(): void {
      const systemTheme = this.detectSystemTheme()
      this.setTheme(systemTheme)
    },

    // システムテーマの変更を監視
    watchSystemTheme(): void {
      if (typeof window !== 'undefined' && window.matchMedia) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        
        const handleChange = (e: MediaQueryListEvent) => {
          const newTheme = e.matches ? 'dark' : 'light'
          this.setTheme(newTheme)
        }

        // モダンブラウザ
        if (mediaQuery.addEventListener) {
          mediaQuery.addEventListener('change', handleChange)
        } 
        // 古いブラウザ対応
        else if (mediaQuery.addListener) {
          mediaQuery.addListener(handleChange)
        }
      }
    },

    // テーマ設定を初期化
    initializeTheme(): void {
      // 保存されたテーマがあれば使用、なければシステムテーマを使用
      const savedTheme = this.loadThemeFromStorage()
      if (savedTheme) {
        this.setTheme(savedTheme)
      } else {
        this.setSystemTheme()
      }
    },

    // LocalStorageからテーマを読み込み
    loadThemeFromStorage(): Theme | null {
      if (typeof localStorage !== 'undefined') {
        try {
          const saved = localStorage.getItem('theme')
          if (saved === 'light' || saved === 'dark') {
            return saved
          }
        } catch (error) {
          console.warn('Failed to load theme from localStorage:', error)
        }
      }
      return null
    },

    // LocalStorageにテーマを保存
    saveThemeToStorage(): void {
      if (typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('theme', this.currentTheme)
        } catch (error) {
          console.warn('Failed to save theme to localStorage:', error)
        }
      }
    },

    // テーマ変更時の処理を追加
    onThemeChange(callback: (theme: Theme) => void): void {
      // Piniaのwatcherを使用してテーマ変更を監視
      this.$subscribe((_mutation, state) => {
        callback(state.currentTheme)
      })
    }
  }
})