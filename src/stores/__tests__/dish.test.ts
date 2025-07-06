// 食器ストアのテスト

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useDishStore } from '../dish'
import { resetStores } from '../../test-utils'

describe('useDishStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetStores()
  })

  describe('基本機能', () => {
    it('新しい食器を追加できる', () => {
      const store = useDishStore()
      
      const success = store.addDish('茶碗', 120)
      
      expect(success).toBe(true)
      expect(store.dishes).toHaveLength(1)
      expect(store.dishes[0]).toMatchObject({
        name: '茶碗',
        weight: 120
      })
    })

    it('文字列の重量も正しく処理される', () => {
      const store = useDishStore()
      
      const success = store.addDish('皿', '150.5')
      
      expect(success).toBe(true)
      expect(store.dishes[0].weight).toBe(150.5)
    })

    it('無効な名前の食器は追加されない', () => {
      const store = useDishStore()
      
      const success1 = store.addDish('', 100)
      const success2 = store.addDish('   ', 100)
      
      expect(success1).toBe(false)
      expect(success2).toBe(false)
      expect(store.dishes).toHaveLength(0)
    })

    it('無効な重量の食器は追加されない', () => {
      const store = useDishStore()
      
      const success1 = store.addDish('茶碗', 0)
      const success2 = store.addDish('茶碗', -10)
      const success3 = store.addDish('茶碗', 'invalid')
      
      expect(success1).toBe(false)
      expect(success2).toBe(false)
      expect(success3).toBe(false)
      expect(store.dishes).toHaveLength(0)
    })

    it('同じ名前の食器は追加されない', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      const success = store.addDish('茶碗', 130)
      
      expect(success).toBe(false)
      expect(store.dishes).toHaveLength(1)
      expect(store.dishes[0].weight).toBe(120) // 元の値のまま
    })

    it('大文字小文字を区別せずに重複チェックする', () => {
      const store = useDishStore()
      
      store.addDish('Chawan', 120)
      const success = store.addDish('chawan', 130)
      
      expect(success).toBe(false)
      expect(store.dishes).toHaveLength(1)
    })

    it('食器を削除できる', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      store.addDish('皿', 150)
      
      store.deleteDish(0)
      
      expect(store.dishes).toHaveLength(1)
      expect(store.dishes[0].name).toBe('皿')
    })

    it('無効なインデックスでの削除は無視される', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      store.deleteDish(-1)
      store.deleteDish(1)
      
      expect(store.dishes).toHaveLength(1)
    })

    it('食器を更新できる', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      const success = store.updateDish(0, '大茶碗', 140)
      
      expect(success).toBe(true)
      expect(store.dishes[0]).toMatchObject({
        name: '大茶碗',
        weight: 140
      })
    })

    it('無効な値での更新は失敗する', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      const success1 = store.updateDish(0, '', 140)
      const success2 = store.updateDish(0, '茶碗', 0)
      
      expect(success1).toBe(false)
      expect(success2).toBe(false)
      expect(store.dishes[0]).toMatchObject({
        name: '茶碗',
        weight: 120
      })
    })

    it('全ての食器を削除できる', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      store.addDish('皿', 150)
      
      store.clearAllDishes()
      
      expect(store.dishes).toHaveLength(0)
    })
  })

  describe('検索・ソート機能', () => {
    beforeEach(() => {
      const store = useDishStore()
      store.addDish('茶碗', 120)
      store.addDish('皿', 150)
      store.addDish('ボウル', 180)
    })

    it('名前で食器を検索できる', () => {
      const store = useDishStore()
      
      const found = store.findDishByName('茶碗')
      const notFound = store.findDishByName('存在しない')
      
      expect(found).toMatchObject({
        name: '茶碗',
        weight: 120
      })
      expect(notFound).toBeNull()
    })

    it('大文字小文字を区別せずに検索する', () => {
      const store = useDishStore()
      
      // アルファベットの食器で確認
      store.addDish('Cup', 90)
      const found = store.findDishByName('cup')
      
      expect(found).toMatchObject({
        name: 'Cup',
        weight: 90
      })
    })

    it('重量で昇順ソートできる', () => {
      const store = useDishStore()
      
      store.sortDishesByWeight(true)
      
      const weights = store.dishes.map(dish => dish.weight)
      expect(weights).toEqual([120, 150, 180])
    })

    it('重量で降順ソートできる', () => {
      const store = useDishStore()
      
      store.sortDishesByWeight(false)
      
      const weights = store.dishes.map(dish => dish.weight)
      expect(weights).toEqual([180, 150, 120])
    })

    it('名前で昇順ソートできる', () => {
      const store = useDishStore()
      
      store.sortDishesByName(true)
      
      const names = store.dishes.map(dish => dish.name)
      expect(names).toEqual(['ボウル', '皿', '茶碗'])
    })

    it('名前で降順ソートできる', () => {
      const store = useDishStore()
      
      store.sortDishesByName(false)
      
      const names = store.dishes.map(dish => dish.name)
      expect(names).toEqual(['茶碗', '皿', 'ボウル'])
    })
  })

  describe('デフォルト食器プリセット', () => {
    it('デフォルト食器を追加できる', () => {
      const store = useDishStore()
      
      store.addDefaultDishes()
      
      expect(store.dishes.length).toBeGreaterThan(0)
      expect(store.findDishByName('茶碗')).toBeTruthy()
      expect(store.findDishByName('皿（小）')).toBeTruthy()
    })

    it('既存の食器は重複追加されない', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 100) // 既存の茶碗
      
      store.addDefaultDishes()
      
      const teawanCount = store.dishes.filter(dish => dish.name === '茶碗').length
      expect(teawanCount).toBe(1)
      expect(store.dishes[0].weight).toBe(100) // 既存の値を維持
    })
  })

  describe('バリデーション', () => {
    it('食器データの妥当性チェックができる', () => {
      const store = useDishStore()
      
      store.addDish('茶碗', 120)
      store.addDish('皿', 150)
      
      expect(store.validateDishes()).toBe(true)
    })

    it('無効なデータがある場合は妥当性チェックが失敗する', () => {
      const store = useDishStore()
      
      // 直接無効なデータを挿入（通常の追加では防止される）
      store.dishes.push({ name: '', weight: 120 })
      store.dishes.push({ name: '茶碗', weight: -10 })
      
      expect(store.validateDishes()).toBe(false)
    })
  })

  describe('ゲッター', () => {
    beforeEach(() => {
      const store = useDishStore()
      store.addDish('茶碗', 120)
      store.addDish('皿', 150)
    })

    it('dishCount が正しく計算される', () => {
      const store = useDishStore()
      
      expect(store.dishCount).toBe(2)
    })

    it('getDishOptions が正しい形式で返される', () => {
      const store = useDishStore()
      
      const options = store.getDishOptions
      
      expect(options).toHaveLength(2)
      expect(options[0]).toMatchObject({
        index: 0,
        name: '茶碗',
        weight: 120,
        displayText: '茶碗 120g'
      })
      expect(options[1]).toMatchObject({
        index: 1,
        name: '皿',
        weight: 150,
        displayText: '皿 150g'
      })
    })

    it('getDishByIndex が正しく動作する', () => {
      const store = useDishStore()
      
      const dish = store.getDishByIndex(0)
      const nonExistent = store.getDishByIndex(999)
      
      expect(dish).toMatchObject({
        name: '茶碗',
        weight: 120
      })
      expect(nonExistent).toBeNull()
    })
  })
})