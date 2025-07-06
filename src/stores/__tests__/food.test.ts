// 食品ストアのテスト

import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useFoodStore } from '../food'
import { resetStores } from '../../test-utils'

describe('useFoodStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    resetStores()
  })

  describe('基本機能', () => {
    it('新しい食品を追加できる', () => {
      const store = useFoodStore()
      
      const foodId = store.addNewFood()
      
      expect(store.foods).toHaveLength(1)
      expect(store.foods[0]).toMatchObject({
        id: foodId,
        name: '料理1',
        weight: 0,
        calculation: null,
        history: [],
        stateHistory: []
      })
      expect(store.nextId).toBe(2)
    })

    it('複数の食品を追加できる', () => {
      const store = useFoodStore()
      
      const firstId = store.addNewFood()
      const secondId = store.addNewFood()
      
      expect(store.foods).toHaveLength(2)
      expect(store.foods[0].name).toBe('料理1')
      expect(store.foods[1].name).toBe('料理2')
      expect(firstId).toBe(1)
      expect(secondId).toBe(2)
    })

    it('食品名を更新できる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.updateFoodName(foodId, '新しい料理名')
      
      expect(store.foods[0].name).toBe('新しい料理名')
    })

    it('存在しない食品の名前更新は無視される', () => {
      const store = useFoodStore()
      
      store.updateFoodName(999, '存在しない食品')
      
      expect(store.foods).toHaveLength(0)
    })

    it('食品を削除できる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.deleteFood(foodId)
      
      expect(store.foods).toHaveLength(0)
    })

    it('全ての食品を削除できる', () => {
      const store = useFoodStore()
      store.addNewFood()
      store.addNewFood()
      
      store.clearAllFoods()
      
      expect(store.foods).toHaveLength(0)
    })
  })

  describe('重量操作', () => {
    it('重量を加算できる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, 100)
      
      expect(store.foods[0].weight).toBe(100)
      expect(store.foods[0].history).toHaveLength(1)
      expect(store.foods[0].history[0]).toMatchObject({
        type: 'add',
        value: 100
      })
    })

    it('重量を減算できる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      store.addWeight(foodId, 200)
      
      store.subtractWeight(foodId, 50)
      
      expect(store.foods[0].weight).toBe(150)
      expect(store.foods[0].history).toHaveLength(2)
      expect(store.foods[0].history[1]).toMatchObject({
        type: 'subtract',
        value: 50
      })
    })

    it('文字列の重量値も正しく処理される', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, '123.5')
      
      expect(store.foods[0].weight).toBe(123.5)
    })

    it('無効な重量値は無視される', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, 'invalid')
      store.addWeight(foodId, 0)
      
      expect(store.foods[0].weight).toBe(0)
      expect(store.foods[0].history).toHaveLength(0)
    })

    it('重量操作時に状態履歴が保存される', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, 100)
      
      expect(store.foods[0].stateHistory).toHaveLength(1)
      expect(store.foods[0].stateHistory[0]).toMatchObject({
        weight: 0,
        calculation: null
      })
    })

    it('手動操作時に計算関係がクリアされる', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      // 最初に計算関係を設定
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.5)
      
      // 手動で重量を変更
      store.addWeight(food2Id, 25)
      
      expect(store.foods[1].calculation).toBeNull()
    })
  })

  describe('計算機能', () => {
    it('他の食品から重量を計算できる', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.6)
      
      expect(store.foods[1].weight).toBe(60)
      expect(store.foods[1].calculation).toMatchObject({
        sourceId: food1Id,
        multiplier: 0.6
      })
    })

    it('計算時に履歴が記録される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.updateFoodName(food1Id, 'ソース料理')
      store.addWeight(food1Id, 200)
      store.updateCalculation(food2Id, food1Id, 0.25)
      
      const history = store.foods[1].history
      expect(history).toHaveLength(1)
      expect(history[0]).toMatchObject({
        type: 'calculation',
        value: 50,
        sourceName: 'ソース料理',
        multiplier: 0.25
      })
    })

    it('自己参照の循環参照は拒否される', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.updateCalculation(foodId, foodId, 1.0)
      
      expect(store.foods[0].calculation).toBeNull()
      expect(store.foods[0].weight).toBe(0)
    })

    it('無効な乗数は無視される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0)
      
      expect(store.foods[1].calculation).toBeNull()
      expect(store.foods[1].weight).toBe(0)
    })
  })

  describe('自動再計算機能', () => {
    it('参照元の重量変更時に依存食品が自動更新される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      // 初期設定
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.5)
      expect(store.foods[1].weight).toBe(50)
      
      // 参照元の重量を変更
      store.addWeight(food1Id, 100)
      
      // 依存食品が自動更新される
      expect(store.foods[1].weight).toBe(100) // (100 + 100) * 0.5
    })

    it('多段階の依存関係も自動更新される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      const food3Id = store.addNewFood()
      
      // A → B → C の依存関係を構築
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.5)
      store.updateCalculation(food3Id, food2Id, 2.0)
      
      expect(store.foods[1].weight).toBe(50)  // A * 0.5
      expect(store.foods[2].weight).toBe(100) // B * 2.0
      
      // Aを変更
      store.addWeight(food1Id, 100)
      
      expect(store.foods[1].weight).toBe(100) // (100 + 100) * 0.5
      expect(store.foods[2].weight).toBe(200) // 100 * 2.0
    })

    it('自動再計算の履歴が記録される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.updateFoodName(food1Id, 'ソース料理')
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.5)
      
      // 参照元を変更
      store.addWeight(food1Id, 100)
      
      const history = store.foods[1].history
      expect(history).toHaveLength(2)
      expect(history[1]).toMatchObject({
        type: 'auto_recalculation',
        value: 100,
        sourceName: 'ソース料理',
        multiplier: 0.5
      })
    })
  })

  describe('Undo機能', () => {
    it('最後の操作をUndoできる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, 100)
      expect(store.foods[0].weight).toBe(100)
      
      store.undoLastOperation(foodId)
      
      expect(store.foods[0].weight).toBe(0)
      expect(store.foods[0].history).toHaveLength(0)
    })

    it('複数回の操作をUndo できる', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.addWeight(foodId, 100)
      store.addWeight(foodId, 50)
      store.subtractWeight(foodId, 25)
      
      expect(store.foods[0].weight).toBe(125)
      expect(store.foods[0].history).toHaveLength(3)
      
      // 1回目のUndo
      store.undoLastOperation(foodId)
      expect(store.foods[0].weight).toBe(150)
      expect(store.foods[0].history).toHaveLength(2)
      
      // 2回目のUndo
      store.undoLastOperation(foodId)
      expect(store.foods[0].weight).toBe(100)
      expect(store.foods[0].history).toHaveLength(1)
    })

    it('履歴がない場合のUndoは無視される', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      store.undoLastOperation(foodId)
      
      expect(store.foods[0].weight).toBe(0)
    })

    it('Undo時に依存食品も自動更新される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.addWeight(food1Id, 100)
      store.updateCalculation(food2Id, food1Id, 0.5)
      store.addWeight(food1Id, 100)
      
      expect(store.foods[1].weight).toBe(100)
      
      // food1をUndo
      store.undoLastOperation(food1Id)
      
      expect(store.foods[1].weight).toBe(50) // 依存食品も更新される
    })
  })

  describe('ゲッター', () => {
    it('foodCount が正しく計算される', () => {
      const store = useFoodStore()
      
      expect(store.foodCount).toBe(0)
      
      store.addNewFood()
      expect(store.foodCount).toBe(1)
      
      store.addNewFood()
      expect(store.foodCount).toBe(2)
    })

    it('getFoodById が正しく動作する', () => {
      const store = useFoodStore()
      const foodId = store.addNewFood()
      
      const food = store.getFoodById(foodId)
      expect(food).toBeDefined()
      expect(food?.id).toBe(foodId)
      
      const nonExistent = store.getFoodById(999)
      expect(nonExistent).toBeUndefined()
    })

    it('getFoodOptionsForCalculation が自分以外を返す', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      store.updateFoodName(food1Id, '料理A')
      store.updateFoodName(food2Id, '料理B')
      
      const options = store.getFoodOptionsForCalculation(food1Id)
      
      expect(options).toHaveLength(1)
      expect(options[0]).toMatchObject({
        id: food2Id,
        name: '料理B'
      })
    })

    it('getTotalWeight が正しく計算される', () => {
      const store = useFoodStore()
      const food1Id = store.addNewFood()
      const food2Id = store.addNewFood()
      
      expect(store.getTotalWeight).toBe(0)
      
      store.addWeight(food1Id, 100)
      store.addWeight(food2Id, 150)
      
      expect(store.getTotalWeight).toBe(250)
    })
  })

  describe('スワイプ判定', () => {
    it('閾値以上のスワイプでUndo判定される', () => {
      const store = useFoodStore()
      
      expect(store.shouldTriggerUndo(-100)).toBe(true)
      expect(store.shouldTriggerUndo(-80)).toBe(true)
      expect(store.shouldTriggerUndo(-79)).toBe(false)
      expect(store.shouldTriggerUndo(100)).toBe(true) // 絶対値判定
    })
  })
})