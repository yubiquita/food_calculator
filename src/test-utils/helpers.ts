// テストヘルパー関数

import { mount, VueWrapper } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { expect, vi } from 'vitest'
import type { Component } from 'vue'
import { useFoodStore, useDishStore, useThemeStore, useToastStore, useAppStore } from '../stores'

/**
 * コンポーネントをマウントするヘルパー
 */
export function mountComponent(component: Component, options: any = {}) {
  const pinia = createPinia()
  
  return mount(component, {
    global: {
      plugins: [pinia],
      ...options.global
    },
    ...options
  })
}

/**
 * ストアをリセットするヘルパー
 */
export function resetStores() {
  const foodStore = useFoodStore()
  const dishStore = useDishStore()
  const themeStore = useThemeStore()
  const toastStore = useToastStore()
  const appStore = useAppStore()

  // 各ストアをリセット
  foodStore.$reset()
  dishStore.$reset()
  toastStore.$reset()
  
  // テーマをデフォルトに戻す
  themeStore.setTheme('light')
  
  // アプリストアもリセット
  appStore.$patch({
    isInitialized: false,
    isLoading: false
  })
}

/**
 * テスト用の食品データを作成
 */
export function createTestFood(overrides: any = {}) {
  return {
    id: 1,
    name: 'テスト料理',
    weight: 0,
    calculation: null,
    history: [],
    stateHistory: [],
    ...overrides
  }
}

/**
 * テスト用の食器データを作成
 */
export function createTestDish(overrides: any = {}) {
  return {
    name: 'テスト食器',
    weight: 100,
    ...overrides
  }
}

/**
 * テスト用のトーストデータを作成
 */
export function createTestToast(overrides: any = {}) {
  return {
    id: 'test-toast-1',
    message: 'テストメッセージ',
    type: 'info' as const,
    duration: 3000,
    ...overrides
  }
}

/**
 * 非同期処理を待つヘルパー
 */
export function flushPromises() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

/**
 * DOM要素が存在することを確認
 */
export function expectElementToExist(wrapper: VueWrapper<any>, selector: string) {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(true)
  return element
}

/**
 * DOM要素が存在しないことを確認
 */
export function expectElementNotToExist(wrapper: VueWrapper<any>, selector: string) {
  const element = wrapper.find(selector)
  expect(element.exists()).toBe(false)
}

/**
 * 入力欄に値を設定してイベントをトリガー
 */
export async function setInputValue(wrapper: VueWrapper<any>, selector: string, value: string) {
  const input = expectElementToExist(wrapper, selector)
  await input.setValue(value)
  await input.trigger('input')
  return input
}

/**
 * ボタンをクリック
 */
export async function clickButton(wrapper: VueWrapper<any>, selector: string) {
  const button = expectElementToExist(wrapper, selector)
  await button.trigger('click')
  return button
}

/**
 * キーイベントをトリガー
 */
export async function triggerKeyEvent(
  wrapper: VueWrapper<any>, 
  selector: string, 
  key: string, 
  eventType: string = 'keydown'
) {
  const element = expectElementToExist(wrapper, selector)
  await element.trigger(eventType, { key })
  return element
}

/**
 * タッチイベントをシミュレート
 */
export async function simulateTouch(
  wrapper: VueWrapper<any>,
  selector: string,
  touches: { clientX: number; clientY: number }[]
) {
  const element = expectElementToExist(wrapper, selector)
  
  await element.trigger('touchstart', {
    touches: touches
  })
  
  await element.trigger('touchmove', {
    touches: touches.map(touch => ({ ...touch, clientX: touch.clientX - 100 }))
  })
  
  await element.trigger('touchend', {
    touches: []
  })
  
  return element
}

/**
 * 要素のテキストコンテンツを確認
 */
export function expectTextContent(wrapper: VueWrapper<any>, selector: string, expectedText: string) {
  const element = expectElementToExist(wrapper, selector)
  expect(element.text()).toContain(expectedText)
  return element
}

/**
 * localStorageのモック値を設定
 */
export function mockLocalStorage(data: any) {
  const localStorage = window.localStorage as any
  vi.mocked(localStorage.getItem).mockReturnValue(JSON.stringify(data))
}