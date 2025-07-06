// 食器プリセットの状態管理

import { defineStore } from 'pinia'
import type { Dish } from '../types'
import { safeParseFloat } from '../utils'

export const useDishStore = defineStore('dish', {
  state: () => ({
    dishes: [] as Dish[]
  }),

  getters: {
    // 食器数を取得
    dishCount: (state) => state.dishes.length,
    
    // 食器選択用のオプションを取得
    getDishOptions: (state) => 
      state.dishes.map((dish, index) => ({
        index,
        name: dish.name,
        weight: dish.weight,
        displayText: `${dish.name} ${dish.weight}g`
      })),
    
    // インデックスから食器を取得
    getDishByIndex: (state) => (index: number) => 
      state.dishes[index] || null
  },

  actions: {
    // 新しい食器を追加
    addDish(name: string, weight: string | number): boolean {
      const trimmedName = name.trim()
      const weightValue = safeParseFloat(weight)
      
      // バリデーション
      if (!trimmedName) {
        return false
      }
      if (weightValue <= 0) {
        return false
      }
      
      // 同じ名前の食器が既に存在するかチェック
      const existingDish = this.dishes.find(dish => 
        dish.name.toLowerCase() === trimmedName.toLowerCase()
      )
      if (existingDish) {
        return false
      }

      // 食器を追加
      this.dishes.push({
        name: trimmedName,
        weight: weightValue
      })
      
      return true
    },

    // 食器を削除
    deleteDish(index: number): void {
      if (index >= 0 && index < this.dishes.length) {
        this.dishes.splice(index, 1)
      }
    },

    // 食器を更新
    updateDish(index: number, name: string, weight: string | number): boolean {
      const dish = this.getDishByIndex(index)
      if (!dish) return false

      const trimmedName = name.trim()
      const weightValue = safeParseFloat(weight)
      
      // バリデーション
      if (!trimmedName || weightValue <= 0) {
        return false
      }

      // 同じ名前の食器が他に存在するかチェック（自分以外）
      const existingDish = this.dishes.find((d, i) => 
        i !== index && d.name.toLowerCase() === trimmedName.toLowerCase()
      )
      if (existingDish) {
        return false
      }

      // 食器を更新
      dish.name = trimmedName
      dish.weight = weightValue
      
      return true
    },

    // 全ての食器を削除
    clearAllDishes(): void {
      this.dishes = []
    },

    // 名前で食器を検索
    findDishByName(name: string): Dish | null {
      return this.dishes.find(dish => 
        dish.name.toLowerCase() === name.toLowerCase()
      ) || null
    },

    // 食器を重量でソート
    sortDishesByWeight(ascending: boolean = true): void {
      this.dishes.sort((a, b) => 
        ascending ? a.weight - b.weight : b.weight - a.weight
      )
    },

    // 食器を名前でソート
    sortDishesByName(ascending: boolean = true): void {
      this.dishes.sort((a, b) => {
        const nameA = a.name.toLowerCase()
        const nameB = b.name.toLowerCase()
        
        if (ascending) {
          return nameA < nameB ? -1 : nameA > nameB ? 1 : 0
        } else {
          return nameA > nameB ? -1 : nameA < nameB ? 1 : 0
        }
      })
    },

    // デフォルトの食器プリセットを追加
    addDefaultDishes(): void {
      const defaultDishes = [
        { name: '茶碗', weight: 120 },
        { name: '皿（小）', weight: 80 },
        { name: '皿（中）', weight: 150 },
        { name: '皿（大）', weight: 250 },
        { name: 'カップ', weight: 90 },
        { name: 'ボウル', weight: 180 }
      ]

      defaultDishes.forEach(dish => {
        // 既に存在しない場合のみ追加
        if (!this.findDishByName(dish.name)) {
          this.dishes.push(dish)
        }
      })
    },

    // 食器データの妥当性チェック
    validateDishes(): boolean {
      return this.dishes.every(dish => 
        dish.name && 
        dish.name.trim().length > 0 && 
        typeof dish.weight === 'number' && 
        dish.weight > 0
      )
    }
  }
})