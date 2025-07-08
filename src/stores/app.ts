// アプリケーション全体の状態管理

import { defineStore } from 'pinia'
import { useFoodStore } from './food'
import { useDishStore } from './dish'
import { useThemeStore } from './theme'
import { useToastStore } from './toast'
import { saveData, loadData } from '../utils/storage'
import type { SavedData } from '../types'

export const useAppStore = defineStore('app', {
  state: () => ({
    isInitialized: false,
    isLoading: false,
    version: '2.0.0' // Vue版のバージョン
  }),

  getters: {
    // アプリケーションの初期化状態
    initialized: (state) => state.isInitialized,
    
    // ローディング状態
    loading: (state) => state.isLoading,
    
    // アプリケーションバージョン
    appVersion: (state) => state.version
  },

  actions: {
    // アプリケーションを初期化
    async initialize(): Promise<void> {
      if (this.isInitialized) return

      this.isLoading = true

      try {
        // テーマストアを取得
        const themeStore = useThemeStore()
        
        // 保存されたデータを読み込み
        await this.loadAppData()
        
        // テーマを初期化
        themeStore.initializeTheme()
        
        // VueUse の useDark が自動的にlocalStorageを管理するため、
        // 明示的なテーマ変更監視は不要

        this.isInitialized = true
      } catch (error) {
        console.error('Failed to initialize app:', error)
        
        // 初期化に失敗した場合はデフォルト状態にリセット
        this.resetToDefault()
      } finally {
        this.isLoading = false
      }
    },

    // アプリケーションデータを保存
    saveAppData(): void {
      try {
        const foodStore = useFoodStore()
        const dishStore = useDishStore()
        const themeStore = useThemeStore()

        const data: SavedData = {
          foods: foodStore.foods,
          dishes: dishStore.dishes,
          nextId: foodStore.nextId,
          theme: themeStore.theme
        }

        saveData(data)
        // VueUse の useDark が自動的にlocalStorageを管理するため、
        // 明示的なテーマ保存は不要
      } catch (error) {
        console.error('Failed to save app data:', error)
        
        const toastStore = useToastStore()
        toastStore.showError('データの保存に失敗しました')
      }
    },

    // アプリケーションデータを読み込み
    async loadAppData(): Promise<void> {
      try {
        const data = loadData()
        if (!data) return

        const foodStore = useFoodStore()
        const dishStore = useDishStore()
        const themeStore = useThemeStore()

        // データの妥当性チェックと復元
        if (Array.isArray(data.foods)) {
          // 食品データの復元時に履歴と状態履歴を確実に初期化
          foodStore.foods = data.foods.map(food => ({
            ...food,
            history: food.history || [],
            stateHistory: food.stateHistory || []
          }))
        }

        if (Array.isArray(data.dishes)) {
          dishStore.dishes = data.dishes
        }

        if (typeof data.nextId === 'number') {
          foodStore.nextId = data.nextId
        }

        if (data.theme === 'light' || data.theme === 'dark') {
          themeStore.setTheme(data.theme)
        }
      } catch (error) {
        console.error('Failed to load app data:', error)
        
        const toastStore = useToastStore()
        toastStore.showWarning('保存されたデータの読み込みに失敗しました')
      }
    },

    // デフォルト状態にリセット
    resetToDefault(): void {
      const foodStore = useFoodStore()
      const dishStore = useDishStore()
      const toastStore = useToastStore()

      // 各ストアをリセット
      foodStore.$reset()
      dishStore.$reset()
      toastStore.clearAllToasts()
      
      // VueUse の useDark が自動的にシステム設定を検出するため、
      // 明示的なシステムテーマ設定は不要

      this.isInitialized = true
    },

    // 全データをクリア
    clearAllData(): void {
      const foodStore = useFoodStore()
      const dishStore = useDishStore()
      const toastStore = useToastStore()

      foodStore.clearAllFoods()
      dishStore.clearAllDishes()
      toastStore.clearAllToasts()

      this.saveAppData()
    },

    // データエクスポート用の情報を取得
    getExportData(): SavedData {
      const foodStore = useFoodStore()
      const dishStore = useDishStore()
      const themeStore = useThemeStore()

      return {
        foods: foodStore.foods,
        dishes: dishStore.dishes,
        nextId: foodStore.nextId,
        theme: themeStore.theme
      }
    },

    // データをインポート
    importData(data: SavedData): boolean {
      try {
        const foodStore = useFoodStore()
        const dishStore = useDishStore()
        const themeStore = useThemeStore()

        // データの妥当性チェック
        if (!this.validateImportData(data)) {
          const toastStore = useToastStore()
          toastStore.showError('無効なデータ形式です')
          return false
        }

        // データを復元
        foodStore.foods = data.foods.map(food => ({
          ...food,
          history: food.history || [],
          stateHistory: food.stateHistory || []
        }))
        dishStore.dishes = data.dishes
        foodStore.nextId = data.nextId
        themeStore.setTheme(data.theme)

        // 保存
        this.saveAppData()

        const toastStore = useToastStore()
        toastStore.showSuccess('データのインポートが完了しました')
        return true
      } catch (error) {
        console.error('Failed to import data:', error)
        
        const toastStore = useToastStore()
        toastStore.showError('データのインポートに失敗しました')
        return false
      }
    },

    // インポートデータの妥当性チェック
    validateImportData(data: any): data is SavedData {
      if (!data || typeof data !== 'object') return false
      if (!Array.isArray(data.foods)) return false
      if (!Array.isArray(data.dishes)) return false
      if (typeof data.nextId !== 'number') return false
      if (data.theme !== 'light' && data.theme !== 'dark') return false
      
      return true
    },

    // アプリケーション統計情報を取得
    getAppStats() {
      const foodStore = useFoodStore()
      const dishStore = useDishStore()

      return {
        version: this.version,
        foodCount: foodStore.foodCount,
        dishCount: dishStore.dishCount,
        totalWeight: foodStore.getTotalWeight,
        initialized: this.isInitialized
      }
    }
  }
})