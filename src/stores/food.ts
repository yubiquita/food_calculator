// 食品データの状態管理

import { defineStore } from 'pinia'
import type { 
  Food, 
  HistoryEntry, 
  StateSnapshot,
  HistoryType
} from '../types'
import { 
  getDependentFoods, 
  calculateWeight,
  isCalculationValid
} from '../utils/calculation'
import { getCurrentTimeString, safeParseFloat } from '../utils'
import { useToastStore } from './toast'

export const useFoodStore = defineStore('food', {
  state: () => ({
    foods: [] as Food[],
    nextId: 1,
    swipeThreshold: 80 // スワイプでundoを実行する閾値（px）
  }),

  getters: {
    // 食品数を取得
    foodCount: (state) => state.foods.length,
    
    // IDから食品を取得
    getFoodById: (state) => (id: number) => 
      state.foods.find(food => food.id === id),
    
    // 計算関係を持つ食品を取得
    getFoodsWithCalculation: (state) => 
      state.foods.filter(food => food.calculation !== null),
    
    // 特定の食品を参照している食品一覧を取得
    getDependentFoodsById: (state) => (sourceId: number) =>
      getDependentFoods(state.foods, sourceId),
    
    // 食品選択用のオプションを取得（自分以外）
    getFoodOptionsForCalculation: (state) => (excludeId: number) =>
      state.foods
        .filter(food => food.id !== excludeId)
        .map(food => ({
          id: food.id,
          name: food.name,
          weight: food.weight
        })),
    
    // 重量の合計を取得
    getTotalWeight: (state) => 
      state.foods.reduce((sum, food) => sum + food.weight, 0)
  },

  actions: {
    // 新しい食品を追加
    addNewFood(): number {
      const food: Food = {
        id: this.nextId++,
        name: `料理${this.foods.length + 1}`,
        weight: 0,
        calculation: null,
        history: [],
        stateHistory: []
      }
      
      this.foods.push(food)
      return food.id
    },

    // 食品名を更新
    updateFoodName(id: number, name: string): void {
      const food = this.getFoodById(id)
      if (food) {
        food.name = name.trim()
      }
    },

    // 状態スナップショットを作成
    createStateSnapshot(food: Food): StateSnapshot {
      return {
        weight: food.weight,
        calculation: food.calculation ? { ...food.calculation } : null
      }
    },

    // 状態スナップショットから復元
    restoreFromSnapshot(food: Food, snapshot: StateSnapshot): void {
      food.weight = snapshot.weight
      food.calculation = snapshot.calculation ? { ...snapshot.calculation } : null
    },

    // 履歴エントリを作成
    createHistoryEntry(
      type: HistoryType, 
      value: number, 
      sourceName?: string, 
      multiplier?: number
    ): HistoryEntry {
      return {
        type,
        value,
        timestamp: getCurrentTimeString(),
        ...(sourceName && { sourceName }),
        ...(multiplier && { multiplier })
      }
    },

    // 履歴に操作を追加
    addToHistory(food: Food, historyEntry: HistoryEntry): void {
      if (!food.history) food.history = []
      food.history.push(historyEntry)
    },

    // 重量を加算
    addWeight(id: number, weight: string | number): void {
      const food = this.getFoodById(id)
      if (!food) return

      const weightValue = safeParseFloat(weight)
      if (weightValue === 0) return

      // 操作前の状態を保存
      if (!food.stateHistory) food.stateHistory = []
      food.stateHistory.push(this.createStateSnapshot(food))

      food.weight += weightValue
      this.addToHistory(food, this.createHistoryEntry('add', weightValue))

      // 手動操作時は計算関係をクリア
      food.calculation = null

      // 依存食品の自動再計算
      this.recalculateDependent(id)
    },

    // 重量を減算
    subtractWeight(id: number, weight: string | number): void {
      const food = this.getFoodById(id)
      if (!food) return

      const weightValue = safeParseFloat(weight)
      if (weightValue === 0) return

      // 操作前の状態を保存
      if (!food.stateHistory) food.stateHistory = []
      food.stateHistory.push(this.createStateSnapshot(food))

      food.weight -= weightValue
      this.addToHistory(food, this.createHistoryEntry('subtract', weightValue))

      // 手動操作時は計算関係をクリア
      food.calculation = null

      // 依存食品の自動再計算
      this.recalculateDependent(id)
    },

    // 計算による重量更新
    updateCalculation(id: number, sourceId: number, multiplier: string | number): void {
      const food = this.getFoodById(id)
      const sourceFood = this.getFoodById(sourceId)
      
      if (!food || !sourceFood) return

      const multiplierValue = safeParseFloat(multiplier)
      if (multiplierValue <= 0) return

      // 計算の妥当性チェック
      if (!isCalculationValid(this.foods, id, sourceId, multiplierValue)) {
        const toastStore = useToastStore()
        toastStore.showToast('循環参照のため計算できません', 'warning')
        return
      }

      // 操作前の状態を保存
      if (!food.stateHistory) food.stateHistory = []
      food.stateHistory.push(this.createStateSnapshot(food))

      const calculatedWeight = calculateWeight(sourceFood.weight, multiplierValue)

      food.calculation = {
        sourceId,
        multiplier: multiplierValue
      }
      food.weight += calculatedWeight

      this.addToHistory(food, this.createHistoryEntry(
        'calculation', 
        calculatedWeight, 
        sourceFood.name, 
        multiplierValue
      ))
    },

    // 依存する食品の自動再計算
    recalculateDependent(changedFoodId: number): void {
      const dependentFoods = this.getDependentFoodsById(changedFoodId)
      
      dependentFoods.forEach(food => {
        const sourceFood = this.getFoodById(food.calculation!.sourceId)
        if (!sourceFood) return

        const newWeight = calculateWeight(sourceFood.weight, food.calculation!.multiplier)
        
        // 重量が変わった場合のみ更新
        if (food.weight !== newWeight) {
          // 操作前の状態を保存
          if (!food.stateHistory) food.stateHistory = []
          food.stateHistory.push(this.createStateSnapshot(food))

          food.weight = newWeight

          // 履歴に自動再計算を記録
          this.addToHistory(food, this.createHistoryEntry(
            'auto_recalculation',
            newWeight,
            sourceFood.name,
            food.calculation!.multiplier
          ))

          // 再帰的に依存関係を更新
          this.recalculateDependent(food.id)
        }
      })
    },

    // 最後の操作をUndo
    undoLastOperation(id: number): void {
      const food = this.getFoodById(id)
      if (!food || !food.history || food.history.length === 0) return

      // 履歴から最後の操作を削除
      food.history.pop()

      // 状態履歴から復元
      if (food.stateHistory && food.stateHistory.length > 0) {
        const previousState = food.stateHistory.pop()!
        this.restoreFromSnapshot(food, previousState)
      } else {
        // 初期状態に戻す
        food.weight = 0
        food.calculation = null
      }

      // 依存食品の自動再計算
      this.recalculateDependent(id)
    },

    // 食品を削除
    deleteFood(id: number): void {
      this.foods = this.foods.filter(food => food.id !== id)
    },

    // 全ての食品を削除
    clearAllFoods(): void {
      this.foods = []
    },

    // スワイプでUndoを実行するかどうかを判定
    shouldTriggerUndo(swipeDistance: number): boolean {
      return Math.abs(swipeDistance) >= this.swipeThreshold
    }
  }
})