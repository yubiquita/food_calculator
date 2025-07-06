// Vitest テストセットアップ

import { beforeEach, afterEach, vi } from 'vitest'
import { createPinia } from 'pinia'
import { config } from '@vue/test-utils'

// Vue Test Utils のグローバル設定
config.global.plugins = [createPinia()]

// 各テスト前のセットアップ
beforeEach(() => {
  // localStorage のモック
  const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  }
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
    writable: true,
  })

  // clipboard のモック
  const clipboardMock = {
    writeText: vi.fn().mockResolvedValue(undefined),
    readText: vi.fn().mockResolvedValue(''),
  }
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboardMock,
    writable: true,
  })

  // matchMedia のモック（テーマ検出用）
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // タイマーのモック
  vi.useFakeTimers()
})

// 各テスト後のクリーンアップ
afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
})