// テーマストアのテスト

import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      
      expect(info).toMatchObject({
        icon: '🌙',
        text: 'ダーク'
      })
    })

    it('ダークテーマ時はライトテーマへの切り替えボタン情報を返す', () => {
      const store = useThemeStore()
      
      store.setTheme('dark')
      const info = store.themeButtonInfo
      
      expect(info).toMatchObject({
        icon: '☀️',
        text: 'ライト'
      })
    })
  })

  describe('ドキュメントへの適用', () => {
    it('テーマ設定時にドキュメントに属性が適用される', () => {
      const store = useThemeStore()
      const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute')
      
      store.setTheme('dark')
      
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark')
    })

    it('applyThemeToDocument メソッドが正しく動作する', () => {
      const store = useThemeStore()
      const setAttributeSpy = vi.spyOn(document.documentElement, 'setAttribute')
      
      store.setTheme('dark')
      store.applyThemeToDocument()
      
      expect(setAttributeSpy).toHaveBeenCalledWith('data-theme', 'dark')
    })
  })

  describe('システムテーマ検出', () => {
    it('matchMediaが利用可能な場合はシステムテーマを検出する', () => {
      const store = useThemeStore()
      
      // ダークテーマのシステム設定をモック
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      const systemTheme = store.detectSystemTheme()
      
      expect(systemTheme).toBe('dark')
    })

    it('matchMediaが利用できない場合はライトテーマを返す', () => {
      const store = useThemeStore()
      
      // @ts-ignore
      window.matchMedia = undefined
      
      const systemTheme = store.detectSystemTheme()
      
      expect(systemTheme).toBe('light')
    })

    it('システムテーマに合わせて設定できる', () => {
      const store = useThemeStore()
      
      // ダークテーマのシステム設定をモック
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      store.setSystemTheme()
      
      expect(store.theme).toBe('dark')
    })
  })

  describe('LocalStorage連携', () => {
    it('LocalStorageにテーマを保存できる', () => {
      const store = useThemeStore()
      const setItemSpy = vi.spyOn(localStorage, 'setItem')
      
      store.setTheme('dark')
      store.saveThemeToStorage()
      
      expect(setItemSpy).toHaveBeenCalledWith('theme', 'dark')
    })

    it('LocalStorageからテーマを読み込める', () => {
      const store = useThemeStore()
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockReturnValue('dark')
      
      const loadedTheme = store.loadThemeFromStorage()
      
      expect(loadedTheme).toBe('dark')
      expect(getItemSpy).toHaveBeenCalledWith('theme')
    })

    it('LocalStorageに無効な値がある場合はnullを返す', () => {
      const store = useThemeStore()
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockReturnValue('invalid-theme')
      
      const loadedTheme = store.loadThemeFromStorage()
      
      expect(loadedTheme).toBeNull()
    })

    it('LocalStorageアクセスに失敗した場合は警告を出してnullを返す', () => {
      const store = useThemeStore()
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      getItemSpy.mockImplementation(() => {
        throw new Error('LocalStorage error')
      })
      
      const loadedTheme = store.loadThemeFromStorage()
      
      expect(loadedTheme).toBeNull()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })
  })

  describe('初期化', () => {
    it('保存されたテーマがある場合はそれを使用する', () => {
      const store = useThemeStore()
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockReturnValue('dark')
      
      store.initializeTheme()
      
      expect(store.theme).toBe('dark')
    })

    it('保存されたテーマがない場合はシステムテーマを使用する', () => {
      const store = useThemeStore()
      const getItemSpy = vi.spyOn(localStorage, 'getItem')
      getItemSpy.mockReturnValue(null)
      
      // ダークテーマのシステム設定をモック
      window.matchMedia = vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }))
      
      store.initializeTheme()
      
      expect(store.theme).toBe('dark')
    })
  })

  describe('テーマ変更の監視', () => {
    it('onThemeChangeメソッドが存在する', () => {
      const store = useThemeStore()
      
      expect(typeof store.onThemeChange).toBe('function')
    })

    it('onThemeChangeコールバックの登録でエラーが発生しない', () => {
      const store = useThemeStore()
      const callback = vi.fn()
      
      expect(() => {
        store.onThemeChange(callback)
      }).not.toThrow()
    })
  })

  describe('システムテーマ変更の監視', () => {
    it('システムテーマ変更の監視を設定できる', () => {
      const store = useThemeStore()
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery)
      
      store.watchSystemTheme()
      
      expect(mockMediaQuery.addEventListener).toHaveBeenCalledWith(
        'change', 
        expect.any(Function)
      )
    })

    it('古いブラウザでもシステムテーマ変更の監視ができる', () => {
      const store = useThemeStore()
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: undefined, // 古いブラウザのシミュレート
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }
      
      window.matchMedia = vi.fn().mockReturnValue(mockMediaQuery)
      
      store.watchSystemTheme()
      
      expect(mockMediaQuery.addListener).toHaveBeenCalledWith(
        expect.any(Function)
      )
    })
  })
})