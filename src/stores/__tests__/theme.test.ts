// テーマストアのテスト

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useThemeStore } from '../theme'
import { resetStores } from '../../test-utils'

describe('useThemeStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetStores()
  })

  describe('基本機能', () => {
    it('初期テーマはライトテーマ', () => {
      const store = useThemeStore()
      
      expect(store.theme).toBe('light')
      expect(store.isLight).toBe(true)
      expect(store.isDark).toBe(false)
    })

    it('テーマを設定できる', () => {
      const store = useThemeStore()
      
      store.setTheme('dark')
      
      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
      expect(store.isLight).toBe(false)
    })

    it('テーマを切り替えできる', () => {
      const store = useThemeStore()
      
      expect(store.theme).toBe('light')
      
      store.toggleTheme()
      expect(store.theme).toBe('dark')
      
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })
  })

  describe('テーマボタン情報', () => {
    it('ライトテーマ時はダークテーマへの切り替えボタン情報を返す', () => {
      const store = useThemeStore()
      
      const info = store.themeButtonInfo
      
      expect(info.icon).toBe('🌙')
      expect(info.text).toBe('ダーク')
    })

    it('ダークテーマ時はライトテーマへの切り替えボタン情報を返す', () => {
      const store = useThemeStore()
      
      store.setTheme('dark')
      const info = store.themeButtonInfo
      
      expect(info.icon).toBe('☀️')
      expect(info.text).toBe('ライト')
    })
  })

  describe('互換性API', () => {
    it('initializeTheme メソッドが存在し、呼び出してもエラーにならない', () => {
      const store = useThemeStore()
      
      expect(typeof store.initializeTheme).toBe('function')
      expect(() => store.initializeTheme()).not.toThrow()
    })

    it('setTheme メソッドで正しくテーマが切り替わる', () => {
      const store = useThemeStore()
      
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
      
      store.setTheme('light')
      expect(store.theme).toBe('light')
    })

    it('toggleTheme メソッドで正しくテーマが切り替わる', () => {
      const store = useThemeStore()
      
      // 初期状態はライト
      expect(store.theme).toBe('light')
      
      // ダークに切り替わる
      store.toggleTheme()
      expect(store.theme).toBe('dark')
      
      // ライトに戻る
      store.toggleTheme()
      expect(store.theme).toBe('light')
    })
  })

  describe('リアクティブ性', () => {
    it('テーマ変更時にゲッターが適切に更新される', () => {
      const store = useThemeStore()
      
      // 初期状態
      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
      expect(store.isLight).toBe(true)
      
      // ダークテーマに変更
      store.setTheme('dark')
      expect(store.theme).toBe('dark')
      expect(store.isDark).toBe(true)
      expect(store.isLight).toBe(false)
      
      // ライトテーマに戻す
      store.setTheme('light')
      expect(store.theme).toBe('light')
      expect(store.isDark).toBe(false)
      expect(store.isLight).toBe(true)
    })

    it('themeButtonInfoがテーマ変更に応じて更新される', () => {
      const store = useThemeStore()
      
      // ライトテーマ時
      expect(store.themeButtonInfo.icon).toBe('🌙')
      expect(store.themeButtonInfo.text).toBe('ダーク')
      
      // ダークテーマに変更
      store.setTheme('dark')
      expect(store.themeButtonInfo.icon).toBe('☀️')
      expect(store.themeButtonInfo.text).toBe('ライト')
    })
  })
})