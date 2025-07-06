// 計算関連のユーティリティ

import type { Food, CircularReferenceResult } from '../types'

/**
 * 循環参照を検出する
 */
export function detectCircularReference(
  foods: Food[],
  sourceId: number,
  targetId: number
): CircularReferenceResult {
  // 自己参照チェック
  if (sourceId === targetId) {
    return { hasCircularReference: true, path: [sourceId] }
  }

  // 深度優先探索で循環参照をチェック
  const visited = new Set<number>()
  const path: number[] = []
  const stack = [sourceId]

  while (stack.length > 0) {
    const currentId = stack.pop()!
    
    if (visited.has(currentId)) {
      continue
    }
    
    if (currentId === targetId) {
      return { hasCircularReference: true, path: [...path, currentId] }
    }
    
    visited.add(currentId)
    path.push(currentId)
    
    // 現在の食品が参照している食品を探す
    const currentFood = foods.find(f => f.id === currentId)
    if (currentFood && currentFood.calculation) {
      stack.push(currentFood.calculation.sourceId)
    }
  }
  
  return { hasCircularReference: false }
}

/**
 * 依存関係を持つ食品を取得
 */
export function getDependentFoods(foods: Food[], changedFoodId: number): Food[] {
  return foods.filter(food => 
    food.calculation && food.calculation.sourceId === changedFoodId
  )
}

/**
 * 計算結果を取得
 */
export function calculateWeight(sourceWeight: number, multiplier: number): number {
  return sourceWeight * multiplier
}

/**
 * 依存関係のグラフを構築
 */
export function buildDependencyGraph(foods: Food[]): Map<number, number[]> {
  const graph = new Map<number, number[]>()
  
  // 全ての食品をグラフに追加
  foods.forEach(food => {
    if (!graph.has(food.id)) {
      graph.set(food.id, [])
    }
  })
  
  // 依存関係を追加
  foods.forEach(food => {
    if (food.calculation) {
      const dependencies = graph.get(food.calculation.sourceId) || []
      dependencies.push(food.id)
      graph.set(food.calculation.sourceId, dependencies)
    }
  })
  
  return graph
}

/**
 * 依存関係の深度を計算
 */
export function calculateDependencyDepth(foods: Food[], foodId: number): number {
  const food = foods.find(f => f.id === foodId)
  if (!food || !food.calculation) {
    return 0
  }
  
  return 1 + calculateDependencyDepth(foods, food.calculation.sourceId)
}

/**
 * 依存関係のチェーンを取得
 */
export function getDependencyChain(foods: Food[], foodId: number): number[] {
  const chain: number[] = []
  const visited = new Set<number>()
  
  let currentId = foodId
  while (currentId !== undefined && !visited.has(currentId)) {
    visited.add(currentId)
    chain.push(currentId)
    
    const food = foods.find(f => f.id === currentId)
    if (food && food.calculation) {
      currentId = food.calculation.sourceId
    } else {
      break
    }
  }
  
  return chain
}

/**
 * 食品の依存関係を削除
 */
export function clearCalculation(food: Food): Food {
  return {
    ...food,
    calculation: null
  }
}

/**
 * 計算が有効かどうかを判定
 */
export function isCalculationValid(
  foods: Food[],
  targetId: number,
  sourceId: number,
  multiplier: number
): boolean {
  // 基本的な妥当性チェック
  if (targetId === sourceId) return false
  if (multiplier <= 0) return false
  
  // 参照元の食品が存在するかチェック
  const sourceFood = foods.find(f => f.id === sourceId)
  if (!sourceFood) return false
  
  // 循環参照チェック
  const circularCheck = detectCircularReference(foods, sourceId, targetId)
  if (circularCheck.hasCircularReference) return false
  
  return true
}