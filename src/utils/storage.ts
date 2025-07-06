// LocalStorage操作のユーティリティ

import type { SavedData } from '../types'

const STORAGE_KEY = 'foodCalculatorData'

/**
 * データをLocalStorageに保存
 */
export function saveData(data: SavedData): void {
  try {
    const jsonData = JSON.stringify(data)
    localStorage.setItem(STORAGE_KEY, jsonData)
  } catch (error) {
    console.error('Failed to save data to localStorage:', error)
    
    // ストレージが満杯の場合の処理
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      // 古いデータを削除して再試行
      try {
        localStorage.clear()
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      } catch (retryError) {
        console.error('Failed to save data after clearing localStorage:', retryError)
      }
    }
  }
}

/**
 * LocalStorageからデータを読み込み
 */
export function loadData(): SavedData | null {
  try {
    const jsonData = localStorage.getItem(STORAGE_KEY)
    if (!jsonData) return null
    
    const data = JSON.parse(jsonData) as SavedData
    
    // データの妥当性チェック
    if (!validateSavedData(data)) {
      console.warn('Invalid data format in localStorage')
      return null
    }
    
    return data
  } catch (error) {
    console.error('Failed to load data from localStorage:', error)
    return null
  }
}

/**
 * 保存されたデータの妥当性を検証
 */
function validateSavedData(data: any): data is SavedData {
  if (!data || typeof data !== 'object') return false
  
  // 必須フィールドの確認
  if (!Array.isArray(data.foods)) return false
  if (!Array.isArray(data.dishes)) return false
  if (typeof data.nextId !== 'number') return false
  if (typeof data.theme !== 'string') return false
  
  // テーマの値チェック
  if (data.theme !== 'light' && data.theme !== 'dark') return false
  
  return true
}

/**
 * LocalStorageをクリア
 */
export function clearData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * LocalStorageが使用可能かチェック
 */
export function isStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__'
    localStorage.setItem(testKey, 'test')
    localStorage.removeItem(testKey)
    return true
  } catch (error) {
    return false
  }
}

/**
 * ストレージの使用量を取得（概算）
 */
export function getStorageUsage(): number {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? new Blob([data]).size : 0
  } catch (error) {
    console.error('Failed to calculate storage usage:', error)
    return 0
  }
}

/**
 * データをエクスポート
 */
export function exportData(): string | null {
  try {
    const data = loadData()
    if (!data) return null
    
    return JSON.stringify(data, null, 2)
  } catch (error) {
    console.error('Failed to export data:', error)
    return null
  }
}

/**
 * データをインポート
 */
export function importData(jsonString: string): boolean {
  try {
    const data = JSON.parse(jsonString)
    
    if (!validateSavedData(data)) {
      console.error('Invalid import data format')
      return false
    }
    
    saveData(data)
    return true
  } catch (error) {
    console.error('Failed to import data:', error)
    return false
  }
}